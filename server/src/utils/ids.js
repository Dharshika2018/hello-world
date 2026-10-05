'use strict';
const crypto = require('crypto');

/** Sortable, collision-safe document id (keeps insertion order like ObjectId). */
function newId() {
  return Date.now().toString(36) + crypto.randomBytes(6).toString('hex');
}

/** 6-digit readable numeric reference, e.g. APP-2026-000123 */
function reference(prefix, sequence, year = new Date().getFullYear()) {
  return `${prefix}-${year}-${String(sequence).padStart(5, '0')}`;
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function nowIso() {
  return new Date().toISOString();
}

/** Deep clone via JSON round trip (all stored documents are JSON-safe). */
function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

/** Turn user supplied text into a safe regular expression source. */
function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { newId, reference, slugify, nowIso, clone, escapeRegex };
