'use strict';
/** Branded HTML email templates for every system notification. */
const config = require('../config');
const T = require('../config/theme');

const { org } = config;

function layout({ heading, intro, body = '', ctaLabel, ctaUrl, footerNote }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:${T.surfaceAlt};font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${T.ink};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:${T.surface};border-radius:16px;overflow:hidden;border:1px solid ${T.border};">
      <tr>
        <td style="background:linear-gradient(135deg,${T.brandDark},${T.brand});padding:26px 32px;">
          <div style="font-size:20px;font-weight:700;color:#fff;letter-spacing:.3px;">${org.name}</div>
          <div style="font-size:13px;color:rgba(255,255,255,.78);margin-top:4px;">${org.tagline}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:${T.brandDark};">${heading}</h1>
          ${intro ? `<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${T.muted};">${intro}</p>` : ''}
          ${body}
          ${
            ctaLabel && ctaUrl
              ? `<p style="margin:28px 0 8px;"><a href="${ctaUrl}" style="background:${T.brand};color:#fff;text-decoration:none;padding:13px 24px;border-radius:10px;font-weight:600;font-size:15px;display:inline-block;">${ctaLabel}</a></p>`
              : ''
          }
        </td>
      </tr>
      <tr>
        <td style="padding:22px 32px;background:${T.surfaceAlt};border-top:1px solid ${T.border};font-size:12.5px;color:${T.muted};line-height:1.7;">
          ${footerNote ? `<p style="margin:0 0 10px;">${footerNote}</p>` : ''}
          <p style="margin:0;">${org.name} &middot; ${org.address}</p>
          <p style="margin:4px 0 0;">${org.email} &middot; ${org.phone}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function infoTable(rows) {
  const body = rows
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(
      ([label, value]) =>
        `<tr><td style="padding:7px 0;font-size:14px;color:${T.muted};width:44%;">${label}</td><td style="padding:7px 0;font-size:14px;font-weight:600;color:${T.ink};">${value}</td></tr>`
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${T.surfaceAlt};border:1px solid ${T.border};border-radius:12px;padding:14px 18px;margin:6px 0 4px;">${body}</table>`;
}

function statusPill(status, label) {
  const tones = {
    approved: [T.success, '#ECFDF3'],
    rejected: [T.danger, '#FEF2F2'],
    under_review: [T.warning, '#FFFBEB'],
    pending: [T.muted, T.surfaceAlt],
  };
  const [color, bg] = tones[status] || tones.pending;
  return `<p style="margin:18px 0 4px;"><span style="display:inline-block;padding:6px 14px;border-radius:999px;background:${bg};color:${color};font-size:13px;font-weight:700;letter-spacing:.3px;">${label}</span></p>`;
}

const clientLink = (path = '') => `${config.clientUrl}${path}`;

const templates = {
  welcome({ user }) {
    return {
      template: 'welcome',
      subject: `Welcome to ${org.name}`,
      html: layout({
        heading: `Welcome aboard, ${user.name.split(' ')[0]}!`,
        intro: `Your ${org.name} account has been created successfully. You can now apply for scholarships, register as a volunteer for our events and track every update from your dashboard.`,
        body: infoTable([
          ['Registered email', user.email],
          ['Account type', user.role === 'admin' ? 'Administrator' : 'Student / Volunteer'],
        ]),
        ctaLabel: 'Open my dashboard',
        ctaUrl: clientLink(user.role === 'admin' ? '/admin' : '/dashboard'),
        footerNote: 'If you did not create this account, please contact our team immediately.',
      }),
    };
  },

  applicationReceived({ user, application, scholarship }) {
    return {
      template: 'application-received',
      subject: `Application ${application.applicationNo} received - ${scholarship?.title || 'Scholarship'}`,
      html: layout({
        heading: 'We have received your scholarship application',
        intro: `Thank you, ${application.personal?.fullName || user.name}. Our team will verify your details and get back to you by email. You can follow the progress from your dashboard at any time.`,
        body:
          infoTable([
            ['Application no.', application.applicationNo],
            ['Scholarship', scholarship?.title],
            ['Award type', application.applicantType === 'school' ? 'School student' : 'University student'],
            ['Submitted on', new Date(application.createdAt).toLocaleString('en-GB')],
            ['Status', 'Pending review'],
          ]) + statusPill('pending', 'PENDING REVIEW'),
        ctaLabel: 'Track my application',
        ctaUrl: clientLink('/dashboard/applications'),
      }),
    };
  },

  applicationStatus({ user, application, scholarship, status, adminNote, isResubmission }) {
    const copy = {
      under_review: {
        subject: `Application ${application.applicationNo} is under review`,
        heading: 'Your application is being reviewed',
        intro: 'Our verification team has started reviewing your application. No action is needed from you right now.',
      },
      approved: {
        subject: `Congratulations! Application ${application.applicationNo} approved`,
        heading: 'Your scholarship has been approved',
        intro: `Great news! Your application has been approved by our scholarship committee. ${
          scholarship?.awardDetails?.amount
            ? `The approved award is <strong>${scholarship.awardDetails.amount}</strong>${scholarship.awardDetails.frequency ? ` (${scholarship.awardDetails.frequency})` : ''}.`
            : ''
        } Our team will contact you shortly with the next steps.`,
      },
      rejected: {
        subject: `Update on application ${application.applicationNo}`,
        heading: 'Decision on your scholarship application',
        intro:
          'Thank you for applying. After careful review, we are unable to offer you this scholarship at this time. We genuinely appreciate the effort you put into your application.',
      },
    }[status];

    const resolved = copy || {
      subject: `Update on application ${application.applicationNo}`,
      heading: `Application status updated`,
      intro: `The status of your application is now: ${status}.`,
    };

    return {
      template: `application-${status}`,
      subject: resolved.subject,
      html: layout({
        heading: resolved.heading,
        intro: resolved.intro,
        body:
          infoTable([
            ['Application no.', application.applicationNo],
            ['Scholarship', scholarship?.title],
            ['Applicant', application.personal?.fullName || user.name],
            ['Reviewed on', new Date().toLocaleString('en-GB')],
            ...(adminNote ? [['Note from our team', adminNote]] : []),
          ]) +
          statusPill(status, String(status).replace('_', ' ').toUpperCase()) +
          (status === 'approved'
            ? `<p style="margin:15px 0 0;font-size:13.5px;color:${T.muted};line-height:1.6;">Keep this email - you will need your application number <strong>${application.applicationNo}</strong> when you contact us about the award.</p>`
            : '') +
          (isResubmission
            ? `<p style="margin:15px 0 0;font-size:13.5px;color:${T.muted};">This is an updated decision for your application.</p>`
            : ''),
        ctaLabel: 'View application',
        ctaUrl: clientLink('/dashboard/applications'),
        footerNote:
          status === 'rejected'
            ? 'You are welcome to apply again for future intakes or contact us for guidance on other programmes.'
            : undefined,
      }),
    };
  },

  volunteerRegistered({ user, volunteer, event }) {
    return {
      template: 'volunteer-registered',
      subject: `Volunteer registration received - ${event?.title || 'Event'}`,
      html: layout({
        heading: 'Thank you for volunteering!',
        intro: `Hi ${volunteer.fullName || user.name}, we have received your volunteer registration. Our coordinators will verify your details and confirm your participation by email.`,
        body: infoTable([
          ['Event', event?.title],
          ['Event date', event?.date],
          ['Venue', event?.venue || event?.location],
          ['Preferred role', volunteer.role],
          ['Availability', volunteer.availability],
          ['Registration no.', volunteer.registrationNo],
        ]) + statusPill('pending', 'AWAITING CONFIRMATION'),
        ctaLabel: 'See my volunteer records',
        ctaUrl: clientLink('/dashboard/volunteering'),
      }),
    };
  },

  volunteerStatus({ user, volunteer, event, status, adminNote }) {
    const approved = status === 'approved';
    return {
      template: `volunteer-${status}`,
      subject: approved
        ? `You are confirmed as a volunteer for ${event?.title || 'our event'}`
        : `Volunteer registration update - ${event?.title || 'Event'}`,
      html: layout({
        heading: approved ? 'Your volunteer slot is confirmed' : 'Volunteer registration update',
        intro: approved
          ? `We are delighted to have you on the team, ${volunteer.fullName || user.name}. Please arrive 30 minutes early for the briefing and bring your NIC.`
          : `Thank you for offering to volunteer for ${event?.title || 'this event'}. Unfortunately all slots for your selected role are filled for this session - we would love to have you at our next event.`,
        body:
          infoTable([
            ['Event', event?.title],
            ['Date', event?.date],
            ['Venue', event?.venue || event?.location],
            ['Role', volunteer.role],
            ...(adminNote ? [['Note from coordinator', adminNote]] : []),
          ]) + statusPill(status, approved ? 'CONFIRMED' : 'NOT CONFIRMED'),
        ctaLabel: 'View my events',
        ctaUrl: clientLink('/events'),
      }),
    };
  },

  broadcast({ subject, message, ctaLabel, ctaUrl, recipientName }) {
    return {
      template: 'broadcast',
      subject,
      html: layout({
        heading: subject,
        intro: recipientName ? `Dear ${recipientName},` : undefined,
        body: `<p style="margin:0;font-size:15px;line-height:1.7;color:${T.ink};">${String(message).replace(/\n/g, '<br/>')}</p>`,
        ctaLabel,
        ctaUrl,
      }),
    };
  },
};

module.exports = { templates, layout, infoTable };
