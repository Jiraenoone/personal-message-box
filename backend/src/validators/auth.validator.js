import { ValidationError } from '../utils/errors.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate registration request body.
 */
export function validateRegister(body) {
  const errors = [];
  const { email, password, displayName } = body;

  if (!email || typeof email !== 'string') {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  } else if (email.length > 255) {
    errors.push({ field: 'email', message: 'Email must be less than 255 characters' });
  }

  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
  } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one letter and one number' });
  } else if (password.length > 100) {
    errors.push({ field: 'password', message: 'Password must be less than 100 characters' });
  }

  if (!displayName || typeof displayName !== 'string') {
    errors.push({ field: 'displayName', message: 'Display name is required' });
  } else if (displayName.trim().length === 0) {
    errors.push({ field: 'displayName', message: 'Display name cannot be empty' });
  } else if (displayName.trim().length > 100) {
    errors.push({ field: 'displayName', message: 'Display name must be at most 100 characters' });
  }

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  return {
    email: email.trim().toLowerCase(),
    password,
    displayName: displayName.trim(),
  };
}

/**
 * Validate login request body.
 */
export function validateLogin(body) {
  const errors = [];
  const { email, password } = body;

  if (!email || typeof email !== 'string') {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  return {
    email: email.trim().toLowerCase(),
    password,
  };
}
