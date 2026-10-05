'use strict';
/** Role based access control. */
const { verifyToken } = require('../services/auth');
const userRepo = require('../repos/users');
const { unauthorized, forbidden, asyncHandler } = require('../utils/httpError');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw unauthorized('Please sign in to continue');

  let payload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    throw unauthorized('Your session has expired. Please sign in again.');
  }

  const user = await userRepo.findById(payload.sub);
  if (!user) throw unauthorized('Your account could not be found. Please sign in again.');
  if (user.status !== 'active') throw forbidden('This account has been deactivated. Please contact the administrator.');

  req.user = user;
  return next();
});

function requireAuth(...roles) {
  return asyncHandler(async (req, res, next) => {
    await authenticate(req, res, async (error) => {
      if (error) return next(error);
      if (roles.length && !roles.includes(req.user.role)) {
        return next(forbidden('This area is restricted to ' + roles.join(' / ') + ' accounts'));
      }
      return next();
    });
  });
}

/** Attaches req.user when a valid token is present, but never rejects the request. */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    const user = await userRepo.findById(payload.sub);
    if (user && user.status === 'active') req.user = user;
  } catch (error) {
    /* ignore invalid token for public endpoints */
  }
  return next();
});

module.exports = { requireAuth, authenticate, optionalAuth };
