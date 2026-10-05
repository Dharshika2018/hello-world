'use strict';
const { collection } = require('../db');
const { newId, nowIso, escapeRegex } = require('../utils/ids');
const { unauthorized } = require('../utils/httpError');

const publicUser = (user) => {
  if (!user) return null;
  const { passwordHash, resetToken, ...rest } = user;
  return rest;
};

const users = () => collection('users');

async function findByEmail(email) {
  if (!email) return null;
  return users().findOne({ email: String(email).toLowerCase().trim() });
}

async function findById(id) {
  return users().findById(id);
}

async function createUser({ name, email, passwordHash, role = 'student', phone = '', nic = '', district = '', status = 'active' }) {
  const now = nowIso();
  return users().insert({
    _id: newId(),
    name,
    email: String(email).toLowerCase().trim(),
    passwordHash,
    role,
    phone,
    nic,
    district,
    status,
    createdAt: now,
    updatedAt: now,
  });
}

async function updateUser(id, patch) {
  return users().updateById(id, patch);
}

async function listUsers({ q = '', role = '', status = '', sortBy = 'createdAt', order = 'desc', page = 1, limit = 20 } = {}) {
  const query = {};
  if (role) query.role = role;
  if (status) query.status = status;
  if (q) {
    const rx = escapeRegex(q);
    query.$or = [
      { name: { $regex: rx, $options: 'i' } },
      { email: { $regex: rx, $options: 'i' } },
      { nic: { $regex: rx, $options: 'i' } },
    ];
  }
  const skip = (Math.max(1, page) - 1) * limit;
  const [items, total] = await Promise.all([
    users().find(query, { sort: { [sortBy]: order === 'asc' ? 1 : -1 }, skip, limit }),
    users().count(query),
  ]);
  return { items: items.map(publicUser), total, page: Number(page), limit: Number(limit) };
}

async function requireUser(id) {
  const user = await findById(id);
  if (!user) throw unauthorized('Your session is no longer valid. Please sign in again.');
  return user;
}

module.exports = { findByEmail, findById, createUser, updateUser, listUsers, publicUser, requireUser };
