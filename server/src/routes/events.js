'use strict';
const express = require('express');
const repo = require('../repos/events');
const volunteerRepo = require('../repos/volunteers');
const userRepo = require('../repos/users');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { validate } = require('../utils/validate');
const { asyncHandler, notFound, badRequest, conflict } = require('../utils/httpError');
const { EVENT_TYPES, EVENT_STATUS } = require('../models/constants');
const { templates } = require('../services/emailTemplates');
const notify = require('../services/notify');

const router = express.Router();

const rules = {
  title: { required: true, label: 'Event title', minLength: 4, maxLength: 180 },
  type: { required: true, enum: EVENT_TYPES, label: 'Event type' },
  status: { enum: Object.values(EVENT_STATUS), default: 'upcoming', label: 'Status' },
  description: { required: true, label: 'Description', minLength: 20, maxLength: 4000 },
  date: { required: true, label: 'Event date' },
  endDate: { label: 'End date' },
  startTime: { label: 'Start time', maxLength: 20 },
  endTime: { label: 'End time', maxLength: 20 },
  venue: { required: true, label: 'Venue', maxLength: 200 },
  district: { required: true, label: 'District' },
  audience: { label: 'Target audience', maxLength: 160 },
  organiser: { label: 'Organised by', maxLength: 120 },
  contactPerson: { label: 'Contact person', maxLength: 120 },
  contactPhone: { label: 'Contact phone', maxLength: 30 },
  contactEmail: { type: 'email', label: 'Contact email' },
  registrationDeadline: { label: 'Volunteer registration deadline' },
  volunteersNeeded: { type: 'number', min: 0, max: 5000, label: 'Volunteers needed' },
  capacity: { type: 'number', min: 0, max: 100000, label: 'Participant capacity' },
  imageUrl: { label: 'Cover image URL', maxLength: 400 },
};

function normalise(body) {
  const data = validate(body, rules);
  const list = (value) =>
    (Array.isArray(value) ? value : String(value || '').split('\n')).map((item) => String(item).trim()).filter(Boolean);

  if (body.rolesNeeded !== undefined) data.rolesNeeded = list(body.rolesNeeded);
  if (body.requirements !== undefined) data.requirements = list(body.requirements);
  if (body.tags !== undefined) data.tags = list(body.tags);
  if (body.agenda !== undefined && Array.isArray(body.agenda)) {
    data.agenda = body.agenda
      .filter((item) => item && (item.title || item.time))
      .map((item) => ({ time: String(item.time || '').trim(), title: String(item.title || '').trim() }));
  }
  if (body.featured !== undefined) data.featured = Boolean(body.featured);
  if (body.volunteersNeeded !== undefined) data.volunteerSlotsOpen = Boolean(body.volunteerSlotsOpen ?? true);
  return data;
}

/** GET /api/events - public list; ?scope=upcoming|past|all */
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const isAdmin = req.user?.role === 'admin';
    const { scope = 'upcoming', type, status, district, q, page, limit } = req.query;
    const result = await repo.list({
      scope: isAdmin && scope === 'all' ? 'all' : scope,
      type: type || '',
      status: status || '',
      district: district || '',
      q: q || '',
      page: page || 1,
      limit: limit || 30,
      includeDrafts: isAdmin,
    });

    const items = await Promise.all(
      result.items.map(async (event) => ({
        ...event,
        volunteerCount: await volunteerRepo.countForEvent(event._id),
      }))
    );
    res.json({ ...result, items });
  })
);

/** GET /api/events/:idOrSlug */
router.get(
  '/:idOrSlug',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;
    const event = (await repo.findById(idOrSlug)) || (await repo.findBySlug(idOrSlug));
    if (!event) throw notFound('Event not found');
    if (event.status === 'draft' && req.user?.role !== 'admin') throw notFound('Event not found');

    const [volunteerCount, relatedEvents] = await Promise.all([
      volunteerRepo.countForEvent(event._id),
      repo.list({ scope: 'upcoming', limit: 4 }),
    ]);

    res.json({
      event,
      volunteerCount,
      related: relatedEvents.items.filter((item) => item._id !== event._id).slice(0, 3),
    });
  })
);

/** POST /api/events (admin) - optionally notifies every student by email */
router.post(
  '/',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const data = normalise(req.body);
    const event = await repo.create(data);

    let notified = 0;
    if (req.body.notifyStudents) {
      const { items } = await userRepo.listUsers({ role: 'student', limit: 5000 });
      notified = await notify.broadcast({
        users: items,
        title: `New event: ${event.title}`,
        message: `${event.type} on ${event.date} at ${event.venue}. Volunteer registration is open.`,
        type: 'event',
        link: `/events/${event._id}`,
        renderedFactory: (user) =>
          templates.broadcast({
            recipientName: user.name,
            subject: `New ${event.type}: ${event.title}`,
            message: `${event.description}\n\nDate: ${event.date}${event.startTime ? ` at ${event.startTime}` : ''}\nVenue: ${event.venue}\nVolunteers needed: ${event.volunteersNeeded || 'as many as possible'}\n\nYou can register as a volunteer from your dashboard.`,
            ctaLabel: 'View event details',
            ctaUrl: `${require('../config').clientUrl}/events/${event._id}`,
          }),
      });
    }

    res.status(201).json({ event, notified });
  })
);

/** PATCH /api/events/:id (admin) */
router.patch(
  '/:id',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const existing = await repo.findById(req.params.id);
    if (!existing) throw notFound('Event not found');
    const patch = normalise({ ...existing, ...req.body });
    const event = await repo.update(req.params.id, patch);
    res.json({ event });
  })
);

/** DELETE /api/events/:id (admin) */
router.delete(
  '/:id',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const existing = await repo.findById(req.params.id);
    if (!existing) throw notFound('Event not found');
    const registrations = await volunteerRepo.countForEvent(req.params.id);
    if (registrations > 0 && req.query.force !== '1') {
      throw badRequest(
        `${registrations} volunteer registration(s) exist for this event. Set the status to Cancelled instead, or repeat with ?force=1 to delete anyway.`
      );
    }
    await repo.remove(req.params.id);
    res.json({ message: 'Event deleted' });
  })
);

/** GET /api/events/:id/volunteers (admin) */
router.get(
  '/:id/volunteers',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const event = await repo.findById(req.params.id);
    if (!event) throw notFound('Event not found');
    const volunteers = await volunteerRepo.listForEvent(req.params.id);
    res.json({ event, volunteers, total: volunteers.length });
  })
);

/** POST /api/events/:id/notify (admin) - re-notify students about an event */
router.post(
  '/:id/notify',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const event = await repo.findById(req.params.id);
    if (!event) throw notFound('Event not found');
    if (!event.status || event.status === 'draft') throw conflict('Draft events cannot be announced');

    const { items } = await userRepo.listUsers({ role: 'student', limit: 5000 });
    const notified = await notify.broadcast({
      users: items,
      title: `Reminder: ${event.title}`,
      message: `${event.type} on ${event.date} at ${event.venue}.`,
      type: 'event',
      link: `/events/${event._id}`,
      renderedFactory: (user) =>
        templates.broadcast({
          recipientName: user.name,
          subject: `Reminder - ${event.title}`,
          message: `${event.description}\n\nDate: ${event.date}${event.startTime ? ` at ${event.startTime}` : ''}\nVenue: ${event.venue}\n\nWe still need volunteers - register from the events page if you can help.`,
          ctaLabel: 'Open event',
          ctaUrl: `${require('../config').clientUrl}/events/${event._id}`,
        }),
    });

    res.json({ message: `Reminder queued for ${notified} student account(s)`, notified });
  })
);

module.exports = router;
