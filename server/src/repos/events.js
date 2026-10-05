'use strict';
const { collection } = require('../db');
const { newId, nowIso, slugify, escapeRegex } = require('../utils/ids');

const events = () => collection('events');

async function list({ q = '', type = '', status = '', district = '', scope = 'all', page = 1, limit = 50, includeDrafts = false } = {}) {
  const query = {};
  if (type) query.type = type;
  if (status) query.status = status;
  if (district) query.district = district;
  if (q) query.title = { $regex: escapeRegex(q), $options: 'i' };

  let items = await events().find(query, { sort: { date: 1, createdAt: -1 } });

  if (!includeDrafts) items = items.filter((item) => item.status !== 'draft');

  const today = new Date().toISOString().slice(0, 10);
  if (scope === 'upcoming') {
    items = items.filter((item) => (item.endDate || item.date || '') >= today && item.status !== 'completed' && item.status !== 'cancelled');
    items = items.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  } else if (scope === 'past') {
    items = items
      .filter((item) => (item.endDate || item.date || '') < today || item.status === 'completed')
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }

  const total = items.length;
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  return { items: items.slice(skip, skip + Number(limit)), total, page: Number(page), limit: Number(limit) };
}

async function findById(id) {
  return events().findById(id);
}

async function findBySlug(slug) {
  return events().findOne({ slug });
}

async function create(data) {
  const now = nowIso();
  const title = data.title?.trim() || 'Untitled event';
  return events().insert({
    ...data,
    _id: newId(),
    title,
    slug: slugify(data.slug || title),
    createdAt: now,
    updatedAt: now,
  });
}

async function update(id, patch) {
  const clean = { ...patch };
  if (clean.slug) clean.slug = slugify(clean.slug);
  return events().updateById(id, clean);
}

async function remove(id) {
  return events().deleteById(id);
}

async function countUpcoming() {
  const { total } = await list({ scope: 'upcoming', limit: 1000 });
  return total;
}

module.exports = { list, findById, findBySlug, create, update, remove, countUpcoming };
