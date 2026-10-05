'use strict';
/** In-app notification + email orchestration. */
const notificationRepo = require('../repos/notifications');
const mailer = require('./mailer');

async function pushNotification({ userId, title, message, type = 'info', link = '', meta = {} }) {
  if (!userId) return null;
  return notificationRepo.create({ userId, title, message, type, link, meta });
}

async function emailUser({ to, rendered }) {
  if (!to || !rendered) return null;
  return mailer.sendMail({ to, subject: rendered.subject, html: rendered.html, template: rendered.template });
}

/**
 * Create the in-app notification and send the email for it.
 * `rendered` is the object returned by one of the emailTemplates helpers.
 */
async function notifyAndEmail({ user, title, message, type = 'info', link = '', rendered, meta = {} }) {
  const notification = user ? await pushNotification({ userId: user._id, title, message, type, link, meta }) : null;
  let email = null;
  if (user && rendered) {
    email = await emailUser({ to: user.email, rendered });
  }
  return { notification, email };
}

/** Send the same message to many students (used for event / scholarship broadcasts). */
async function broadcast({ users, renderedFactory, title, message, type = 'info', link = '' }) {
  let sent = 0;
  for (const user of users) {
    const rendered = renderedFactory(user);
    await notifyAndEmail({ user, title, message, type, link, rendered, meta: { broadcast: true } });
    sent += 1;
  }
  return sent;
}

module.exports = { pushNotification, emailUser, notifyAndEmail, broadcast };
