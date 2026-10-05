'use strict';

/** HTTP error with status code. */
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const badRequest = (msg, details) => new HttpError(400, msg || 'Invalid request', details);
const unauthorized = (msg) => new HttpError(401, msg || 'You must sign in to continue');
const forbidden = (msg) => new HttpError(403, msg || 'You do not have permission to do this');
const notFound = (msg) => new HttpError(404, msg || 'Resource not found');
const conflict = (msg) => new HttpError(409, msg || 'Resource already exists');

/** Wrap async route handlers so rejections reach the error middleware. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict, asyncHandler };
