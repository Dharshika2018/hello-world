'use strict';
const { collection } = require('../db');
const { newId, nowIso, slugify, escapeRegex } = require('../utils/ids');

const scholarships = () => collection('scholarships');

async function listAll({ includeDrafts = false } = {}) {
  const items = await scholarships().find({}, { sort: { createdAt: -1 } });
  return includeDrafts ? items : items.filter((item) => item.status !== 'draft');
}

async function list({ q = '', category = '', status = '', page = 1, limit = 20 } = {}) {
  const query = {};
  if (category) query.category = category;
  if (status) query.status = status;
  if (q) query.title = { $regex: escapeRegex(q), $options: 'i' };
  const skip = (Math.max(1, page) - 1) * limit;
  const [items, total] = await Promise.all([
    scholarships().find(query, { sort: { createdAt: -1 }, skip, limit }),
    scholarships().count(query),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

async function findById(id) {
  return scholarships().findById(id);
}

async function findBySlug(slug) {
  return scholarships().findOne({ slug });
}

async function create(data) {
  const now = nowIso();
  const title = data.title?.trim() || 'Untitled scholarship';
  return scholarships().insert({
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
  return scholarships().updateById(id, clean);
}

async function remove(id) {
  return scholarships().deleteById(id);
}

module.exports = { listAll, list, findById, findBySlug, create, update, remove };
