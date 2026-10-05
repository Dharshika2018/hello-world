import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { meta as metaApi } from '../api/client.js';

const FALLBACK = {
  organisation: {
    name: 'Scholarship Foundation',
    shortName: 'SF',
    tagline: 'Empowering Students. Shaping Futures.',
    email: 'info@scholarshipfoundation.org',
    phone: '+94 11 234 5678',
    address: '42, Foundation Road, Colombo 07, Sri Lanka',
  },
  districts: [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota',
    'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Moneragala', 'Ratnapura', 'Kegalle',
  ],
  alStreams: ['Maths', 'Science', 'Commerce', 'Arts', 'Technology', 'Other'],
  studyStreams: [
    'IT / Computing', 'Business / Management', 'Engineering', 'Hospitality Management',
    'Travel & Tourism Management', 'Law', 'Nursing', 'Psychology', 'Fashion & Design',
    'Medicine / Health Sciences', 'Education', 'Other',
  ],
  grades: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'S', 'D', 'F', 'W', 'AB', 'Pending'],
  eventTypes: ['O/L Seminar', 'Paper Class', 'A/L Seminar', 'Career Guidance', 'Workshop', 'Community Outreach', 'Fundraiser', 'Awareness Programme'],
  eventStatuses: ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled'],
  volunteerRoles: ['Seminar Coordinator', 'O/L Paper Class Teacher', 'Subject Tutor', 'Registration Desk', 'Logistics & Setup', 'Photography / Media', 'Student Mentor', 'Fundraising Support', 'Any role as needed'],
  volunteerStatuses: ['pending', 'approved', 'rejected'],
  applicationStatuses: {
    pending: { label: 'Pending Review', tone: 'warning' },
    under_review: { label: 'Under Review', tone: 'info' },
    approved: { label: 'Approved', tone: 'success' },
    rejected: { label: 'Rejected', tone: 'danger' },
  },
  scholarshipCategories: ['school', 'university'],
  scholarshipStatuses: ['draft', 'open', 'closed'],
  documentTypes: [
    { key: 'nicCopy', label: 'NIC / Birth Certificate copy', required: true },
    { key: 'alResults', label: 'A/L results sheet (or O/L results sheet for school applicants)', required: true },
    { key: 'incomeProof', label: 'Proof of household income / Grama Niladhari certificate', required: false },
    { key: 'schoolLetter', label: 'School / University recommendation letter', required: false },
    { key: 'otherCertificates', label: 'Other certificates (sports, leadership, awards)', required: false },
  ],
  incomeSources: [
    'Government / private employment', 'Daily wage labour', 'Farming', 'Fishing', 'Small business / self employment',
    'Overseas employment (foreign remittance)', 'Pension', 'Samurdhi / social assistance', 'No regular income', 'Other',
  ],
  availabilityOptions: ['Full day', 'Morning (8am - 12pm)', 'Afternoon (12pm - 5pm)', 'Evening (5pm - 8pm)', 'Weekends only', 'Flexible / on call'],
  yearOfStudyOptions: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Foundation / Diploma', 'Other'],
  contactMethods: ['Email', 'Phone', 'WhatsApp'],
  genderOptions: ['Male', 'Female', 'Other'],
  mediumOfStudyOptions: ['English', 'Sinhala', 'Tamil', 'Bilingual'],
  mailMode: 'outbox',
  database: 'memory',
};

const SiteContext = createContext(FALLBACK);

export function SiteProvider({ children }) {
  const [data, setData] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    metaApi
      .all()
      .then((result) => {
        if (active) setData({ ...FALLBACK, ...result });
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({ ...data, loading }), [data, loading]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);

/** Status → tone/label helpers shared by every screen. */
export const statusMeta = (status, overrides = {}) => {
  const map = {
    pending: { label: 'Pending Review', tone: 'warning' },
    under_review: { label: 'Under Review', tone: 'info' },
    approved: { label: 'Approved', tone: 'success' },
    rejected: { label: 'Rejected', tone: 'danger' },
    open: { label: 'Open', tone: 'success' },
    closed: { label: 'Closed', tone: 'muted' },
    draft: { label: 'Draft', tone: 'muted' },
    upcoming: { label: 'Upcoming', tone: 'info' },
    ongoing: { label: 'Ongoing', tone: 'warning' },
    completed: { label: 'Completed', tone: 'muted' },
    cancelled: { label: 'Cancelled', tone: 'danger' },
    queued: { label: 'Queued (outbox)', tone: 'warning' },
    sent: { label: 'Sent', tone: 'success' },
    failed: { label: 'Failed', tone: 'danger' },
    active: { label: 'Active', tone: 'success' },
    inactive: { label: 'Inactive', tone: 'danger' },
    ...overrides,
  };
  return map[status] || { label: status || '-', tone: 'muted' };
};
