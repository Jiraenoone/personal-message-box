import rateLimit from 'express-rate-limit';
import config from '../config/index.js';
import { sendError } from '../utils/response.js';

const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      sendError(res, 429, 'RATE_LIMIT_EXCEEDED', message);
    },
  });
};

// General API rate limiter
export const generalLimiter = createLimiter(
  config.rateLimit.windowMs,
  config.rateLimit.maxRequests,
  'Too many requests, please try again later'
);

// Stricter rate limiter for authentication endpoints
export const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  config.rateLimit.authMax,
  'Too many authentication attempts, please try again later'
);

// Rate limiter for public message submission (per IP)
export const publicSubmitLimiter = createLimiter(
  60 * 1000, // 1 minute
  config.rateLimit.publicSubmitMax,
  'Too many submissions, please try again later'
);
