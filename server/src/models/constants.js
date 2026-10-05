'use strict';

/** Application workflow states. */
const APPLICATION_STATUS = {
  pending: 'pending',
  under_review: 'under_review',
  approved: 'approved',
  rejected: 'rejected',
};

const APPLICATION_STATUS_META = {
  pending: { label: 'Pending Review', tone: 'warning' },
  under_review: { label: 'Under Review', tone: 'info' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

/** Volunteer sign-up workflow states. */
const VOLUNTEER_STATUS = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
};

const VOLUNTEER_ROLES = [
  'Seminar Coordinator',
  'O/L Paper Class Teacher',
  'Subject Tutor',
  'Registration Desk',
  'Logistics & Setup',
  'Photography / Media',
  'Student Mentor',
  'Fundraising Support',
  'Any role as needed',
];

const SCHOLARSHIP_STATUS = { draft: 'draft', open: 'open', closed: 'closed' };
const SCHOLARSHIP_CATEGORIES = ['school', 'university'];

const EVENT_TYPES = [
  'O/L Seminar',
  'Paper Class',
  'A/L Seminar',
  'Career Guidance',
  'Workshop',
  'Community Outreach',
  'Fundraiser',
  'Awareness Programme',
];

const EVENT_STATUS = { draft: 'draft', upcoming: 'upcoming', ongoing: 'ongoing', completed: 'completed', cancelled: 'cancelled' };

/** A/L subject streams (the foundation runs O/L paper classes + A/L support). */
const AL_STREAMS = ['Maths', 'Science', 'Commerce', 'Arts', 'Technology', 'Other'];

const STUDY_STREAMS = [
  'IT / Computing',
  'Business / Management',
  'Engineering',
  'Hospitality Management',
  'Travel & Tourism Management',
  'Law',
  'Nursing',
  'Psychology',
  'Fashion & Design',
  'Medicine / Health Sciences',
  'Education',
  'Other',
];

const DISTRICTS = [
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Galle',
  'Matara',
  'Hambantota',
  'Jaffna',
  'Kilinochchi',
  'Mannar',
  'Vavuniya',
  'Mullaitivu',
  'Batticaloa',
  'Ampara',
  'Trincomalee',
  'Kurunegala',
  'Puttalam',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Moneragala',
  'Ratnapura',
  'Kegalle',
];

/** Document types students can upload with an application. */
const DOCUMENT_TYPES = [
  { key: 'nicCopy', label: 'NIC / Birth Certificate copy', required: true },
  { key: 'alResults', label: 'A/L results sheet (or O/L results sheet for school applicants)', required: true },
  { key: 'incomeProof', label: 'Proof of household income / Grama Niladhari certificate', required: false },
  { key: 'schoolLetter', label: 'School / University recommendation letter', required: false },
  { key: 'otherCertificates', label: 'Other certificates (sports, leadership, awards)', required: false },
];

const EMAIL_STATUS = { queued: 'queued', sent: 'sent', failed: 'failed' };

module.exports = {
  APPLICATION_STATUS,
  APPLICATION_STATUS_META,
  VOLUNTEER_STATUS,
  VOLUNTEER_ROLES,
  SCHOLARSHIP_STATUS,
  SCHOLARSHIP_CATEGORIES,
  EVENT_TYPES,
  EVENT_STATUS,
  AL_STREAMS,
  STUDY_STREAMS,
  DISTRICTS,
  DOCUMENT_TYPES,
  EMAIL_STATUS,
};
