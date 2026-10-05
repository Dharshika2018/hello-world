'use strict';
/**
 * Demo data seeder.
 *
 * Run manually:   npm run seed            (add --reset to wipe first)
 * Automatically:  the server calls ensureSeedData() on start, which only creates
 *                 data that does not exist yet - it never overwrites your records.
 */
const bcrypt = require('bcryptjs');
const config = require('../config');
const { initDatabase, collection, databaseInfo } = require('../db');
const { newId, nowIso } = require('../utils/ids');
const userRepo = require('../repos/users');
const scholarshipRepo = require('../repos/scholarships');
const eventRepo = require('../repos/events');
const applicationRepo = require('../repos/applications');
const volunteerRepo = require('../repos/volunteers');
const notificationRepo = require('../repos/notifications');
const emailRepo = require('../repos/emails');
const { templates } = require('../services/emailTemplates');

const DAY = 24 * 60 * 60 * 1000;
const today = () => new Date();
const iso = (date) => date.toISOString();
const dateOnly = (offsetDays = 0) => new Date(today().getTime() + offsetDays * DAY).toISOString().slice(0, 10);

const ADMIN = {
  name: 'Chamara Wijesinghe',
  email: config.seed.adminEmail,
  password: config.seed.adminPassword,
  role: 'admin',
  phone: '+94112345678',
  district: 'Colombo',
};

const STUDENTS = [
  {
    name: 'Nimal Perera',
    email: config.seed.studentEmail,
    password: config.seed.studentPassword,
    phone: '+94771234567',
    nic: '200312345678',
    district: 'Gampaha',
  },
  { name: 'Kavindi Fernando', email: 'kavindi@example.com', password: 'Student@123', phone: '+94719876543', nic: '199912345678V', district: 'Galle' },
  { name: 'Ahamed Rifhan', email: 'rifhan@example.com', password: 'Student@123', phone: '+94765551234', nic: '200245678912', district: 'Kandy' },
  { name: 'Tharshini Kumar', email: 'tharshini@example.com', password: 'Student@123', phone: '+94771112233', nic: '200198765432', district: 'Jaffna' },
  { name: 'Sanduni Jayawardena', email: 'sanduni@example.com', password: 'Student@123', phone: '+94707778899', nic: '200025551234', district: 'Matara' },
];

const SCHOLARSHIPS = [
  {
    title: 'O/L Star School Scholarship',
    code: 'SF-SCH-01',
    category: 'school',
    status: 'open',
    shortDescription: 'Full study-material and monthly allowance support for high-performing O/L students from low income families.',
    description:
      'The O/L Star scholarship supports school students who show outstanding academic ability but cannot afford the extra tuition, books and travel needed to perform at the G.C.E. Ordinary Level examination. Award holders receive a monthly allowance, a complete study pack, free access to all foundation paper classes and mentorship from university undergraduates.',
    eligibility:
      'Grade 10 or 11 student in a government or government assisted school\nSri Lankan citizen resident in any district\nHousehold monthly income below LKR 50,000\nRecommended by the school principal',
    awardAmount: 'LKR 5,000 / month',
    awardFrequency: 'Monthly',
    awardDuration: 'Up to 24 months until the O/L examination',
    academicYear: '2026',
    applicationOpenDate: dateOnly(-10),
    deadline: dateOnly(30),
    seats: 60,
    minimumGpa: 'Minimum 70% average in grade 9 and 10',
    benefits: [
      'Monthly study allowance of LKR 5,000',
      'Complete O/L study pack and past paper collection',
      'Free entry to every foundation paper class and seminar',
      'Mentorship by university undergraduates',
      'School bag, shoes and stationery grant',
    ],
    requirements: [
      'Copy of the school recommendation letter',
      'Latest term test results sheet',
      'Grama Niladhari income certificate',
    ],
    eligibleDistricts: [],
    contactPerson: 'Mrs. Ayesha Silva',
    contactEmail: 'schools@scholarshipfoundation.org',
    contactPhone: '+94 11 234 5678',
    featured: true,
  },
  {
    title: 'University Undergraduate Grant 2026',
    code: 'SF-UNI-01',
    category: 'university',
    status: 'open',
    shortDescription: 'Interest free education loan and monthly living grant for undergraduates facing financial hardship.',
    description:
      'The Undergraduate Grant covers tuition and living expenses for students who could not secure a state university placement, or who are studying at a state university but cannot afford accommodation, transport and study materials. Repayment of the interest free loan begins one year after graduation and is spread over five years.',
    eligibility:
      'Following a degree or higher diploma at a recognised institute\nA/L completed within the last 3 years (any stream)\nHousehold monthly income below LKR 75,000\nNot receiving a national level full scholarship for the same purpose',
    awardAmount: 'LKR 25,000 / month + tuition support',
    awardFrequency: 'Monthly',
    awardDuration: 'For the remaining duration of the degree',
    academicYear: '2026/2027',
    applicationOpenDate: dateOnly(-14),
    deadline: dateOnly(45),
    seats: 25,
    minimumGpa: 'Minimum 2.5 GPA or equivalent B average',
    benefits: [
      'Monthly living grant of LKR 25,000',
      'Direct payment of course fees up to LKR 250,000 per academic year',
      'Laptop grant for first year students',
      'Internship placement support with partner employers',
      'Interest free repayment plan after graduation',
    ],
    requirements: [
      'University admission letter or current registration letter',
      'A/L result sheet',
      'Bank statement or income certificate of the household',
      'Two referee letters',
    ],
    eligibleDistricts: [],
    contactPerson: 'Mr. Dinesh Rajapaksha',
    contactEmail: 'university@scholarshipfoundation.org',
    contactPhone: '+94 11 234 5679',
    featured: true,
  },
  {
    title: 'STEM Girls Scholarship',
    code: 'SF-SCH-02',
    category: 'school',
    status: 'open',
    shortDescription: 'Supporting female students who choose mathematics, science and technology streams at O/L and A/L.',
    description:
      'This programme encourages girls from rural districts to continue in the STEM stream after the Ordinary Level examination. The scholarship pays for laboratory equipment, transport to paper classes and provides a female engineer or scientist as a mentor.',
    eligibility: 'Female students in grade 11, 12 or 13 studying mathematics, science or technology',
    awardAmount: 'LKR 7,500 / month',
    awardFrequency: 'Monthly',
    awardDuration: 'Until the A/L examination',
    academicYear: '2026',
    applicationOpenDate: dateOnly(-5),
    deadline: dateOnly(21),
    seats: 30,
    benefits: ['Monthly allowance', 'Laboratory and equipment grant', 'Industry mentor for one year', 'Free A/L revision seminar'],
    requirements: ['School principal recommendation', 'Term test results', 'Income certificate'],
    eligibleDistricts: ['Kandy', 'Matale', 'Nuwara Eliya', 'Badulla', 'Moneragala', 'Ratnapura', 'Kurunegala', 'Anuradhapura', 'Polonnaruwa'],
    contactPerson: 'Ms. Iresha Bandara',
    contactEmail: 'stemgirls@scholarshipfoundation.org',
    contactPhone: '+94 11 234 5680',
    featured: false,
  },
  {
    title: 'Emergency Hardship Bursary',
    code: 'SF-UNI-02',
    category: 'university',
    status: 'closed',
    shortDescription: 'One-off bursary for students who lost family income due to illness, disaster or bereavement.',
    description:
      'A fast track bursary released within 14 days of an approved application for students whose families have suffered a sudden income shock. Funds can be used for tuition arrears, examination fees, accommodation or medical costs.',
    eligibility: 'Registered undergraduate who can evidence a sudden loss of household income',
    awardAmount: 'LKR 100,000 one off',
    awardFrequency: 'One off',
    awardDuration: 'Immediate',
    academicYear: '2025/2026',
    applicationOpenDate: dateOnly(-120),
    deadline: dateOnly(-15),
    seats: 15,
    benefits: ['One off cash bursary of LKR 100,000', 'Priority counselling support', 'Fast track 14 day approval process'],
    requirements: ['Evidence of the income shock', 'University registration letter', 'Grama Niladhari certificate'],
    eligibleDistricts: [],
    contactPerson: 'Mr. Dinesh Rajapaksha',
    contactEmail: 'bursary@scholarshipfoundation.org',
    contactPhone: '+94 11 234 5679',
    featured: false,
  },
];

const EVENTS = [
  {
    title: 'O/L Mathematics Paper Class - Colombo',
    type: 'Paper Class',
    status: 'upcoming',
    date: dateOnly(6),
    startTime: '08:30',
    endTime: '12:30',
    venue: 'Nalanda College Auditorium',
    district: 'Colombo',
    audience: 'Grade 10 and 11 students preparing for the O/L examination',
    description:
      'A full morning of past paper practice with our senior teachers. Students work through 2019-2024 mathematics papers, receive one to one marking and a personalised revision plan for the final term.',
    organiser: 'Scholarship Foundation Academic Unit',
    contactPerson: 'Mrs. Ayesha Silva',
    contactPhone: '+94 11 234 5678',
    contactEmail: 'schools@scholarshipfoundation.org',
    volunteersNeeded: 12,
    rolesNeeded: ['Registration Desk', 'Subject Tutor', 'Logistics & Setup', 'Logistics & Setup'],
    requirements: ['Arrive 45 minutes early for the briefing', 'Comfortable helping grade 10 and 11 students'],
    capacity: 250,
    registrationDeadline: dateOnly(4),
    agenda: [
      { time: '08:00', title: 'Volunteer briefing and hall setup' },
      { time: '08:30', title: 'Paper 1 - model paper and marking' },
      { time: '10:30', title: 'Tea break' },
      { time: '10:45', title: 'Paper 2 - structured questions' },
      { time: '12:30', title: 'Revision plan handout and closing' },
    ],
    featured: true,
  },
  {
    title: 'A/L Science Seminar - Kandy',
    type: 'A/L Seminar',
    status: 'upcoming',
    date: dateOnly(13),
    startTime: '09:00',
    endTime: '15:00',
    venue: 'Kandy Hindu Cultural Hall',
    district: 'Kandy',
    audience: 'A/L science stream students',
    description:
      'A full day seminar covering the most frequently examined sections of the A/L physics, chemistry and biology syllabus, delivered by lecturers from partner universities.',
    organiser: 'Scholarship Foundation Academic Unit',
    contactPerson: 'Ms. Iresha Bandara',
    contactPhone: '+94 81 234 5678',
    contactEmail: 'seminars@scholarshipfoundation.org',
    volunteersNeeded: 20,
    rolesNeeded: ['Seminar Coordinator', 'Registration Desk', 'Photography / Media', 'Subject Tutor'],
    requirements: ['Subject knowledge in science streams preferred', 'Full day availability'],
    capacity: 400,
    registrationDeadline: dateOnly(10),
    featured: true,
  },
  {
    title: 'Career Guidance Day for School Leavers',
    type: 'Career Guidance',
    status: 'upcoming',
    date: dateOnly(24),
    startTime: '09:30',
    endTime: '16:00',
    venue: 'Foundation Training Centre, Nugegoda',
    district: 'Colombo',
    audience: 'Students who completed O/L or A/L and parents',
    description:
      'Career counsellors, university representatives and employers help school leavers understand their options - from higher education pathways to vocational training and apprenticeships.',
    organiser: 'Scholarship Foundation Career Unit',
    contactPerson: 'Mr. Dinesh Rajapaksha',
    contactPhone: '+94 11 234 5679',
    contactEmail: 'careers@scholarshipfoundation.org',
    volunteersNeeded: 15,
    rolesNeeded: ['Student Mentor', 'Registration Desk', 'Fundraising Support'],
    requirements: ['Good communication skills in Sinhala, Tamil or English'],
    capacity: 180,
    registrationDeadline: dateOnly(20),
    featured: false,
  },
  {
    title: 'Scholarship Application Workshop (Online)',
    type: 'Workshop',
    status: 'upcoming',
    date: dateOnly(4),
    startTime: '18:00',
    endTime: '19:30',
    venue: 'Online - Zoom',
    district: 'Colombo',
    audience: 'Applicants and guardians',
    description:
      'A live session walking through every section of the scholarship application form, the required documents and the verification timeline. Bring your questions - the verification team will be on the call.',
    organiser: 'Scholarship Foundation Verification Team',
    contactPerson: 'Ms. Nadeesha Weerasinghe',
    contactPhone: '+94 11 234 5681',
    contactEmail: 'apply@scholarshipfoundation.org',
    volunteersNeeded: 4,
    rolesNeeded: ['Any role as needed'],
    requirements: ['Stable internet connection'],
    capacity: 500,
    registrationDeadline: dateOnly(3),
    featured: false,
  },
  {
    title: 'O/L Sinhala and English Paper Class - Galle',
    type: 'Paper Class',
    status: 'completed',
    date: dateOnly(-12),
    startTime: '08:30',
    endTime: '13:00',
    venue: 'Mahinda College Hall',
    district: 'Galle',
    audience: 'Grade 11 students',
    description: 'Completed revision paper class for the 2025 O/L batch covering both language papers with individual feedback.',
    organiser: 'Scholarship Foundation Academic Unit',
    contactPerson: 'Mrs. Ayesha Silva',
    contactPhone: '+94 11 234 5678',
    volunteersNeeded: 10,
    rolesNeeded: ['Subject Tutor', 'Logistics & Setup'],
    capacity: 200,
    featured: false,
  },
  {
    title: 'Community Library Book Drive - Jaffna',
    type: 'Community Outreach',
    status: 'completed',
    date: dateOnly(-28),
    venue: 'Jaffna Public Library',
    district: 'Jaffna',
    audience: 'Students of the Northern Province',
    startTime: '10:00',
    endTime: '15:00',
    description: 'Distributed 2,400 textbooks and stationery packs to students across five schools in the Northern Province.',
    organiser: 'Scholarship Foundation Outreach Team',
    contactPerson: 'Mr. Suresh Nadarajah',
    contactPhone: '+94 21 222 3344',
    volunteersNeeded: 25,
    rolesNeeded: ['Logistics & Setup', 'Photography / Media'],
    capacity: 0,
    featured: false,
  },
];

function applicationTemplate({ student, scholarshipId, applicantType, overrides = {} }) {
  const base = {
    userId: student._id,
    scholarshipId,
    applicantType,
    personal: {
      fullName: student.name,
      nameWithInitials: student.name,
      nic: student.nic,
      dateOfBirth: applicantType === 'school' ? '2010-04-12' : '2004-06-18',
      gender: student.name.includes('Kavindi') || student.name.includes('Tharshini') || student.name.includes('Sanduni') ? 'Female' : 'Male',
      email: student.email,
      phone: student.phone,
      whatsapp: student.phone,
      address: `No. ${Math.floor(Math.random() * 200) + 10}, ${student.district} Road, ${student.district}`,
      district: student.district,
      divisionalSecretariat: `${student.district} Divisional Secretariat`,
      postalCode: '00100',
      preferredContactMethod: 'Email',
    },
    guardian: {
      name: 'Mr. S. Perera',
      relationship: 'Father',
      occupation: 'Daily wage labourer',
      phone: student.phone,
      monthlyIncome: 38000,
    },
    household: {
      members: 5,
      monthlyIncome: 42000,
      siblingsInSchool: 2,
      incomeSources: ['Daily wage labour', 'Samurdhi / social assistance'],
      receivesSamurdhi: true,
      receivesOtherSupport: false,
      supportDetails: 'Receives Samurdhi allowance of LKR 5,000 per month.',
    },
    education:
      applicantType === 'school'
        ? {
            schoolName: 'Sri Lanka Government School',
            schoolDistrict: student.district,
            schoolType: 'Government',
            currentGradeLevel: 'Grade 11',
            olExamYear: '2026',
            olIndexNo: '1122334455',
            olResults: [
              { subject: 'Mathematics', grade: 'A' },
              { subject: 'Science', grade: 'A' },
              { subject: 'Sinhala Language', grade: 'B' },
              { subject: 'English Language', grade: 'B' },
              { subject: 'History', grade: 'A' },
              { subject: 'Business Studies', grade: 'A' },
            ],
            alResults: [],
            preferredStudyStream: 'IT / Computing',
            preferredInstitute: 'University of Moratuwa',
            preferredIntake: 'Next intake',
            achievements: 'School mathematics prize winner 2025, inter-school athletics 400m third place.',
            leadershipPositions: 'Class monitor, member of the school mathematics society.',
            extracurricularActivities: 'Athletics, school debate team, community shramadana campaigns.',
          }
        : {
            universityName: 'NSBM Green University',
            universityDistrict: 'Colombo',
            degreeProgramme: 'BSc (Hons) Software Engineering',
            universityRegNo: 'NSBM/2025/1122',
            yearOfStudy: 'Year 2',
            expectedGraduation: '2028',
            mediumOfStudy: 'English',
            isStateUniversity: false,
            gpa: 3.4,
            alExamYear: '2024',
            alIndexNo: '5566778899',
            alStream: 'Maths',
            alResults: [
              { subject: 'Combined Mathematics', grade: 'B' },
              { subject: 'Physics', grade: 'C' },
              { subject: 'Chemistry', grade: 'S' },
            ],
            olResults: [
              { subject: 'Mathematics', grade: 'A' },
              { subject: 'Science', grade: 'A' },
              { subject: 'English Language', grade: 'B' },
            ],
            preferredStudyStream: 'IT / Computing',
            preferredInstitute: 'NSBM Green University',
            preferredIntake: 'Semester 1',
            achievements: 'Dean list for semester 1, university hackathon finalist 2025.',
            leadershipPositions: 'Secretary of the university computer society.',
            extracurricularActivities: 'Robotics club, volunteer coding tutor for O/L students.',
          },
    financial: {
      requestedAmount: applicantType === 'school' ? 60000 : 300000,
      requestedFrequency: applicantType === 'school' ? 'Per academic year' : 'Per academic year',
      purpose: 'Tuition fees, study materials, transport to paper classes and examination fees.',
      existingScholarships: 'None',
      bankName: 'Bank of Ceylon',
      bankBranch: student.district,
      bankAccountName: student.name,
      bankAccountNumber: '0071234567',
    },
    motivation: {
      reasonForApplication:
        'I have performed consistently well at school and my teachers believe I can achieve excellent results, but my family cannot afford the extra classes and materials needed. This scholarship would let me focus completely on my studies instead of worrying about how to pay for them.',
      financialHardship:
        'My father is a daily wage labourer and my mother stays at home to look after my two younger siblings. Our household income is below LKR 45,000 a month and there is no fixed monthly salary, so paying for tuition or transport is extremely difficult during the low season.',
      futureGoals:
        'I want to complete my studies and become a software engineer so that I can support my family and fund scholarships for students from my district in the future.',
      communityContribution: 'I help coach junior students in mathematics every Saturday and take part in school community projects.',
    },
    declaration: {
      declaration: true,
      consentToVerify: true,
      studentSignature: student.name,
      guardianSignature: 'Mr. S. Perera',
      declarationDate: new Date().toISOString().slice(0, 10),
      place: student.district,
    },
    documents: {
      nicCopy: { label: 'NIC / Birth Certificate copy', name: 'nic-copy.pdf', url: '/uploads/samples/nic-copy.pdf', size: 245321, mimetype: 'application/pdf' },
      alResults: { label: 'A/L results sheet', name: 'result-sheet.pdf', url: '/uploads/samples/result-sheet.pdf', size: 318222, mimetype: 'application/pdf' },
      incomeProof: { label: 'Proof of household income', name: 'income-certificate.pdf', url: '/uploads/samples/income-certificate.pdf', size: 156780, mimetype: 'application/pdf' },
    },
  };
  return { ...base, ...overrides };
}

async function createUserFromSpec(spec) {
  const existing = await userRepo.findByEmail(spec.email);
  if (existing) return existing;
  return userRepo.createUser({
    name: spec.name,
    email: spec.email,
    passwordHash: await bcrypt.hash(spec.password, 10),
    role: spec.role || 'student',
    phone: spec.phone || '',
    nic: spec.nic || '',
    district: spec.district || '',
  });
}

async function ensureSeedData() {
  const users = await collection('users').count({});
  const admin = await createUserFromSpec(ADMIN);

  const students = [];
  for (const spec of STUDENTS) students.push(await createUserFromSpec(spec));

  let scholarshipCount = await collection('scholarships').count({});
  if (scholarshipCount === 0) {
    for (const scholarship of SCHOLARSHIPS) await scholarshipRepo.create(scholarship);
    scholarshipCount = SCHOLARSHIPS.length;
  }
  const allScholarships = await scholarshipRepo.listAll({ includeDrafts: true });

  let eventCount = await collection('events').count({});
  if (eventCount === 0) {
    for (const event of EVENTS) await eventRepo.create(event);
    eventCount = EVENTS.length;
  }
  const allEvents = (await eventRepo.list({ scope: 'all', limit: 100, includeDrafts: true })).items;

  let applicationCount = await collection('applications').count({});
  if (applicationCount === 0) {
    const schoolScholarships = allScholarships.filter((item) => item.category === 'school');
    const universityScholarships = allScholarships.filter((item) => item.category === 'university');
    const todayNow = today();
    const plan = [
      // Two applications submitted TODAY so the admin "applied today" list is populated
      { student: students[1], scholarship: schoolScholarships[0], applicantType: 'school', status: 'pending', createdAt: iso(new Date(todayNow.getTime() - 2 * 60 * 60 * 1000)) },
      { student: students[2], scholarship: universityScholarships[0], applicantType: 'university', status: 'pending', createdAt: iso(new Date(todayNow.getTime() - 5 * 60 * 60 * 1000)) },
      { student: students[3], scholarship: schoolScholarships[0], applicantType: 'school', status: 'pending', createdAt: iso(new Date(todayNow.getTime() - 26 * 60 * 60 * 1000)) },
      { student: students[4], scholarship: universityScholarships[0], applicantType: 'university', status: 'under_review', createdAt: iso(new Date(todayNow.getTime() - 3 * DAY)) },
      { student: students[0], scholarship: universityScholarships[1] || universityScholarships[0], applicantType: 'university', status: 'approved', createdAt: iso(new Date(todayNow.getTime() - 9 * DAY)) },
      { student: students[3], scholarship: schoolScholarships[1] || schoolScholarships[0], applicantType: 'school', status: 'rejected', createdAt: iso(new Date(todayNow.getTime() - 20 * DAY)) },
    ];

    for (const item of plan) {
      if (!item.student || !item.scholarship) continue;
      const application = await applicationRepo.create(
        applicationTemplate({
          student: item.student,
          scholarshipId: item.scholarship._id,
          applicantType: item.applicantType,
        })
      );
      const history = [{ status: 'pending', at: item.createdAt, by: 'system', note: 'Application submitted' }];
      if (item.status !== 'pending') {
        history.push({
          status: item.status,
          at: iso(new Date(new Date(item.createdAt).getTime() + DAY)),
          by: ADMIN.name,
          note:
            item.status === 'approved'
              ? 'All documents verified. Approved for the monthly grant.'
              : item.status === 'rejected'
                ? 'Household income exceeds the programme ceiling for this intake.'
                : 'Documents received, verification in progress.',
        });
      }
      await applicationRepo.update(application._id, {
        status: item.status,
        createdAt: item.createdAt,
        statusHistory: history,
        admin: {
          note:
            item.status === 'approved'
              ? 'Approved - documents verified with the Grama Niladhari.'
              : item.status === 'rejected'
                ? 'Household income above the limit for this scholarship.'
                : item.status === 'under_review'
                  ? 'Waiting for the income certificate from the divisional secretariat.'
                  : '',
          reviewedBy: item.status === 'pending' ? null : ADMIN.name,
          reviewedAt: item.status === 'pending' ? null : iso(new Date(new Date(item.createdAt).getTime() + DAY)),
        },
      });
    }

    // An approval notification for the already approved application
    const approvedStudent = students[0];
    const approvedApplications = await applicationRepo.listForUser(approvedStudent._id);
    if (approvedApplications.length) {
      const application = approvedApplications[0];
      const scholarship = allScholarships.find((item) => item._id === application.scholarshipId);
      const rendered = templates.applicationStatus({
        user: approvedStudent,
        application,
        scholarship,
        status: 'approved',
        adminNote: 'Approved - documents verified with the Grama Niladhari.',
      });
      await emailRepo.create({ to: approvedStudent.email, subject: rendered.subject, html: rendered.html, template: rendered.template, transport: 'outbox' });
      await notificationRepo.create({
        userId: approvedStudent._id,
        title: `Congratulations! Application ${application.applicationNo} approved`,
        message: 'Your scholarship application has been approved. Our team will contact you about the disbursement schedule.',
        type: 'success',
        link: `/dashboard/applications/${application._id}`,
      });
    }
    applicationCount = plan.length;
  }

  let volunteerCount = await collection('volunteers').count({});
  if (volunteerCount === 0) {
    const upcoming = allEvents.filter((event) => event.status === 'upcoming');
    const plan = [
      { student: students[0], event: upcoming[0], role: 'Registration Desk', status: 'approved', availability: 'Full day' },
      { student: students[1], event: upcoming[0], role: 'Subject Tutor', status: 'approved', availability: 'Morning (8am - 12pm)' },
      { student: students[2], event: upcoming[1] || upcoming[0], role: 'Logistics & Setup', status: 'pending', availability: 'Full day' },
      { student: students[4], event: upcoming[1] || upcoming[0], role: 'Photography / Media', status: 'pending', availability: 'Evening (5pm - 8pm)' },
      { student: students[3], event: upcoming[2] || upcoming[0], role: 'Student Mentor', status: 'rejected', availability: 'Weekends only' },
    ];

    for (const [index, item] of plan.entries()) {
      if (!item.student || !item.event) continue;
      const registration = await volunteerRepo.create({
        userId: item.student._id,
        eventId: item.event._id,
        eventTitle: item.event.title,
        registrationNo: `VOL-${new Date().getFullYear()}-${String(1100 + index).padStart(5, '0')}`,
        fullName: item.student.name,
        email: item.student.email,
        phone: item.student.phone,
        nic: item.student.nic,
        district: item.student.district,
        occupation: 'University undergraduate',
        role: item.role,
        availability: item.availability,
        experience: 'Volunteered at the last paper class and helped with registration and student guidance.',
        motivation: 'I want to give back to students who are in the same situation I was in before I received support from this foundation.',
        emergencyName: 'Mr. Perera',
        emergencyPhone: '+94771234567',
        emergencyRelationship: 'Parent',
        declaration: true,
        status: item.status,
        admin:
          item.status === 'pending'
            ? { note: '', reviewedBy: null, reviewedAt: null }
            : { note: item.status === 'approved' ? 'Confirmed - reporting at 7:45am for the briefing.' : 'Enough volunteers confirmed for this slot.', reviewedBy: ADMIN.name, reviewedAt: nowIso() },
      });

      if (item.status !== 'pending') {
        const rendered = templates.volunteerStatus({
          user: item.student,
          volunteer: registration,
          event: item.event,
          status: item.status,
          adminNote: registration.admin.note,
        });
        await emailRepo.create({ to: item.student.email, subject: rendered.subject, html: rendered.html, template: rendered.template, transport: 'outbox' });
      }
    }
    volunteerCount = plan.length;
  }

  // A sample email so the outbox is never empty on a fresh install
  if ((await emailRepo.count()) === 0 && students[0]) {
    const rendered = templates.welcome({ user: students[0] });
    await emailRepo.create({ to: students[0].email, subject: rendered.subject, html: rendered.html, template: rendered.template, transport: 'outbox' });
  }

  await collection('counters').updateById('applications', {}).catch(() => null);

  return {
    createdUsers: users === 0 ? STUDENTS.length + 1 : 0,
    admin,
    scholarships: scholarshipCount,
    events: eventCount,
    applications: applicationCount,
    volunteers: volunteerCount,
    scholarshipsList: allScholarships,
    eventsList: allEvents,
    students,
    users,
  };
}

/** Wipe every collection (used by `npm run seed:reset`). */
async function resetData() {
  const names = ['users', 'scholarships', 'events', 'applications', 'volunteers', 'notifications', 'emails', 'counters'];
  for (const name of names) await collection(name).deleteMany({});
  console.log('[seed] All collections cleared');
}

async function run() {
  await initDatabase();
  const reset = process.argv.includes('--reset');
  const info = databaseInfo();
  console.log(`[seed] Database: ${info.kind} (${info.mode})`);

  if (reset) await resetData();
  const result = await ensureSeedData();

  console.log('');
  console.log('  Seed complete');
  console.log('  ─────────────────────────────────────────────');
  console.log(`  Admin login    : ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`  Student login  : ${STUDENTS[0].email} / ${STUDENTS[0].password}`);
  console.log(`  Other students : ${STUDENTS.slice(1).map((s) => s.email).join(', ')}`);
  console.log(`  Scholarships   : ${result.scholarships}`);
  console.log(`  Events         : ${result.events}`);
  console.log(`  Applications   : ${result.applications}`);
  console.log(`  Volunteers     : ${result.volunteers}`);
  console.log('');
  console.log('  Board members and staff who need their own accounts can be created at');
  console.log('  Admin > Accounts, or by re-running this script after editing ADMIN above.');
  console.log('');
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('[seed] Failed:', error);
      process.exit(1);
    });
}

module.exports = { ensureSeedData, resetData, run, ADMIN, STUDENTS };
