'use strict';
const express = require('express');
const repo = require('../repos/notifications');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler, notFound } = require('../utils/httpError');

const router = express.Router();

/** GET /api/notifications */
router.get(
  '/',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const items = await repo.listForUser(req.user._id, Number(req.query.limit) || 50);
    res.json({ items, unread: items.filter((item) => !item.read).length, total: items.length });
  })
);

/** GET /api/notifications/unread-count */
router.get(
  '/unread-count',
  requireAuth(),
  asyncHandler(async (req, res) => {
    res.json({ unread: await repo.unreadCount(req.user._id) });
  })
);

/** POST /api/notifications/read-all */
router.post(
  '/read-all',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const updated = await repo.markAllRead(req.user._id);
    res.json({ message: `${updated} notification(s) marked as read` });
  })
);

/** PATCH /api/notifications/:id/read */
router.patch(
  '/:id/read',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const updated = await repo.markRead(req.params.id, req.user._id, body.read === false ? false : true);
    if (!updated) throw notFound('Notification not found');
    res.json({ notification: updated });
  })
);

/** DELETE /api/notifications/:id */
router.delete(
  '/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const items = await repo.listForUser(req.user._id, 500);
    const owned = items.find((item) => String(item._id) === String(req.params.id));
    if (!owned) throw notFound('Notification not found');
    await repo.remove(owned._id);
    res.json({ message: 'Notification removed' });
  })
);

module.exports = router;
