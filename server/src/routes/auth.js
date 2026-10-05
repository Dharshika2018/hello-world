'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const config = require('../config');
const userRepo = require('../repos/users');
const { signToken } = require('../services/auth');
const { validate, patterns, normalisePhone } = require('../utils/validate');
const { asyncHandler, badRequest, conflict, unauthorized, notFound } = require('../utils/httpError');
const { requireAuth } = require('../middleware/auth');
const { templates } = require('../services/emailTemplates');
const notify = require('../services/notify');

const router = express.Router();

const registerRules = {
  name: { required: true, label: 'Full name', minLength: 3, maxLength: 120 },
  email: { required: true, type: 'email', label: 'Email' },
  password: { required: true, label: 'Password', minLength: 6, maxLength: 72 },
  phone: { required: true, label: 'Phone number', match: patterns.phone, message: 'Use a valid Sri Lankan number, e.g. 0771234567' },
  nic: { required: true, label: 'NIC number', match: patterns.nic, message: 'Use 9 digits + V/X or the 12 digit NIC number' },
  district: { required: true, label: 'District' },
  role: { enum: ['student'], default: 'student', label: 'Account type' },
};

/** POST /api/auth/register - student self sign-up */
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const data = validate(req.body, registerRules);
    const existing = await userRepo.findByEmail(data.email);
    if (existing) throw conflict('An account with this email already exists. Please sign in instead.');

    const user = await userRepo.createUser({
      ...data,
      phone: normalisePhone(data.phone),
      passwordHash: await bcrypt.hash(data.password, 10),
      role: 'student',
    });

    const rendered = templates.welcome({ user });
    await notify.notifyAndEmail({
      user,
      title: 'Welcome to the scholarship portal',
      message: 'Your account is ready. Start your scholarship application or sign up as an event volunteer.',
      type: 'success',
      link: '/dashboard',
      rendered,
    });

    res.status(201).json({ token: signToken(user), user: userRepo.publicUser(user) });
  })
);

/** POST /api/auth/login - shared by students and admins (role returned in the response) */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = validate(req.body, {
      email: { required: true, type: 'email', label: 'Email' },
      password: { required: true, label: 'Password' },
    });

    const user = await userRepo.findByEmail(email);
    const hash = user?.passwordHash || '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
    const ok = await bcrypt.compare(password, hash);
    if (!user || !ok) throw unauthorized('Incorrect email or password');
    if (user.status !== 'active') throw unauthorized('This account has been deactivated. Please contact the administrator.');

    await userRepo.updateUser(user._id, { lastLoginAt: new Date().toISOString() });

    res.json({ token: signToken(user), user: userRepo.publicUser(user) });
  })
);

/** GET /api/auth/me */
router.get(
  '/me',
  requireAuth(),
  asyncHandler(async (req, res) => {
    res.json({ user: userRepo.publicUser(req.user) });
  })
);

/** PATCH /api/auth/me - update own profile */
router.patch(
  '/me',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const data = validate(req.body, {
      name: { label: 'Full name', minLength: 3, maxLength: 120 },
      phone: { label: 'Phone number', match: patterns.phone, message: 'Use a valid Sri Lankan number' },
      district: { label: 'District' },
      address: { label: 'Address', maxLength: 240 },
      nic: { label: 'NIC number', match: patterns.nic, message: 'Use 9 digits + V/X or the 12 digit NIC' },
    });
    if (!Object.keys(data).length) throw badRequest('Nothing to update');
    if (data.phone) data.phone = normalisePhone(data.phone);

    const updated = await userRepo.updateUser(req.user._id, data);
    res.json({ user: userRepo.publicUser(updated) });
  })
);

/** POST /api/auth/change-password */
router.post(
  '/change-password',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = validate(req.body, {
      currentPassword: { required: true, label: 'Current password' },
      newPassword: { required: true, label: 'New password', minLength: 6, maxLength: 72 },
    });

    const ok = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!ok) throw badRequest('Your current password is incorrect', { currentPassword: 'Incorrect password' });

    await userRepo.updateUser(req.user._id, { passwordHash: await bcrypt.hash(newPassword, 10) });
    res.json({ message: 'Password updated successfully' });
  })
);

/** POST /api/auth/staff - admin creates another admin account */
router.post(
  '/staff',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const data = validate(req.body, {
      name: { required: true, label: 'Full name', minLength: 3 },
      email: { required: true, type: 'email', label: 'Email' },
      password: { required: true, label: 'Password', minLength: 6 },
      role: { enum: ['admin', 'student'], default: 'admin', label: 'Role' },
      phone: { label: 'Phone' },
    });
    const existing = await userRepo.findByEmail(data.email);
    if (existing) throw conflict('An account with this email already exists');

    const user = await userRepo.createUser({
      ...data,
      phone: data.phone ? normalisePhone(data.phone) : '',
      passwordHash: await bcrypt.hash(data.password, 10),
    });
    res.status(201).json({ user: userRepo.publicUser(user) });
  })
);

/** GET /api/auth/demo-accounts - convenience for testers (never exposes real passwords) */
router.get('/demo-accounts', (req, res) => {
  res.json({
    accounts: [
      { role: 'admin', label: 'Administrator', email: config.seed.adminEmail, password: config.seed.adminPassword },
      { role: 'student', label: 'Student / Volunteer', email: config.seed.studentEmail, password: config.seed.studentPassword },
    ],
    notice: 'Demo credentials created by the seed script. Remove them from server/.env before going live.',
  });
});

/** GET /api/auth/users/:id - admin helper */
router.get(
  '/users/:id',
  requireAuth('admin'),
  asyncHandler(async (req, res) => {
    const user = await userRepo.findById(req.params.id);
    if (!user) throw notFound('User not found');
    res.json({ user: userRepo.publicUser(user) });
  })
);

module.exports = router;
