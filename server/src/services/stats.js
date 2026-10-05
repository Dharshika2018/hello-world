'use strict';
const applicationRepo = require('../repos/applications');
const volunteerRepo = require('../repos/volunteers');
const userRepo = require('../repos/users');
const eventRepo = require('../repos/events');
const scholarshipRepo = require('../repos/scholarships');
const notificationRepo = require('../repos/notifications');
const emailRepo = require('../repos/emails');
const { APPLICATION_STATUS_META, APPLICATION_STATUS } = require('../models/constants');

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

function monthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Everything the admin dashboard needs in a single round trip. */
async function adminDashboard() {
  const today = todayIsoDate();
  const startOfToday = `${today}T00:00:00.000Z`;
  const endOfToday = new Date(`${today}T00:00:00.000Z`);
  endOfToday.setUTCDate(endOfToday.getUTCDate() + 1);

  const [
    totalApplications,
    pending,
    underReview,
    approved,
    rejected,
    applicationsToday,
    todayList,
    pendingVolunteers,
    totalVolunteers,
    upcomingEvents,
    totalScholarships,
    openScholarships,
    totalStudents,
    emailsSent,
  ] = await Promise.all([
    applicationRepo.countByStatus(''),
    applicationRepo.countByStatus(APPLICATION_STATUS.pending),
    applicationRepo.countByStatus(APPLICATION_STATUS.under_review),
    applicationRepo.countByStatus(APPLICATION_STATUS.approved),
    applicationRepo.countByStatus(APPLICATION_STATUS.rejected),
    applicationRepo.countBetween(startOfToday, endOfToday.toISOString()),
    applicationRepo.listSubmittedOn(today, 50),
    volunteerRepo.countByStatus('pending'),
    volunteerRepo.countByStatus(''),
    eventRepo.countUpcoming(),
    scholarshipRepo.list({ limit: 1 }).then((r) => r.total),
    scholarshipRepo.list({ status: 'open', limit: 1 }).then((r) => r.total),
    userRepo.listUsers({ role: 'student', limit: 1 }).then((r) => r.total),
    emailRepo.count(),
  ]);

  // 6 month submission trend
  const trend = [];
  const now = new Date();
  for (let index = 5; index >= 0; index -= 1) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    // eslint-disable-next-line no-await-in-loop
    const count = await applicationRepo.countBetween(start.toISOString(), end.toISOString());
    trend.push({
      label: start.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' }),
      key: monthKey(start),
      count,
    });
  }

  const allUpcoming = await eventRepo.list({ scope: 'upcoming', limit: 5 });
  const recentApplications = await applicationRepo.list({ limit: 6 });

  return {
    totals: {
      applications: totalApplications,
      pending,
      underReview,
      approved,
      rejected,
      applicationsToday,
      pendingVolunteers,
      totalVolunteers,
      upcomingEvents,
      totalScholarships,
      openScholarships,
      totalStudents,
      emailsSent,
    },
    statusBreakdown: Object.entries(APPLICATION_STATUS_META).map(([key, meta]) => ({
      key,
      label: meta.label,
      tone: meta.tone,
      value: { pending, under_review: underReview, approved, rejected }[key] || 0,
    })),
    trend,
    todayApplications: todayList,
    upcomingEventsPreview: allUpcoming.items,
    recentApplications: recentApplications.items,
  };
}

/** Everything the student dashboard needs. */
async function studentDashboard(user) {
  const [applications, volunteerRecords, unread, upcoming] = await Promise.all([
    applicationRepo.listForUser(user._id),
    volunteerRepo.listForUser(user._id),
    notificationRepo.unreadCount(user._id),
    eventRepo.list({ scope: 'upcoming', limit: 4 }),
  ]);

  const counts = { total: applications.length, pending: 0, under_review: 0, approved: 0, rejected: 0 };
  applications.forEach((application) => {
    counts[application.status] = (counts[application.status] || 0) + 1;
  });

  return {
    counts,
    applications: applications.slice(0, 5),
    volunteerRecords: volunteerRecords.slice(0, 5),
    volunteerCounts: {
      total: volunteerRecords.length,
      pending: volunteerRecords.filter((item) => item.status === 'pending').length,
      approved: volunteerRecords.filter((item) => item.status === 'approved').length,
    },
    unreadNotifications: unread,
    upcomingEvents: upcoming.items,
  };
}

module.exports = { adminDashboard, studentDashboard, todayIsoDate };
