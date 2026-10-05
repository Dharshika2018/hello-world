'use strict';
/**
 * File-backed, in-memory collection store.
 *
 * This is a development convenience used when a MongoDB server is not reachable
 * (for example inside a sandbox without a mongod binary). It implements the small
 * subset of the MongoDB query language that this project uses, so every repository
 * works unchanged against either backend.
 *
 * Production / local development should always use the real MongoDB backend
 * (DB_MODE=mongo with MONGODB_URI pointing at your local mongod so you can inspect
 * the data with MongoDB Compass).
 */
const fs = require('fs');
const path = require('path');
const { newId, clone, nowIso } = require('../utils/ids');

function getPath(doc, dotted) {
  return String(dotted)
    .split('.')
    .reduce((acc, key) => (acc === undefined || acc === null ? undefined : acc[key]), doc);
}

function equalish(a, b) {
  if (a === b) return true;
  if (a === undefined || a === null) return false;
  if (b === undefined || b === null) return false;
  return String(a) === String(b);
}

/** MongoDB-ish matcher for the operators used by this project. */
function matchesCondition(value, condition) {
  if (condition === null || typeof condition !== 'object' || Array.isArray(condition) || condition instanceof RegExp) {
    if (Array.isArray(value)) return value.some((item) => equalish(item, condition));
    return equalish(value, condition);
  }

  const source = Array.isArray(value) ? value : [value];
  return Object.entries(condition).every(([op, operand]) => {
    switch (op) {
      case '$eq':
        return source.some((item) => equalish(item, operand));
      case '$ne':
        return !source.some((item) => equalish(item, operand));
      case '$in':
        return source.some((item) => (operand || []).some((candidate) => equalish(item, candidate)));
      case '$nin':
        return !source.some((item) => (operand || []).some((candidate) => equalish(item, candidate)));
      case '$regex': {
        const flags = condition.$options || '';
        const re = operand instanceof RegExp ? operand : new RegExp(operand, flags);
        return source.some((item) => typeof item === 'string' && re.test(item));
      }
      case '$options':
        return true;
      case '$gte':
        return source.some((item) => item !== undefined && item !== null && item >= operand);
      case '$lte':
        return source.some((item) => item !== undefined && item !== null && item <= operand);
      case '$gt':
        return source.some((item) => item !== undefined && item !== null && item > operand);
      case '$lt':
        return source.some((item) => item !== undefined && item !== null && item < operand);
      case '$exists':
        return operand ? source.some((item) => item !== undefined) : source.every((item) => item === undefined);
      default:
        return false;
    }
  });
}

function matchesQuery(doc, query) {
  if (!query) return true;
  return Object.entries(query).every(([key, condition]) => {
    if (key === '$or') return (condition || []).some((sub) => matchesQuery(doc, sub));
    if (key === '$and') return (condition || []).every((sub) => matchesQuery(doc, sub));
    return matchesCondition(getPath(doc, key), condition);
  });
}

function compareValues(a, b) {
  if (a === b) return 0;
  if (a === undefined || a === null) return 1; // missing values sort last
  if (b === undefined || b === null) return -1;
  if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : 1;
  return a < b ? -1 : 1;
}

function applySort(docs, sort) {
  if (!sort) return docs;
  const entries = Object.entries(sort);
  if (!entries.length) return docs;
  return [...docs].sort((left, right) => {
    for (const [field, direction] of entries) {
      const result = compareValues(getPath(left, field), getPath(right, field));
      if (result !== 0) return direction < 0 ? -result : result;
    }
    return 0;
  });
}

function deepMerge(target, patch) {
  if (!patch || typeof patch !== 'object') return target;
  for (const [key, value] of Object.entries(patch)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      deepMerge(target[key], value);
    } else {
      target[key] = clone(value);
    }
  }
  return target;
}

class MemoryCollection {
  constructor(name, store, persist) {
    this.name = name;
    this.store = store;
    this.persist = persist;
    if (!this.store[name]) this.store[name] = [];
  }

  get docs() {
    return this.store[this.name];
  }

  async insert(doc) {
    const record = clone(doc);
    record._id = record._id || newId();
    record.createdAt = record.createdAt || nowIso();
    record.updatedAt = record.updatedAt || record.createdAt;
    this.docs.push(record);
    this.persist();
    return clone(record);
  }

  async insertMany(docs) {
    const inserted = [];
    for (const doc of docs) inserted.push(await this.insert(doc));
    return inserted;
  }

  async findById(id) {
    if (!id) return null;
    const found = this.docs.find((doc) => equalish(doc._id, id));
    return found ? clone(found) : null;
  }

  async findOne(query = {}, options = {}) {
    const results = await this.find(query, { ...options, limit: 1 });
    return results[0] || null;
  }

  async find(query = {}, options = {}) {
    let results = this.docs.filter((doc) => matchesQuery(doc, query));
    results = applySort(results, options.sort);
    if (options.skip) results = results.slice(options.skip);
    if (options.limit) results = results.slice(0, options.limit);
    return results.map(clone);
  }

  async count(query = {}) {
    return this.docs.filter((doc) => matchesQuery(doc, query)).length;
  }

  async updateById(id, patch) {
    const found = this.docs.find((doc) => equalish(doc._id, id));
    if (!found) return null;
    deepMerge(found, patch);
    found.updatedAt = nowIso();
    this.persist();
    return clone(found);
  }

  async updateMany(query, patch) {
    const found = this.docs.filter((doc) => matchesQuery(doc, query));
    for (const doc of found) {
      deepMerge(doc, patch);
      doc.updatedAt = nowIso();
    }
    if (found.length) this.persist();
    return found.length;
  }

  async deleteById(id) {
    const index = this.docs.findIndex((doc) => equalish(doc._id, id));
    if (index === -1) return false;
    this.docs.splice(index, 1);
    this.persist();
    return true;
  }

  async deleteMany(query) {
    const remaining = this.docs.filter((doc) => !matchesQuery(doc, query));
    const removed = this.docs.length - remaining.length;
    this.store[this.name] = remaining;
    if (removed) this.persist();
    return removed;
  }
}

const COLLECTIONS = [
  'users',
  'scholarships',
  'events',
  'applications',
  'volunteers',
  'notifications',
  'emails',
  'counters',
];

function createMemoryBackend({ dataFile }) {
  let store = {};
  if (dataFile && fs.existsSync(dataFile)) {
    try {
      store = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    } catch (error) {
      console.warn(`[db] Could not read ${dataFile}: ${error.message}. Starting empty.`);
      store = {};
    }
  }

  let writeTimer = null;
  const persist = () => {
    if (!dataFile) return;
    clearTimeout(writeTimer);
    writeTimer = setTimeout(() => {
      try {
        fs.mkdirSync(path.dirname(dataFile), { recursive: true });
        fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
      } catch (error) {
        console.warn(`[db] Could not persist memory store: ${error.message}`);
      }
    }, 120);
  };

  const collections = {};
  for (const name of COLLECTIONS) collections[name] = new MemoryCollection(name, store, persist);

  return {
    kind: 'memory',
    label: 'In-memory dev store (file backed)',
    collections,
    collection: (name) => collections[name],
    async connect() {
      persist();
      return true;
    },
    async disconnect() {
      persist();
    },
    raw: () => store,
  };
}

module.exports = {
  createMemoryBackend,
  COLLECTIONS,
  matchesQuery,
  MemoryCollection,
};
