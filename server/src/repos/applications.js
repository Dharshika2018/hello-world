'use strict';
const { collection } = require('../db');
const { newId, nowIso, reference, escapeRegex } = require('../utils/ids');
const { nextSequence } = require('./counters');

const applications = () => collection('applications');

async function create(data) {
  const now = nowIso();
  const sequence = await nextSequence('applications');
  const year = new Date().getFullYear();
  return applications().insert({
    ...data,
    _id: newId(),
    applicationNo: reference('APP', sequence, year),
    status: data.status || 'pending',
    statusHistory: data.statusHistory || [{ status: 'pending', at: now, by: 'system', note: 'Application submitted' }],
    createdAt: now,
    updatedAt: now,
  });
}

async function findById(id) {
  return applications().findById(id);
}

async function findByUserAndScholarship(userId, scholarshipId) {
  return applications().findOne({ userId, scholarshipId });
}

async function listForUser(userId) {
  return applications().find({ userId }, { sort: { createdAt: -1 } });
}

async function list({
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
} = {}) {
  const query = {};
  if (status) query.status = status;
  if (applicantType) query.applicantType = applicantType;
  if (scholarshipId) query.scholarshipId = scholarshipId;
  if (district) query['personal.district'] = district;
  if (q) {
    const rx = escapeRegex(q);
    query.$or = [
      { applicationNo: { $regex: rx, $options: 'i' } },
      { 'personal.fullName': { $regex: rx, $options: 'i' } },
      { 'personal.email': { $regex: rx, $options: 'i' } },
      { 'personal.nic': { $regex: rx, $options: 'i' } },
      { 'personal.phone': { $regex: rx, $options: 'i' } },
    ];
  }
  if (date) {
    const next = new Date(`${date}T00:00:00.000Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    query.createdAt = { $gte: `${date}T00:00:00.000Z`, $lt: next.toISOString() };
  } else if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = `${from}T00:00:00.000Z`;
    if (to) query.createdAt.$lt = `${to}T23:59:59.999Z`;
  }

  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    applications().find(query, { sort: { [sortBy]: order === 'asc' ? 1 : -1 }, skip, limit: Number(limit) }),
    applications().count(query),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

async function update(id, patch) {
  return applications().updateById(id, patch);
}

async function remove(id) {
  return applications().deleteById(id);
}

async function countByStatus(status) {
  return applications().count(status ? { status } : {});
}

/** Applications submitted within [startIso, endIso). */
async function countBetween(startIso, endIso) {
  return applications().count({ createdAt: { $gte: startIso, $lt: endIso } });
}

async function submittedToday(todayIso) {
  const next = new Date(`${todayIso}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return applications().count({ createdAt: { $gte: `${todayIso}T00:00:00.000Z`, $lt: next.toISOString() } });
}

async function listSubmittedOn(todayIso, limit = 200) {
  const next = new Date(`${todayIso}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return applications().find(
    { createdAt: { $gte: `${todayIso}T00:00:00.000Z`, $lt: next.toISOString() } },
    { sort: { createdAt: -1 }, limit }
  );
}

module.exports = {
  create,
  findById,
  findByUserAndScholarship,
  listForUser,
  list,
  update,
  remove,
  countByStatus,
  countBetween,
  submittedToday,
  listSubmittedOn,
};
