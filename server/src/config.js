'use strict';
/**
 * Central configuration.
 * All values can be overridden with environment variables (see server/.env.example).
 */
const path = require('path');
const fs = require('fs');

// Load server/.env (falls back silently when the file does not exist)
const envPath = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

const rootDir = path.resolve(__dirname, '..');

function bool(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

const config = {
  rootDir,
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  /**
   * Database
   *  DB_MODE = mongo   -> always use MongoDB (fails if unreachable)
   *  DB_MODE = memory  -> always use the built-in file-backed dev store
   *  DB_MODE = auto    -> try MongoDB, fall back to the memory store (default)
   */
  dbMode: (process.env.DB_MODE || 'auto').toLowerCase(),
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/scholarship_portal',
  memoryDataFile: process.env.MEMORY_DATA_FILE || path.join(rootDir, '.data', 'memory-db.json'),

  jwtSecret: process.env.JWT_SECRET || 'scholarship-portal-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  uploadDir: process.env.UPLOAD_DIR || path.join(rootDir, 'uploads'),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 5),

  // SMTP - when SMTP_HOST is empty the app runs in "Email Outbox" (dev) mode:
  // every email is stored in the database and shown in Admin > Email Outbox.
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: bool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'Scholarship Foundation <no-reply@scholarshipfoundation.org>',
  },

  org: {
    name: process.env.ORG_NAME || 'Scholarship Foundation',
    shortName: process.env.ORG_SHORT_NAME || 'SF',
    tagline: process.env.ORG_TAGLINE || 'Empowering Students. Shaping Futures.',
    email: process.env.ORG_EMAIL || 'info@scholarshipfoundation.org',
    phone: process.env.ORG_PHONE || '+94 11 234 5678',
    address: process.env.ORG_ADDRESS || '42, Foundation Road, Colombo 07, Sri Lanka',
  },

  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@scholarship.org',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
    studentEmail: process.env.SEED_STUDENT_EMAIL || 'student@example.com',
    studentPassword: process.env.SEED_STUDENT_PASSWORD || 'Student@123',
  },
};

fs.mkdirSync(config.uploadDir, { recursive: true });
fs.mkdirSync(path.dirname(config.memoryDataFile), { recursive: true });

module.exports = config;
