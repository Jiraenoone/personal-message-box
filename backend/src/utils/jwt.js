import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Generate a JWT token for a user.
 * @param {object} payload - { id, email }
 * @returns {string} JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * Verify and decode a JWT token.
 * @param {string} token
 * @returns {object} Decoded payload
 */
export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}
