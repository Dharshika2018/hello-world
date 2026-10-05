'use strict';
const express = require('express');
const repo = require('../repos/scholarships');
const applicationRepo = require('../repos/applications');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { validate } = require('../utils/validate');
const { asyncHandler, notFound, badRequest } = require('../utils/httpError');
const { SCHOLARSHIP_STATUS, SCHOLARSHIP_CATEGORIES } = require('../models/constants');

const router = express.Router();

const rules = {
  title: { required: true, label: 'Scholarship title', minLength: 4, maxLength: 160 },
  code: { label: 'Reference code', maxLength: 40 },
  category: { required: true, enum: SCHOLARSHIP_CATEGORIES, label: 'Category' },
  status: { enum: Object.values(SCHOLARSHIP_STATUS), default: 'open', label: 'Status' },
  shortDescription: { required: true, label: 'Short description', minLength: 15, maxLength: 400 },
  description: { label: 'Full description', maxLength: 4000 },
  eligibility: { label: 'Eligibility criteria', maxLength: 2000 },
  awardAmount: { label: 'Award amount', maxLength: 60 },
  awardFrequency: { label: 'Award frequency', maxLength: 60 },
  awardDuration: { label: 'Award duration', maxLength: 60 },
  academicYear: { label: 'Academic year', maxLength: 30 },
  applicationOpenDate: { label: 'Application opens on' },
  deadline: { required: true, label: 'Application deadline' },
  seats: { type: 'number', min: 0, max: 100000, label: 'Number of awards' },
  minimumGpa: { label: 'Minimum GPA / grade requirement', maxLength: 40 },
  contactPerson: { label: 'Contact person', maxLength: 120 },
  contactEmail: { type: 'email', label: 'Contact email' },
  contactPhone: { label: 'Contact phone', maxLength: 30 },
  imageUrl: { label: 'Cover image URL', maxLength: 400 },
};

function normalise(body) {
  const data = validate(body, rules);
  const list = (value) =>
    (Array.isArray(value) ? value : String(value || '').split('\n'))
      .map((item) => String(item).trim())
      .filter(Boolean);

  if (body.benefits !== undefined) data.benefits = list(body.benefits);
  if (body.requirements !== undefined) data.requirements = list(body.requirements);
  if (body.requiredDocuments !== undefined) data.requiredDocuments = list(body.requiredDocuments);
  if (body.eligibleDistricts !== undefined) data.eligibleDistricts = list(body.eligibleDistricts);
  if (body.featured !== undefined) data.featured = Boolean(body.featured);
  return data;
}

/** GET /api/scholarships - public listing (admins may request drafts) */
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const isAdmin = req.user?.role === 'admin';
    const { page, limit, category, status, q } = req.query;
    const result = await repo.list({
      q: q || '',
      category: category || '',
      status: status || (isAdmin && req.query.includeDrafts === '1' ? '' : ''),
      page: page || 1,
      limit: limit || 24,
    });
    const items = isAdmin && req.query.includeDrafts === '1' ? result.items : result.items.filter((item) => item.status !== 'draft');
    res.json({ ...result, items });
  })
);

/** GET /api/scholarships/:idOrSlug */
router.get(
  '/:idOrSlug',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;
    const scholarship = (await repo.findById(idOrSlug)) || (await repo.findBySlug(idOrSlug));
    if (!scholarship) throw notFound('Scholarship not found');
    if (scholarship.status === 'draft' && req.user?.role !== 'admin') throw notFound('Scholarship not found');

    const applications = await applicationRepo.list({ scholarshipId: scholarship._id, limit: 1000 });
    res.json({
      scholarship,
      stats: {
        totalApplications: applications.total,
        approved: applications.items.filter((item) => item.status === 'approved').length,
      },
    });
  })
);

/** POST /api/scholarships (admin) */
router.post(
  '/',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const data = normalise(req.body);
    if (data.applicationOpenDate && data.deadline && data.applicationOpenDate > data.deadline) {
      throw badRequest('The deadline must be after the opening date', { deadline: 'Deadline must be after the opening date' });
    }
    const scholarship = await repo.create(data);
    res.status(201).json({ scholarship });
  })
);

/** PATCH /api/scholarships/:id (admin) */
router.patch(
  '/:id',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const existing = await repo.findById(req.params.id);
    if (!existing) throw notFound('Scholarship not found');
    const patch = normalise({ ...existing, ...req.body });
    const scholarship = await repo.update(req.params.id, patch);
    res.json({ scholarship });
  })
);

/** DELETE /api/scholarships/:id (admin) */
router.delete(
  '/:id',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const existing = await repo.findById(req.params.id);
    if (!existing) throw notFound('Scholarship not found');
    const applications = await applicationRepo.list({ scholarshipId: req.params.id, limit: 1 });
    if (applications.total > 0 && req.query.force !== '1') {
      throw badRequest(
        `${applications.total} application(s) already reference this scholarship. Archive it by setting the status to Closed instead, or repeat with ?force=1 to delete anyway.`
      );
    }
    await repo.remove(req.params.id);
    res.json({ message: 'Scholarship deleted' });
  })
);

module.exports = router;
