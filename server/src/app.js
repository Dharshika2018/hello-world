'use strict';
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const config = require('./config');
const { HttpError } = require('./utils/httpError');
const { databaseInfo } = require('./db');

const authRoutes = require('./routes/auth');
const metaRoutes = require('./routes/meta');
const scholarshipRoutes = require('./routes/scholarships');
const eventRoutes = require('./routes/events');
const applicationRoutes = require('./routes/applications');
const volunteerRoutes = require('./routes/volunteers');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '3mb' }));
  app.use(express.urlencoded({ extended: true, limit: '3mb' }));
  if (config.nodeEnv !== 'test') app.use(morgan('dev'));

  // Uploaded documents (application attachments)
  app.use('/uploads', express.static(config.uploadDir, { maxAge: '1h' }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: databaseInfo(), organisation: config.org.name, time: new Date().toISOString() });
  });

  app.use('/api/meta', metaRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/scholarships', scholarshipRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/volunteers', volunteerRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);

  // Serve the built client (npm run build) from the same origin when available
  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api|\/uploads).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use('/api', (req, res) => {
    res.status(404).json({ message: `Unknown API endpoint: ${req.method} ${req.originalUrl}` });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? `Each file must be smaller than ${config.maxUploadMb}MB`
          : `Upload failed: ${error.message}`;
      return res.status(400).json({ message });
    }
    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message, errors: error.details || undefined });
    }
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error('[error]', error);
    return res.status(500).json({ message: 'Something went wrong on the server. Please try again.' });
  });

  return app;
}

module.exports = { createApp };
