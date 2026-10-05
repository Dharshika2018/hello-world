'use strict';
/**
 * Mail transport.
 *
 * - SMTP configured  -> mail is really delivered (status: sent / failed)
 * - SMTP not set     -> "Email Outbox" mode: the message is stored in the
 *                       database and visible under Admin > Email Outbox.
 *
 * This guarantees the approve/reject notification flow can be demonstrated
 * during testing without any mail account.
 */
const nodemailer = require('nodemailer');
const config = require('../config');
const { nowIso } = require('../utils/ids');
const emailRepo = require('../repos/emails');

let transporter = null;
if (config.smtp.host) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });
}

const mode = () => (transporter ? 'smtp' : 'outbox');

async function sendMail({ to, subject, html, text = '', template = 'generic', meta = {} }) {
  const record = await emailRepo.create({
    to,
    from: config.smtp.from,
    subject,
    html,
    text,
    template,
    meta,
    transport: mode(),
    createdAt: nowIso(),
  });

  if (!transporter) {
    console.log(`[mail:outbox] queued "${subject}" -> ${to}`);
    return record;
  }

  try {
    await transporter.sendMail({ from: config.smtp.from, to, subject, html, text });
    console.log(`[mail:smtp] sent "${subject}" -> ${to}`);
    return emailRepo.update(record._id, { status: 'sent', sentAt: nowIso() });
  } catch (error) {
    console.error(`[mail:smtp] failed "${subject}" -> ${to}: ${error.message}`);
    return emailRepo.update(record._id, { status: 'failed', error: error.message });
  }
}

/** Re-send an email that is stored in the outbox (used by the admin screen). */
async function resend(id) {
  const record = await emailRepo.update(id, {});
  if (!record) return null;
  if (!transporter) return record;
  return sendMail({
    to: record.to,
    subject: record.subject,
    html: record.html,
    template: record.template,
    meta: record.meta,
  });
}

module.exports = { sendMail, resend, mode, isSmtpConfigured: () => Boolean(transporter) };
