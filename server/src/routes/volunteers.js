'use strict';
const express = require('express');
const repo = require('../repos/volunteers');
const eventRepo = require('../repos/events');
const userRepo = require('../repos/users');
const { requireAuth } = require('../middleware/auth');
const { validate, patterns, normalisePhone } = require('../utils/validate');
const { asyncHandler, notFound, conflict, badRequest } = require('../utils/httpError');
const { VOLUNTEER_STATUS } = require('../models/constants');
const { templates } = require('../services/emailTemplates');
const notify = require('../services/notify');
const { nextSequence } = require('../repos/counters');

const router = express.Router();

/** Attach event details so admin/student screens can render directly. */
async function decorate(records) {
  const cache = new Map();
  const out = [];
  for (const record of records) {
    let event = cache.get(record.eventId);
    if (event === undefined) {
      event = (await eventRepo.findById(record.eventId)) || null;
      cache.set(record.eventId, event);
    }
    out.push({
      ...record,
      eventTitle: event?.title || record.eventTitle || 'Event',
      eventDate: event?.date || '',
      eventVenue: event?.venue || '',
      eventType: event?.type || '',
    });
  }
  return out;
}

/** POST /api/volunteers - join as a volunteer for an event */
router.post(
  '/',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const data = validate(req.body, {
      eventId: { required: true, label: 'Event' },
      fullName: { required: true, label: 'Full name', minLength: 3, maxLength: 150 },
      email: { required: true, type: 'email', label: 'Email' },
      phone: { required: true, label: 'Mobile number', match: patterns.phone, message: 'Use a Sri Lankan number such as 0771234567' },
      nic: { required: true, label: 'NIC number', match: patterns.nic, message: 'Use 9 digits + V/X or the 12 digit NIC' },
      district: { required: true, label: 'District' },
      role: { required: true, label: 'Preferred role', maxLength: 120 },
      availability: { required: true, label: 'Availability', maxLength: 120 },
      occupation: { label: 'Occupation / school', maxLength: 150 },
      experience: { label: 'Previous volunteering experience', maxLength: 1500 },
      motivation: { required: true, label: 'Why you want to volunteer', minLength: 30, maxLength: 1500 },
      emergencyName: { required: true, label: 'Emergency contact name', maxLength: 150 },
      emergencyPhone: { required: true, label: 'Emergency contact number', maxLength: 30 },
      emergencyRelationship: { label: 'Emergency contact relationship', maxLength: 80 },
    });

    const event = await eventRepo.findById(data.eventId);
    if (!event) throw notFound('The selected event no longer exists');
    if (event.status === 'draft') throw conflict('This event is not published yet');
    if (['completed', 'cancelled'].includes(event.status)) throw conflict('This event is no longer accepting volunteers');
    if (event.registrationDeadline && event.registrationDeadline < new Date().toISOString().slice(0, 10)) {
      throw conflict(`Volunteer registration closed on ${event.registrationDeadline}`);
    }
    if (req.body.declaration !== true && req.body.declaration !== 'true') {
      throw badRequest('Please accept the volunteer declaration', { declaration: 'You must accept the volunteer declaration' });
    }

    const existing = await repo.findExisting(event._id, req.user._id);
    if (existing) throw conflict(`You have already registered as a volunteer for this event (${existing.registrationNo})`);

    const sequence = await nextSequence('volunteers');
    const registrationNo = `VOL-${new Date().getFullYear()}-${String(sequence).padStart(5, '0')}`;

    const volunteer = await repo.create({
      ...data,
      registrationNo,
      userId: req.user._id,
      eventTitle: event.title,
      phone: normalisePhone(data.phone),
      emergencyPhone: normalisePhone(data.emergencyPhone),
      userIdOrGuest: 'registered-user',
      declaration: true,
    });

    const rendered = templates.volunteerRegistered({ user: req.user, volunteer, event });
    await notify.notifyAndEmail({
      user: req.user,
      title: `Volunteer registration ${registrationNo} received`,
      message: `Thank you for volunteering for ${event.title}. A coordinator will confirm your slot shortly.`,
      type: 'success',
      link: '/dashboard/volunteering',
      rendered,
      meta: { volunteerId: volunteer._id, eventId: event._id },
    });

    res.status(201).json({ volunteer: (await decorate([volunteer]))[0], message: 'Volunteer registration submitted' });
  })
);

/** GET /api/volunteers/me */
router.get(
  '/me',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const records = await repo.listForUser(req.user._id);
    res.json({ items: await decorate(records), total: records.length });
  })
);

/** GET /api/volunteers/me/:id */
router.get(
  '/me/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const record = await repo.findById(req.params.id);
    if (!record || String(record.userId) !== String(req.user._id)) throw notFound('Volunteer registration not found');
    res.json({ volunteer: (await decorate([record]))[0] });
  })
);

/** GET /api/volunteers/admin/list */
router.get(
  '/admin/list',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const { q = '', status = '', eventId = '', page = 1, limit = 20 } = req.query;
    const result = await repo.list({ q, status, eventId, page, limit });
    res.json({ ...result, items: await decorate(result.items) });
  })
);

/** GET /api/volunteers/admin/:id */
router.get(
  '/admin/:id',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const record = await repo.findById(req.params.id);
    if (!record) throw notFound('Volunteer registration not found');
    const user = await userRepo.findById(record.userId);
    res.json({ volunteer: (await decorate([record]))[0], account: userRepo.publicUser(user) });
  })
);

/** PATCH /api/volunteers/admin/:id/status - confirm or decline a volunteer */
router.patch(
  '/admin/:id/status',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const { status, adminNote = '', notify: shouldNotify = true } = req.body || {};
    if (!Object.values(VOLUNTEER_STATUS).includes(status)) {
      throw badRequest('Unknown status value', { status: 'Choose pending, approved or rejected' });
    }

    const record = await repo.findById(req.params.id);
    if (!record) throw notFound('Volunteer registration not found');

    const now = new Date().toISOString();
    const updated = await repo.update(record._id, {
      status,
      admin: { ...(record.admin || {}), note: adminNote, reviewedBy: req.user.name, reviewedAt: now },
      statusHistory: [...(record.statusHistory || []), { status, at: now, by: req.user.name, note: adminNote }],
    });

    const event = await eventRepo.findById(record.eventId);
    const user = await userRepo.findById(record.userId);

    if (user && shouldNotify !== false) {
      const rendered = templates.volunteerStatus({ user, volunteer: updated, event, status, adminNote });
      await notify.notifyAndEmail({
        user,
        title:
          status === 'approved'
            ? `Confirmed: volunteer for ${event?.title || 'event'}`
            : `Volunteer registration update for ${event?.title || 'event'}`,
        message: adminNote || (status === 'approved' ? 'Your volunteer slot is confirmed.' : 'Your registration was not confirmed.'),
        type: status === 'approved' ? 'success' : 'warning',
        link: '/dashboard/volunteering',
        rendered,
        meta: { volunteerId: updated._id, eventId: record.eventId },
      });
    }

    res.json({ volunteer: (await decorate([updated]))[0], notified: Boolean(user) && shouldNotify !== false });
  })
);

/** DELETE /api/volunteers/admin/:id */
router.delete(
  '/admin/:id',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const record = await repo.findById(req.params.id);
    if (!record) throw notFound('Volunteer registration not found');
    await repo.remove(record._id);
    res.json({ message: `Volunteer registration ${record.registrationNo} deleted` });
  })
);

module.exports = router;
