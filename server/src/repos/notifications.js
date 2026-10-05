'use strict';
const { collection } = require('../db');
const { newId, nowIso } = require('../utils/ids');

const notifications = () => collection('notifications');

async function create({ userId, title, message, type = 'info', link = '', meta = {} }) {
  const now = nowIso();
  return notifications().insert({
    _id: newId(),
    userId,
    title,
    message,
    type,
    link,
    meta,
    read: false,
    createdAt: now,
    updatedAt: now,
  });
}

async function listForUser(userId, limit = 50) {
  return notifications().find({ userId }, { sort: { createdAt: -1 }, limit });
}

async function unreadCount(userId) {
  return notifications().count({ userId, read: false });
}

async function markRead(id, userId, read = true) {
  const found = await notifications().findById(id);
  if (!found || String(found.userId) !== String(userId)) return null;
  return notifications().updateById(id, { read });
}

async function markAllRead(userId) {
  return notifications().updateMany({ userId, read: false }, { read: true });
}

async function remove(id) {
  return notifications().deleteById(id);
}

module.exports = { create, listForUser, unreadCount, markRead, markAllRead, remove };
