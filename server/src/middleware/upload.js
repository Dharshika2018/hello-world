'use strict';
/** Document uploads (application attachments). */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const config = require('../config');
const { badRequest } = require('../utils/httpError');

const documentDir = path.join(config.uploadDir, 'documents');
fs.mkdirSync(documentDir, { recursive: true });

const ALLOWED = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, documentDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').slice(0, 10) || '';
    cb(null, `${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext.toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(badRequest('Only PDF, JPG, PNG or WEBP files can be uploaded'));
    }
    return cb(null, true);
  },
});

/** Accepts the six document fields declared in models/constants.js. */
const applicationDocuments = upload.fields([
  { name: 'nicCopy', maxCount: 1 },
  { name: 'alResults', maxCount: 1 },
  { name: 'incomeProof', maxCount: 1 },
  { name: 'schoolLetter', maxCount: 1 },
  { name: 'otherCertificates', maxCount: 4 },
]);

function publicFileUrl(file) {
  return `/uploads/documents/${file.filename}`;
}

module.exports = { upload, applicationDocuments, publicFileUrl, documentDir };
