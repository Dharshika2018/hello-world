'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const userRepo = require('../repos/users');
const emailRepo = require('../repos/emails');
const applicationRepo = require('../repos/applications');
const volunteerRepo = require('../repos/volunteers');
const scholarshipRepo = require('../repos/scholarships');
const eventRepo = require('../repos/events');
const mailer = require('../services/mailer');
const notify = require('../services/notify');
const statsService = require('../services/stats');
const { templates } = require('../services/emailTemplates');
const { databaseInfo } = require('../db');
const config = require('../config');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler, notFound, badRequest, conflict } = require('../utils/httpError');
const { validate, patterns } = require('../utils/validate');

const router = express.Router();

router.use(requireAuth('admin'));

/** GET /api/admin/stats - dashboard summary (applications today, trends, pending work) */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    res.json(await statsService.adminDashboard());
  })
);

/** GET /api/admin/system - which database/mail transport is in use */
router.get(
  '/system',
  asyncHandler(async (req, res) => {
    const [scholarships, events, students, admins] = await Promise.all([
      scholarshipRepo.list({ limit: 1 }),
      eventRepo.list({ limit: 1, scope: 'all' }),
      userRepo.listUsers({ role: 'student', limit: 1 }),
      userRepo.listUsers({ role: 'admin', limit: 1 }),
    ]);
    res.json({
      database: databaseInfo(),
      mail: { mode: mailer.mode(), smtpConfigured: mailer.isSmtpConfigured(), from: config.smtp.from },
      organisation: config.org,
      counts: {
        scholarships: scholarships.total,
        events: events.total,
        students: students.total,
        admins: admins.total,
      },
    });
  })
);

/** GET /api/admin/users */
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { q = '', role = '', status = '', page = 1, limit = 20 } = req.query;
    const result = await userRepo.listUsers({ q, role, status, page, limit });
    const enriched = [];
    for (const user of result.items) {
      // eslint-disable-next-line no-await-in-loop
      const applications = await applicationRepo.list({ limit: 1000 });
      enriched.push({
        ...user,
        applications: applications.items.filter((item) => String(item.userId) === String(user._id)).length,
      });
    }
    res.json({ ...result, items: enriched });
  })
);

/** POST /api/admin/users - create an admin or student account */
router.post(
  '/users',
  asyncHandler(async (req, res) => {
    const data = validate(req.body, {
      name: { required: true, label: 'Full name', minLength: 3 },
      email: { required: true, type: 'email', label: 'Email' },
      password: { required: true, label: 'Password', minLength: 6 },
      role: { required: true, enum: ['admin', 'student'], label: 'Role' },
      phone: { label: 'Phone', match: patterns.phone, message: 'Use a Sri Lankan number' },
      district: { label: 'District' },
    });
    if (await userRepo.findByEmail(data.email)) throw conflict('An account with this email already exists');

    const user = await userRepo.createUser({
      ...data,
      passwordHash: await bcrypt.hash(data.password, 10),
    });
    res.status(201).json({ user: userRepo.publicUser(user) });
  })
);

/** PATCH /api/admin/users/:id - update role / status / details, optionally reset password */
router.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await userRepo.findById(req.params.id);
    if (!user) throw notFound('User not found');

    const data = validate(req.body, {
      name: { label: 'Full name', minLength: 3 },
      email: { type: 'email', label: 'Email' },
      role: { enum: ['admin', 'student'], label: 'Role' },
      status: { enum: ['active', 'inactive'], label: 'Status' },
      phone: { label: 'Phone' },
      district: { label: 'District' },
      password: { label: 'Password', minLength: 6 },
    });
    if (data.email && data.email !== user.email) {
      const existing = await userRepo.findByEmail(data.email);
      if (existing) throw conflict('Another account already uses this email');
    }
    if (data.password) {
      data.passwordHash = await bcrypt.hash(data.password, 10);
      delete data.password;
    }
    if (user.role === 'admin' && data.role === 'student') {
      const admins = await userRepo.listUsers({ role: 'admin', limit: 1000 });
      if (admins.total <= 1) throw badRequest('At least one administrator account must remain');
    }

    const updated = await userRepo.updateUser(user._id, data);
    res.json({ user: userRepo.publicUser(updated) });
  })
);

/** DELETE /api/admin/users/:id */
router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await userRepo.findById(req.params.id);
    if (!user) throw notFound('User not found');
    if (String(user._id) === String(req.user._id)) throw badRequest('You cannot delete your own account');

    const applications = (await applicationRepo.listForUser(user._id)).length;
    if (applications > 0 && req.query.force !== '1') {
      throw badRequest(
        `This student has ${applications} application(s) on record. Deactivate the account instead, or repeat with ?force=1 to delete the account and keep the applications.`
      );
    }
    if (applications === 0) await userRepo.updateUser(user._id, { status: 'inactive' });

    const { collection } = require('../db');
    await collection('users').deleteById(user._id);
    await collection('notifications').deleteMany({ userId: user._id });
    const registrations = await volunteerRepo.listForUser(user._id);
    for (const registration of registrations) {
      // eslint-disable-next-line no-await-in-loop
      await volunteerRepo.remove(registration._id);
    }
    res.json({ message: `${user.name}'s account was deleted` });
  })
);

/** GET /api/admin/emails - the notification outbox */
router.get(
  '/emails',
  asyncHandler(async (req, res) => {
    const { q = '', status = '', page = 1, limit = 25 } = req.query;
    const result = await emailRepo.list({ q, status, page, limit });
    res.json({ ...result, mailMode: mailer.mode(), smtpConfigured: mailer.isSmtpConfigured() });
  })
);

/** GET /api/admin/emails/:id */
router.get(
  '/emails/:id',
  asyncHandler(async (req, res) => {
    const { collection } = require('../db');
    const email = await collection('emails').findById(req.params.id);
    if (!email) throw notFound('Email not found');
    res.json({ email });
  })
);

/** POST /api/admin/emails/:id/resend */
router.post(
  '/emails/:id/resend',
  asyncHandler(async (req, res) => {
    const { collection } = require('../db');
    const email = await collection('emails').findById(req.params.id);
    if (!email) throw notFound('Email not found');
    const result = await mailer.resend(email._id);
    res.json({ email: result, message: mailer.isSmtpConfigured() ? 'Email re-sent' : 'Email re-queued in the outbox' });
  })
);

/** POST /api/admin/broadcast - email every student (or a chosen role) */
router.post(
  '/broadcast',
  asyncHandler(async (req, res) => {
    const { subject, message, audience = 'student', ctaLabel, ctaUrl } = req.body || {};
    if (!subject || String(subject).trim().length < 4) throw badRequest('Subject is required');
    if (!message || String(message).trim().length < 10) throw badRequest('Message body is too short');

    const { items } = await userRepo.listUsers({ role: audience === 'all' ? '' : audience, limit: 5000 });
    const recipients = items.filter((user) => user.status === 'active');
    const sent = await notify.broadcast({
      users: recipients,
      title: subject,
      message: String(message).slice(0, 200),
      type: 'announcement',
      link: ctaUrl || '',
      renderedFactory: (user) => templates.broadcast({ subject, message, ctaLabel, ctaUrl, recipientName: user.name }),
    });

    res.json({ message: `Announcement queued for ${sent} account(s)`, sent });
  })
);

module.exports = router;
