'use strict';
/**
 * Server side validation of the scholarship application form.
 *
 * The form is a multi-step wizard in the student portal:
 *   1. Scholarship & applicant type (school student / university student)
 *   2. Personal details
 *   3. Guardian & household information
 *   4. Education & results
 *   5. Financial need, study plan & motivation
 *   6. Documents & declaration
 *
 * `validateApplication` returns a normalised document plus a per-field error map
 * so the client can highlight exactly what needs attention.
 */
const { patterns, normalisePhone } = require('../utils/validate');
const { AL_STREAMS, STUDY_STREAMS, DISTRICTS, APPLICATION_STATUS } = require('../models/constants');

const GRADE_OPTIONS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'S', 'D', 'F', 'W', 'AB', 'Pending'];

const text = (value) => (value === undefined || value === null ? '' : String(value).trim());
const bool = (value) => value === true || value === 'true' || value === 'on' || value === 1 || value === '1';
const numeric = (value) => {
  if (value === '' || value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? NaN : parsed;
};

function normaliseResults(list, { required, labelPrefix }) {
  const rows = Array.isArray(list) ? list : [];
  const cleaned = rows
    .map((row) => ({
      subject: text(row?.subject),
      grade: text(row?.grade),
      year: text(row?.year),
    }))
    .filter((row) => row.subject || row.grade);

  if (!required) return { rows: cleaned };

  const complete = cleaned.filter((row) => row.subject && row.grade);
  if (complete.length < 3) return { error: `${labelPrefix}: please enter at least 3 subject results` };
  return { rows: complete };
}

function validateApplication(payload = {}) {
  const errors = {};
  const out = {};

  /* ---------------------------------------------------------------- step 1 */
  const applicantType = text(payload.applicantType);
  if (!['school', 'university'].includes(applicantType)) {
    errors.applicantType = 'Select whether you are a school student or a university student';
  } else {
    out.applicantType = applicantType;
  }

  const scholarshipId = text(payload.scholarshipId);
  if (!scholarshipId) errors.scholarshipId = 'Select the scholarship you are applying for';
  else out.scholarshipId = scholarshipId;

  /* ---------------------------------------------------------------- step 2 */
  const personal = payload.personal || {};
  const p = {};
  const requireText = (target, key, label, { min = 2, max = 220, match, message, optional } = {}) => {
    const value = text(target[key]);
    if (!value) {
      if (!optional) errors[`personal.${key}`] = `${label} is required`;
      return;
    }
    if (value.length < min) {
      errors[`personal.${key}`] = `${label} looks too short`;
      return;
    }
    if (value.length > max) {
      errors[`personal.${key}`] = `${label} must be under ${max} characters`;
      return;
    }
    if (match && !match.test(value)) {
      errors[`personal.${key}`] = message || `${label} is not valid`;
      return;
    }
    p[key] = value;
  };

  requireText(personal, 'fullName', 'Full name', { min: 3, max: 150 });
  requireText(personal, 'nameWithInitials', 'Name with initials', { optional: true, max: 150 });
  requireText(personal, 'nic', 'NIC number', {
    match: patterns.nic,
    message: 'Use 9 digits followed by V/X, or the 12 digit NIC number',
  });
  requireText(personal, 'email', 'Email address', { match: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, message: 'Enter a valid email address' });
  requireText(personal, 'phone', 'Phone number', {
    match: patterns.phone,
    message: 'Use a Sri Lankan number such as 0771234567 or +94771234567',
  });
  requireText(personal, 'address', 'Permanent address', { min: 8, max: 240 });
  requireText(personal, 'district', 'District');
  requireText(personal, 'dateOfBirth', 'Date of birth');
  requireText(personal, 'gender', 'Gender');

  if (p.district && !DISTRICTS.includes(p.district)) errors['personal.district'] = 'Select a district from the list';
  if (p.phone) p.phone = normalisePhone(p.phone);
  if (p.whatsapp) p.whatsapp = normalisePhone(text(personal.whatsapp));
  if (p.email) p.email = p.email.toLowerCase();
  p.divisionalSecretariat = text(personal.divisionalSecretariat);
  p.postalCode = text(personal.postalCode);
  p.preferredContactMethod = text(personal.preferredContactMethod) || 'Email';
  out.personal = p;

  /* ---------------------------------------------------------------- step 3 */
  const guardian = payload.guardian || {};
  const g = {};
  ['name', 'relationship', 'occupation', 'nic'].forEach((key) => {
    g[key] = text(guardian[key]);
  });
  if (!g.name) errors['guardian.name'] = "Guardian's name is required";
  if (!g.relationship) errors['guardian.relationship'] = 'Relationship to you is required';
  g.phone = normalisePhone(text(guardian.phone));
  if (!g.phone) errors['guardian.phone'] = "Guardian's contact number is required";
  const guardianIncome = numeric(guardian.monthlyIncome);
  if (guardianIncome === null || Number.isNaN(guardianIncome)) errors['guardian.monthlyIncome'] = "Guardian's monthly income is required";
  else if (guardianIncome < 0) errors['guardian.monthlyIncome'] = 'Income cannot be negative';
  else g.monthlyIncome = guardianIncome;
  out.guardian = g;

  const household = payload.household || {};
  const h = {};
  const members = numeric(household.members);
  if (members === null || Number.isNaN(members) || members < 1) errors['household.members'] = 'Enter the number of family members';
  else h.members = members;

  const householdIncome = numeric(household.monthlyIncome);
  if (householdIncome === null || Number.isNaN(householdIncome)) errors['household.monthlyIncome'] = 'Enter the total monthly household income';
  else h.monthlyIncome = householdIncome;

  const siblings = numeric(household.siblingsInSchool);
  h.siblingsInSchool = Number.isNaN(siblings) || siblings === null ? 0 : siblings;
  h.incomeSources = Array.isArray(household.incomeSources) ? household.incomeSources.map(text).filter(Boolean) : [];
  if (!h.incomeSources.length) errors['household.incomeSources'] = 'Select at least one source of family income';
  h.incomeSourceOther = text(household.incomeSourceOther);
  h.receivesSamurdhi = bool(household.receivesSamurdhi);
  h.receivesOtherSupport = bool(household.receivesOtherSupport);
  h.supportDetails = text(household.supportDetails);
  out.household = h;

  /* ---------------------------------------------------------------- step 4 */
  const education = payload.education || {};
  const e = {};
  e.achievements = text(education.achievements);
  e.leadershipPositions = text(education.leadershipPositions);
  e.extracurricularActivities = text(education.extracurricularActivities);
  e.preferredStudyStream = text(education.preferredStudyStream);
  if (!e.preferredStudyStream) errors['education.preferredStudyStream'] = 'Select your preferred field of study';
  else if (!STUDY_STREAMS.includes(e.preferredStudyStream)) errors['education.preferredStudyStream'] = 'Select a field of study from the list';
  e.preferredInstitute = text(education.preferredInstitute);
  e.preferredIntake = text(education.preferredIntake) || 'Next intake';

  if (applicantType === 'school') {
    e.schoolName = text(education.schoolName);
    e.schoolDistrict = text(education.schoolDistrict);
    e.schoolType = text(education.schoolType);
    e.currentGradeLevel = text(education.currentGradeLevel);
    e.olExamYear = text(education.olExamYear);
    e.olIndexNo = text(education.olIndexNo);

    if (!e.schoolName) errors['education.schoolName'] = 'School name is required';
    if (!e.schoolDistrict) errors['education.schoolDistrict'] = 'School district is required';
    if (!e.olExamYear) errors['education.olExamYear'] = 'O/L examination year is required';
    if (!e.currentGradeLevel) errors['education.currentGradeLevel'] = 'Select your current grade / level';

    const ol = normaliseResults(education.olResults, { required: true, labelPrefix: 'O/L results' });
    if (ol.error) errors['education.olResults'] = ol.error;
    else e.olResults = ol.rows;

    const al = normaliseResults(education.alResults, { required: false });
    e.alResults = al.rows || [];

    // A/L details are optional for school applicants but validated when supplied
    if (text(education.alExamYear)) e.alExamYear = text(education.alExamYear);
    if (text(education.alStream)) {
      if (!AL_STREAMS.includes(text(education.alStream))) errors['education.alStream'] = 'Select an A/L stream from the list';
      else e.alStream = text(education.alStream);
    }
    e.alIndexNo = text(education.alIndexNo);
  } else if (applicantType === 'university') {
    e.universityName = text(education.universityName);
    e.universityDistrict = text(education.universityDistrict);
    e.degreeProgramme = text(education.degreeProgramme);
    e.universityRegNo = text(education.universityRegNo);
    e.yearOfStudy = text(education.yearOfStudy);
    e.expectedGraduation = text(education.expectedGraduation);
    e.mediumOfStudy = text(education.mediumOfStudy);
    e.isStateUniversity = bool(education.isStateUniversity);

    if (!e.universityName) errors['education.universityName'] = 'University / higher education institute is required';
    if (!e.degreeProgramme) errors['education.degreeProgramme'] = 'Degree programme is required';
    if (!e.yearOfStudy) errors['education.yearOfStudy'] = 'Year of study is required';
    if (!e.expectedGraduation) errors['education.expectedGraduation'] = 'Expected graduation year is required';

    const gpa = numeric(education.gpa);
    if (education.gpa !== undefined && education.gpa !== '' && (gpa === null || Number.isNaN(gpa) || gpa < 0)) {
      errors['education.gpa'] = 'Enter a valid GPA / average mark';
    } else if (gpa !== null && !Number.isNaN(gpa)) {
      e.gpa = gpa;
    }

    const al = normaliseResults(education.alResults, { required: true, labelPrefix: 'A/L results' });
    if (al.error) errors['education.alResults'] = al.error;
    else e.alResults = al.rows;

    if (!text(education.alExamYear)) errors['education.alExamYear'] = 'A/L examination year is required';
    else e.alExamYear = text(education.alExamYear);
    if (!text(education.alStream)) errors['education.alStream'] = 'Select your A/L stream';
    else if (!AL_STREAMS.includes(text(education.alStream))) errors['education.alStream'] = 'Select an A/L stream from the list';
    else e.alStream = text(education.alStream);
    e.alIndexNo = text(education.alIndexNo);
    e.olResults = normaliseResults(education.olResults, { required: false }).rows || [];
  }
  out.education = e;

  /* ---------------------------------------------------------------- step 5 */
  const financial = payload.financial || {};
  const f = {};
  const requested = numeric(financial.requestedAmount);
  if (requested === null || Number.isNaN(requested) || requested <= 0) {
    errors['financial.requestedAmount'] = 'Enter the amount of financial support you need (LKR)';
  } else f.requestedAmount = requested;

  f.requestedFrequency = text(financial.requestedFrequency) || 'Per academic year';
  f.purpose = text(financial.purpose);
  if (!f.purpose || f.purpose.length < 10) errors['financial.purpose'] = 'Briefly describe what the funds will be used for';

  f.existingScholarships = text(financial.existingScholarships);
  f.bankName = text(financial.bankName);
  f.bankBranch = text(financial.bankBranch);
  f.bankAccountName = text(financial.bankAccountName);
  f.bankAccountNumber = text(financial.bankAccountNumber);
  if (f.bankAccountNumber && !/^[0-9]{6,20}$/.test(f.bankAccountNumber)) {
    errors['financial.bankAccountNumber'] = 'Account number should contain 6-20 digits';
  }
  out.financial = f;

  const motivation = payload.motivation || {};
  const m = {};
  m.reasonForApplication = text(motivation.reasonForApplication);
  m.financialHardship = text(motivation.financialHardship);
  m.futureGoals = text(motivation.futureGoals);
  m.communityContribution = text(motivation.communityContribution);

  if (m.reasonForApplication.length < 60) {
    errors['motivation.reasonForApplication'] = 'Please write at least a few sentences (60 characters) about why you should receive this scholarship';
  }
  if (m.financialHardship.length < 40) {
    errors['motivation.financialHardship'] = 'Please describe your family financial situation (at least 40 characters)';
  }
  if (m.futureGoals.length < 30) {
    errors['motivation.futureGoals'] = 'Tell us about your goals after completing your studies (at least 30 characters)';
  }
  out.motivation = m;

  /* ---------------------------------------------------------------- step 6 */
  const declaration = payload.declaration || {};
  const d = {
    declaration: bool(declaration.declaration),
    consentToVerify: bool(declaration.consentToVerify),
    studentSignature: text(declaration.studentSignature),
    guardianSignature: text(declaration.guardianSignature),
    declarationDate: text(declaration.declarationDate) || new Date().toISOString().slice(0, 10),
    place: text(declaration.place),
  };
  if (!d.declaration) errors['declaration.declaration'] = 'You must accept the declaration before submitting';
  if (!d.consentToVerify) errors['declaration.consentToVerify'] = 'Consent to verify your documents is required';
  if (!d.studentSignature) errors['declaration.studentSignature'] = 'Type your full name as your signature';
  if (applicantType === 'school' && !d.guardianSignature) {
    errors['declaration.guardianSignature'] = 'A parent / guardian signature is required for school applicants';
  }
  out.declaration = d;

  out.documents = payload.documents || {};
  out.attachments = Array.isArray(payload.attachments) ? payload.attachments : [];

  return { value: out, errors, hasErrors: Object.keys(errors).length > 0 };
}

const SUBMITTABLE_STATUSES = [APPLICATION_STATUS.pending, APPLICATION_STATUS.under_review];

module.exports = { validateApplication, GRADE_OPTIONS, SUBMITTABLE_STATUSES };
