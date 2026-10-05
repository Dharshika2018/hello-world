'use strict';
const { badRequest } = require('./httpError');

/**
 * Tiny declarative validator.
 * rules = { field: { label, required, type, min, max, match, enum, maxLength } }
 * Returns the sanitised value map; throws HttpError(400, ...) with a per-field
 * `details` map when something is wrong.
 */
function validate(source = {}, rules = {}) {
  const values = {};
  const errors = {};

  for (const [field, rule] of Object.entries(rules)) {
    let value = source[field];
    const label = rule.label || field;

    if (typeof value === 'string') value = value.trim();
    if (value === '' && !rule.required) {
      values[field] = rule.default !== undefined ? rule.default : value;
      continue;
    }

    if (value === undefined || value === null || value === '') {
      if (rule.required) errors[field] = `${label} is required`;
      else if (rule.default !== undefined) values[field] = rule.default;
      continue;
    }

    if (rule.type === 'number') {
      const num = Number(value);
      if (Number.isNaN(num)) {
        errors[field] = `${label} must be a number`;
        continue;
      }
      if (rule.min !== undefined && num < rule.min) {
        errors[field] = `${label} must be at least ${rule.min}`;
        continue;
      }
      if (rule.max !== undefined && num > rule.max) {
        errors[field] = `${label} must not exceed ${rule.max}`;
        continue;
      }
      values[field] = num;
      continue;
    }

    if (rule.type === 'array') {
      const list = Array.isArray(value) ? value : [value];
      values[field] = list.filter((item) => item !== undefined && item !== null && item !== '');
      continue;
    }

    if (rule.type === 'email' || rule.email) {
      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRx.test(String(value))) {
        errors[field] = `${label} must be a valid email address`;
        continue;
      }
      values[field] = String(value).toLowerCase();
      continue;
    }

    if (typeof value !== 'string') {
      values[field] = value;
      continue;
    }

    if (rule.enum && !rule.enum.includes(value)) {
      errors[field] = `${label} must be one of: ${rule.enum.join(', ')}`;
      continue;
    }
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `${label} must be at least ${rule.minLength} characters`;
      continue;
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${label} must be at most ${rule.maxLength} characters`;
      continue;
    }
    if (rule.match && !rule.match.test(value)) {
      errors[field] = rule.message || `${label} is not in the expected format`;
      continue;
    }

    values[field] = value;
  }

  if (Object.keys(errors).length) {
    throw badRequest('Please correct the highlighted fields', errors);
  }
  return values;
}

const patterns = {
  /** Sri Lankan NIC: 9 digits + V/X (old) or 12 digits (new) */
  nic: /^([0-9]{9}[vVxX]|[0-9]{12})$/,
  /** Sri Lankan phone: +94XXXXXXXXX or 0XXXXXXXXX */
  phone: /^(\+94[0-9]{9}|0[0-9]{9})$/,
};

/** Normalise a phone number to +94XXXXXXXXX when possible. */
function normalisePhone(value) {
  if (!value) return value;
  const digits = String(value).replace(/[^\d+]/g, '');
  if (digits.startsWith('+94')) return digits;
  if (digits.startsWith('94') && digits.length === 11) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+94${digits.slice(1)}`;
  return digits;
}

module.exports = { validate, patterns, normalisePhone };
