import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import config from '../config/index.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // Log the error (but not message content for privacy)
  if (err.isOperational) {
    logger.warn(`Operational error: ${err.message}`, {
      code: err.code,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.error('Unexpected error:', {
      message: err.message,
      stack: config.nodeEnv === 'development' ? err.stack : undefined,
      path: req.path,
      method: req.method,
    });
  }

  // Handle known operational errors
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    return sendError(res, 409, 'CONFLICT', 'A record with this value already exists');
  }
  if (err.code === 'P2025') {
    return sendError(res, 404, 'NOT_FOUND', 'Record not found');
  }
  // Malformed ID (e.g. non-UUID in a URL param) — treat as not found rather than 500
  if (err.code === 'P2023' || /invalid.*uuid/i.test(err.message || '')) {
    return sendError(res, 404, 'NOT_FOUND', 'Resource not found');
  }

  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 400, 'FILE_TOO_LARGE', 'File exceeds the maximum allowed size');
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return sendError(res, 400, 'TOO_MANY_FILES', 'Too many files uploaded');
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return sendError(res, 400, 'UNEXPECTED_FILE', 'Unexpected file field');
  }
  if (err.name === 'MulterError') {
    return sendError(res, 400, 'UPLOAD_ERROR', err.message);
  }

  // Handle JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'INVALID_JSON', 'Invalid JSON in request body');
  }

  // Default to 500 Internal Server Error
  const message = config.nodeEnv === 'development'
    ? err.message
    : 'An unexpected error occurred';

  return sendError(res, 500, 'INTERNAL_ERROR', message);
}

export function notFoundHandler(req, res) {
  sendError(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`);
}
