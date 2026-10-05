'use strict';
const express = require('express');
const repo = require('../repos/applications');
const scholarshipRepo = require('../repos/scholarships');
const userRepo = require('../repos/users');
const { requireAuth } = require('../middleware/auth');
const { applicationDocuments, publicFileUrl } = require('../middleware/upload');
const { validateApplication } = require('../services/applicationForm');
const { templates } = require('../services/emailTemplates');
const notify = require('../services/notify');
const stats = require('../services/stats');
const { asyncHandler, badRequest, notFound, forbidden, conflict } = require('../utils/httpError');
const { APPLICATION_STATUS, APPLICATION_STATUS_META, DOCUMENT_TYPES } = require('../models/constants');

const router = express.Router();

/** Attach scholarship titles so the client does not need extra lookups. */
async function decorate(applications) {
  const cache = new Map();
  const list = Array.isArray(applications) ? applications : [applications];
  const out = [];
  for (const application of list) {
    let scholarship = cache.get(application.scholarshipId);
    if (scholarship === undefined) {
      scholarship = (await scholarshipRepo.findById(application.scholarshipId)) || null;
      cache.set(application.scholarshipId, scholarship);
    }
    out.push({
      ...application,
      scholarshipTitle: scholarship?.title || 'Scholarship',
      scholarshipCategory: scholarship?.category || '',
      statusLabel: APPLICATION_STATUS_META[application.status]?.label || application.status,
    });
  }
  return Array.isArray(applications) ? out : out[0];
}

function collectDocuments(files = {}, bodyDocuments = {}) {
  const documents = {};
  for (const { key, label } of DOCUMENT_TYPES) {
    const uploaded = (files[key] || [])[0];
    if (uploaded) {
      documents[key] = {
        label,
        name: uploaded.originalname,
        url: publicFileUrl(uploaded),
        size: uploaded.size,
        mimetype: uploaded.mimetype,
        uploadedAt: new Date().toISOString(),
      };
    } else if (bodyDocuments[key]) {
      documents[key] = { label, ...bodyDocuments[key] };
    }
  }
  if (files.otherCertificates) {
    documents.otherCertificates = (files.otherCertificates || []).map((file) => ({
      label: 'Other certificate',
      name: file.originalname,
      url: publicFileUrl(file),
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date().toISOString(),
    }));
  }
  return documents;
}

/* ------------------------------------------------------------------ student */

/** POST /api/applications - submit a scholarship application (student) */
router.post(
  '/',
  requireAuth('student'),
  applicationDocuments,
  asyncHandler(async (req, res) => {
    let payload = req.body;
    if (typeof req.body?.payload === 'string') {
      try {
        payload = JSON.parse(req.body.payload);
      } catch (error) {
        throw badRequest('The application data could not be read. Please try again.');
      }
    }

    const { value, errors, hasErrors } = validateApplication(payload);
    if (hasErrors) {
      throw badRequest('Please correct the highlighted fields before submitting', errors);
    }

    const scholarship = await scholarshipRepo.findById(value.scholarshipId);
    if (!scholarship) throw notFound('The selected scholarship no longer exists');
    if (scholarship.status !== 'open') throw conflict('This scholarship is not accepting applications at the moment');
    if (scholarship.deadline && scholarship.deadline < new Date().toISOString().slice(0, 10)) {
      throw conflict(`The application deadline for this scholarship was ${scholarship.deadline}`);
    }

    const duplicate = await repo.findByUserAndScholarship(req.user._id, value.scholarshipId);
    if (duplicate && duplicate.status !== APPLICATION_STATUS.rejected) {
      throw conflict(`You have already applied for this scholarship (reference ${duplicate.applicationNo})`);
    }

    const documents = collectDocuments(req.files, value.documents);
    const missingRequired = DOCUMENT_TYPES.filter((doc) => doc.required && !documents[doc.key]).map((doc) => doc.key);
    if (missingRequired.length) {
      throw badRequest('Please upload the required documents', {
        [`documents.${missingRequired[0]}`]: 'This document is required',
      });
    }

    const application = await repo.create({
      userId: req.user._id,
      scholarshipId: value.scholarshipId,
      applicantType: value.applicantType,
      scholarshipTitle: scholarship.title,
      personal: value.personal,
      guardian: value.guardian,
      household: value.household,
      education: value.education,
      financial: value.financial,
      motivation: value.motivation,
      declaration: value.declaration,
      documents,
      admin: { note: '', reviewedBy: null, reviewedAt: null },
    });

    const rendered = templates.applicationReceived({ user: req.user, application, scholarship });
    await notify.notifyAndEmail({
      user: req.user,
      title: `Application ${application.applicationNo} received`,
      message: `We have received your application for ${scholarship.title}. Our team will verify it shortly.`,
      type: 'success',
      link: `/dashboard/applications/${application._id}`,
      rendered,
      meta: { applicationId: application._id },
    });

    res.status(201).json({ application, message: 'Application submitted successfully' });
  })
);

/** GET /api/applications/me - the signed in student's applications */
router.get(
  '/me',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const applications = await repo.listForUser(req.user._id);
    res.json({ items: await decorate(applications), total: applications.length });
  })
);

/** GET /api/applications/me/:id */
router.get(
  '/me/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const application = await repo.findById(req.params.id);
    if (!application || String(application.userId) !== String(req.user._id)) throw notFound('Application not found');
    res.json({ application: await decorate(application) });
  })
);

/** GET /api/applications/:id - owner or admin */
router.get(
  '/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const application = await repo.findById(req.params.id);
    if (!application) throw notFound('Application not found');
    const isOwner = String(application.userId) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') throw forbidden('You can only view your own applications');
    res.json({ application: await decorate(application) });
  })
);

/* -------------------------------------------------------------------- admin */

/** GET /api/applications/admin/list */
router.get(
  '/admin/list',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const {
      q = '',
      status = '',
      applicantType = '',
      scholarshipId = '',
      district = '',
      date = '',
      from = '',
      to = '',
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const result = await repo.list({
      q,
      status,
      applicantType,
      scholarshipId,
      district,
      date,
      from,
      to,
      sortBy,
      order,
      page,
      limit,
    });
    res.json({ ...result, items: await decorate(result.items) });
  })
);

/** GET /api/applications/admin/today - applications submitted today, newest first */
router.get(
  '/admin/today',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const items = await repo.listSubmittedOn(date);
    const decorated = await decorate(items);
    res.json({
      date,
      total: decorated.length,
      pending: decorated.filter((item) => item.status === APPLICATION_STATUS.pending).length,
      items: decorated,
    });
  })
);

/** GET /api/applications/admin/stats - dashboard widgets */
router.get(
  '/admin/stats',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    res.json(await stats.adminDashboard());
  })
);

/** GET /api/applications/admin/export - CSV of the filtered applications */
router.get(
  '/admin/export',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const result = await repo.list({ ...req.query, page: 1, limit: 5000 });
    const header = [
      'Application No',
      'Submitted',
      'Status',
      'Applicant type',
      'Scholarship',
      'Full name',
      'NIC',
      'Email',
      'Phone',
      'District',
      'School / University',
      'Requested amount (LKR)',
      'Reviewed by',
    ];
    const rows = result.items.map((application) => [
      application.applicationNo,
      new Date(application.createdAt).toLocaleString('en-GB'),
      application.status,
      application.applicantType,
      application.scholarshipTitle || '',
      application.personal?.fullName || '',
      application.personal?.nic || '',
      application.personal?.email || '',
      application.personal?.phone || '',
      application.personal?.district || '',
      application.education?.schoolName || application.education?.universityName || '',
      application.financial?.requestedAmount ?? '',
      application.admin?.reviewedBy || '',
    ]);

    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="applications-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  })
);

/** GET /api/applications/admin/:id */
router.get(
  '/admin/:id',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const application = await repo.findById(req.params.id);
    if (!application) throw notFound('Application not found');
    const applicant = await userRepo.findById(application.userId);
    res.json({
      application: await decorate(application),
      applicant: userRepo.publicUser(applicant),
    });
  })
);

/** PATCH /api/applications/admin/:id/status - verify / approve / reject */
router.patch(
  '/admin/:id/status',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const { status, adminNote = '', notify: shouldNotify = true } = req.body || {};
    if (!Object.values(APPLICATION_STATUS).includes(status)) {
      throw badRequest('Unknown status value', { status: 'Choose pending, under_review, approved or rejected' });
    }

    const application = await repo.findById(req.params.id);
    if (!application) throw notFound('Application not found');

    const alreadyDecided = application.statusHistory?.some((entry) => entry.status === status);
    const now = new Date().toISOString();

    const updated = await repo.update(application._id, {
      status,
      admin: {
        ...(application.admin || {}),
        note: adminNote || application.admin?.note || '',
        reviewedBy: req.user.name,
        reviewedByEmail: req.user.email,
        reviewedAt: now,
        ...(status === APPLICATION_STATUS.approved ? { approvedAt: now } : {}),
      },
      statusHistory: [
        ...(application.statusHistory || []),
        { status, at: now, by: req.user.name, note: adminNote || '' },
      ],
    });

    const scholarship = await scholarshipRepo.findById(application.scholarshipId);
    const applicant = await userRepo.findById(application.userId);
    let emailResult = null;

    if (applicant && shouldNotify !== false) {
      const rendered = templates.applicationStatus({
        user: applicant,
        application: updated,
        scholarship,
        status,
        adminNote,
        isResubmission: alreadyDecided,
      });
      const messages = {
        approved: `Congratulations! Your application ${updated.applicationNo} has been approved.`,
        rejected: `Your application ${updated.applicationNo} was not successful this time.`,
        under_review: `Your application ${updated.applicationNo} is now under review.`,
        pending: `Your application ${updated.applicationNo} has been moved back to the pending queue.`,
      };
      const types = { approved: 'success', rejected: 'danger', under_review: 'info', pending: 'warning' };
      await notify.notifyAndEmail({
        user: applicant,
        title: messages[status] || `Application status updated`,
        message: adminNote || messages[status] || '',
        type: types[status] || 'info',
        link: `/dashboard/applications/${updated._id}`,
        rendered,
        meta: { applicationId: updated._id, status },
      });
      emailResult = { to: applicant.email };
    }

    res.json({
      application: await decorate(updated),
      notified: Boolean(applicant) && shouldNotify !== false,
      email: emailResult,
    });
  })
);

/** PATCH /api/applications/admin/:id/note - internal note only */
router.patch(
  '/admin/:id/note',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const application = await repo.findById(req.params.id);
    if (!application) throw notFound('Application not found');
    const updated = await repo.update(application._id, {
      admin: { ...(application.admin || {}), note: String(req.body?.adminNote || '').slice(0, 2000) },
    });
    res.json({ application: await decorate(updated) });
  })
);

/** DELETE /api/applications/admin/:id */
router.delete(
  '/admin/:id',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const application = await repo.findById(req.params.id);
    if (!application) throw notFound('Application not found');
    await repo.remove(application._id);
    res.json({ message: `Application ${application.applicationNo} deleted` });
  })
);

module.exports = router;
