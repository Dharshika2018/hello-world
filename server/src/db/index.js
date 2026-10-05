'use strict';
/**
 * Database entry point.
 *
 * The application talks to `db.collection('users')` and friends. Which physical
 * backend serves those collections depends on DB_MODE:
 *
 *   mongo  -> MongoDB only (this is what you use locally with MongoDB Compass)
 *   memory -> built-in JSON-file backed dev store (no MongoDB needed)
 *   auto   -> try MongoDB first and fall back to the dev store (default)
 */
const config = require('../config');
const { createMemoryBackend } = require('./memory');
const { createMongoBackend } = require('./mongo');

let backend = null;
let fallbackReason = null;

async function initDatabase() {
  if (backend) return backend;

  if (config.dbMode === 'memory') {
    backend = createMemoryBackend({ dataFile: config.memoryDataFile });
    await backend.connect();
    console.log('[db] Using the in-memory dev store (DB_MODE=memory).');
    return backend;
  }

  try {
    backend = createMongoBackend({ uri: config.mongoUri });
    await backend.connect();
    console.log(`[db] Connected to MongoDB: ${config.mongoUri}`);
    return backend;
  } catch (error) {
    if (config.dbMode === 'mongo') {
      console.error(`[db] Could not connect to MongoDB at ${config.mongoUri}`);
      console.error(`[db] ${error.message}`);
      throw error;
    }
    fallbackReason = error.message;
    backend = createMemoryBackend({ dataFile: config.memoryDataFile });
    await backend.connect();
    console.log('');
    console.log('  ┌──────────────────────────────────────────────────────────────────────┐');
    console.log('  │  MongoDB is not reachable - running on the built-in dev database.    │');
    console.log('  │  Data is stored in: server/.data/memory-db.json                      │');
    console.log('  │  For the real MongoDB experience run:   mongod                       │');
    console.log('  │  then restart with:  DB_MODE=mongo npm run dev                       │');
    console.log('  └──────────────────────────────────────────────────────────────────────┘');
    console.log('');
    return backend;
  }
}

function db() {
  if (!backend) throw new Error('Database has not been initialised yet');
  return backend;
}

function collection(name) {
  return db().collection(name);
}

function databaseInfo() {
  return {
    kind: backend ? backend.kind : 'unknown',
    label: backend ? backend.label : 'not connected',
    uri: config.mongoUri,
    fallbackReason,
    mode: config.dbMode,
  };
}

async function closeDatabase() {
  if (backend) await backend.disconnect();
  backend = null;
}

module.exports = { initDatabase, closeDatabase, db, collection, databaseInfo };
