'use strict';
/** Public metadata used to populate the forms and filters in the client. */
const express = require('express');
const config = require('../config');
const mailer = require('../services/mailer');
const { databaseInfo } = require('../db');
const { asyncHandler } = require('../utils/httpError');
const constants = require('../models/constants');
const { GRADE_OPTIONS } = require('../services/applicationForm');

const router = express.Router();

const payload = () => ({
  organisation: config.org,
  districts: constants.DISTRICTS,
  alStreams: constants.AL_STREAMS,
  studyStreams: constants.STUDY_STREAMS,
  grades: GRADE_OPTIONS,
  eventTypes: constants.EVENT_TYPES,
  eventStatuses: Object.values(constants.EVENT_STATUS),
  volunteerRoles: constants.VOLUNTEER_ROLES,
  volunteerStatuses: Object.values(constants.VOLUNTEER_STATUS),
  applicationStatuses: constants.APPLICATION_STATUS_META,
  scholarshipCategories: constants.SCHOLARSHIP_CATEGORIES,
  scholarshipStatuses: Object.values(constants.SCHOLARSHIP_STATUS),
  documentTypes: constants.DOCUMENT_TYPES,
  incomeSources: [
    'Government / private employment',
    'Daily wage labour',
    'Farming',
    'Fishing',
    'Small business / self employment',
    'Overseas employment (foreign remittance)',
    'Pension',
    'Samurdhi / social assistance',
    'No regular income',
    'Other',
  ],
  availabilityOptions: [
    'Full day',
    'Morning (8am - 12pm)',
    'Afternoon (12pm - 5pm)',
    'Evening (5pm - 8pm)',
    'Weekends only',
    'Flexible / on call',
  ],
  yearOfStudyOptions: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Foundation / Diploma', 'Other'],
  contactMethods: ['Email', 'Phone', 'WhatsApp'],
  genderOptions: ['Male', 'Female', 'Other'],
  mediumOfStudyOptions: ['English', 'Sinhala', 'Tamil', 'Bilingual'],
  mailMode: mailer.mode(),
  database: databaseInfo().kind,
});

/** GET /api/meta */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(payload());
  })
);

module.exports = router;
