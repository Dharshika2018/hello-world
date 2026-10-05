'use strict';
/**
 * Every notification email the system produces is persisted here.
 * When SMTP is configured the message is delivered and stored as `sent`;
 * without SMTP the message stays in the outbox (`queued`) so the workflow can be
 * demonstrated in the Admin > Email Outbox screen during testing.
 */
const { collection } = require('../db');
const { newId, nowIso } = require('../utils/ids');

const emails = () => collection('emails');

async function create(record) {
  const now = nowIso();
  return emails().insert({
    _id: newId(),
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    ...record,
  });
}

async function update(id, patch) {
  return emails().updateById(id, { ...patch, updatedAt: nowIso() });
}

async function list({ q = '', status = '', page = 1, limit = 25 } = {}) {
  const query = {};
  if (status) query.status = status;
  if (q) {
    query.$or = [
      { to: { $regex: q, $options: 'i' } },
      { subject: { $regex: q, $options: 'i' } },
      { template: { $regex: q, $options: 'i' } },
    ];
  }
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    emails().find(query, { sort: { createdAt: -1 }, skip, limit: Number(limit) }),
    emails().count(query),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

async function count() {
  return emails().count({});
}

module.exports = { create, update, list, count };
