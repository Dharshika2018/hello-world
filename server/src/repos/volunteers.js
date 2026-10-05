'use strict';
const { collection } = require('../db');
const { newId, nowIso, escapeRegex } = require('../utils/ids');

const volunteers = () => collection('volunteers');

async function create(data) {
  const now = nowIso();
  return volunteers().insert({ ...data, _id: newId(), status: data.status || 'pending', createdAt: now, updatedAt: now });
}

async function findById(id) {
  return volunteers().findById(id);
}

async function findExisting(eventId, userId) {
  return volunteers().findOne({ eventId, userId });
}

async function listForUser(userId) {
  return volunteers().find({ userId }, { sort: { createdAt: -1 } });
}

async function listForEvent(eventId) {
  return volunteers().find({ eventId }, { sort: { createdAt: -1 } });
}

async function list({ q = '', status = '', eventId = '', page = 1, limit = 20 } = {}) {
  const query = {};
  if (status) query.status = status;
  if (eventId) query.eventId = eventId;
  if (q) {
    const rx = escapeRegex(q);
    query.$or = [
      { fullName: { $regex: rx, $options: 'i' } },
      { email: { $regex: rx, $options: 'i' } },
      { phone: { $regex: rx, $options: 'i' } },
      { eventTitle: { $regex: rx, $options: 'i' } },
    ];
  }
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    volunteers().find(query, { sort: { createdAt: -1 }, skip, limit: Number(limit) }),
    volunteers().count(query),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

async function update(id, patch) {
  return volunteers().updateById(id, patch);
}

async function remove(id) {
  return volunteers().deleteById(id);
}

async function countByStatus(status) {
  return volunteers().count(status ? { status } : {});
}

async function countForEvent(eventId) {
  return volunteers().count({ eventId });
}

module.exports = { create, findById, findExisting, listForUser, listForEvent, list, update, remove, countByStatus, countForEvent };
