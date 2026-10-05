'use strict';
/**
 * MongoDB backend (Mongoose).
 *
 * Documents are stored with the exact shape used by the rest of the application,
 * `_id` is a sortable string and timestamps are ISO strings, which keeps the
 * MongoDB and in-memory backends interchangeable.
 *
 * Open MongoDB Compass and connect to  mongodb://127.0.0.1:27017  to inspect the
 * collections:  users, scholarships, events, applications, volunteers,
 * notifications, emails, counters.
 */
const mongoose = require('mongoose');
const { newId, nowIso, clone } = require('../utils/ids');

const { Schema } = mongoose;

/** Shared option: keep unknown form fields instead of silently dropping them. */
const baseOptions = { versionKey: false, strict: false, minimize: false };

const schemas = {
  users: new Schema(
    {
      _id: { type: String, default: newId },
      name: String,
      email: { type: String, index: true },
      passwordHash: String,
      role: { type: String, default: 'student', index: true },
      phone: String,
      nic: String,
      district: String,
      status: { type: String, default: 'active' },
      lastLoginAt: String,
      createdAt: String,
      updatedAt: String,
    },
    baseOptions
  ),
  scholarships: new Schema(
    {
      _id: { type: String, default: newId },
      title: String,
      slug: String,
      code: String,
      category: { type: String, index: true },
      status: { type: String, default: 'open', index: true },
      deadline: String,
      createdAt: String,
      updatedAt: String,
    },
    baseOptions
  ),
  events: new Schema(
    {
      _id: { type: String, default: newId },
      title: String,
      slug: String,
      type: { type: String, index: true },
      status: { type: String, default: 'upcoming', index: true },
      date: { type: String, index: true },
      district: String,
      createdAt: String,
      updatedAt: String,
    },
    baseOptions
  ),
  applications: new Schema(
    {
      _id: { type: String, default: newId },
      applicationNo: String,
      userId: { type: String, index: true },
      scholarshipId: { type: String, index: true },
      applicantType: { type: String, index: true },
      status: { type: String, default: 'pending', index: true },
      createdAt: { type: String, index: true },
      updatedAt: String,
    },
    baseOptions
  ),
  volunteers: new Schema(
    {
      _id: { type: String, default: newId },
      userId: { type: String, index: true },
      eventId: { type: String, index: true },
      email: { type: String, index: true },
      status: { type: String, default: 'pending', index: true },
      createdAt: { type: String, index: true },
      updatedAt: String,
    },
    baseOptions
  ),
  notifications: new Schema(
    {
      _id: { type: String, default: newId },
      userId: { type: String, index: true },
      read: { type: Boolean, default: false, index: true },
      createdAt: String,
      updatedAt: String,
    },
    baseOptions
  ),
  emails: new Schema(
    {
      _id: { type: String, default: newId },
      to: { type: String, index: true },
      subject: String,
      status: { type: String, index: true },
      createdAt: String,
      updatedAt: String,
    },
    baseOptions
  ),
  counters: new Schema(
    {
      _id: { type: String },
      value: { type: Number, default: 0 },
      createdAt: String,
      updatedAt: String,
    },
    baseOptions
  ),
};

const COLLECTIONS = Object.keys(schemas);

function toPlain(doc) {
  if (!doc) return null;
  const plain = typeof doc.toObject === 'function' ? doc.toObject({ depopulate: true }) : doc;
  return clone(plain);
}

/**
 * Mongoose adapter exposing the same tiny API as the in-memory backend.
 * Writes go through "load -> merge -> save" so both backends share identical
 * deep-merge semantics for nested objects (personal, education, admin, ...).
 */
class MongooseCollection {
  constructor(name, model) {
    this.name = name;
    this.model = model;
  }

  async insert(doc) {
    const record = clone(doc);
    record._id = record._id || newId();
    record.createdAt = record.createdAt || nowIso();
    record.updatedAt = record.updatedAt || record.createdAt;
    const created = await this.model.create(record);
    return toPlain(created);
  }

  async insertMany(docs) {
    const out = [];
    for (const doc of docs) out.push(await this.insert(doc));
    return out;
  }

  async findById(id) {
    if (!id) return null;
    return toPlain(await this.model.findById(id).lean().exec());
  }

  #query(query = {}) {
    return this.model.find(clone(query)).lean();
  }

  async find(query = {}, options = {}) {
    let cursor = this.#query(query);
    if (options.sort) cursor = cursor.sort(options.sort);
    if (options.skip) cursor = cursor.skip(options.skip);
    if (options.limit) cursor = cursor.limit(options.limit);
    const docs = await cursor.exec();
    return docs.map(toPlain);
  }

  async findOne(query = {}, options = {}) {
    let cursor = this.#query(query);
    if (options.sort) cursor = cursor.sort(options.sort);
    const doc = await cursor.exec();
    if (!doc.length) return null;
    return toPlain(doc[0]);
  }

  async count(query = {}) {
    return this.model.countDocuments(clone(query)).exec();
  }

  async updateById(id, patch) {
    if (!id) return null;
    const existing = await this.model.findById(id).lean().exec();
    if (!existing) return null;
    const merged = mergeDeep(clone(existing), clone(patch));
    merged.updatedAt = nowIso();
    await this.model.replaceOne({ _id: id }, merged).exec();
    return toPlain(merged);
  }

  async updateMany(query, patch) {
    const docs = await this.model.find(clone(query)).lean().exec();
    for (const doc of docs) await this.updateById(doc._id, patch);
    return docs.length;
  }

  async deleteById(id) {
    if (!id) return false;
    const result = await this.model.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async deleteMany(query = {}) {
    const result = await this.model.deleteMany(clone(query)).exec();
    return result.deletedCount || 0;
  }
}

function mergeDeep(target, patch) {
  for (const [key, value] of Object.entries(patch || {})) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      mergeDeep(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

function createMongoBackend({ uri }) {
  const models = {};
  for (const name of COLLECTIONS) {
    models[name] = mongoose.models[name] || mongoose.model(name, schemas[name], name);
  }

  const collections = {};
  for (const name of COLLECTIONS) collections[name] = new MongooseCollection(name, models[name]);

  return {
    kind: 'mongo',
    label: `MongoDB (${uri.replace(/\/\/.*@/, '//***@')})`,
    collections,
    collection: (name) => collections[name],
    async connect() {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      return true;
    },
    async disconnect() {
      await mongoose.disconnect();
    },
    raw: () => mongoose.connection,
  };
}

module.exports = { createMongoBackend, COLLECTIONS, schemas };
