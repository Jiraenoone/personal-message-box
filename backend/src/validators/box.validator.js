import { ValidationError } from '../utils/errors.js';

/**
 * Validate message box creation input
 */
export function validateCreateBox(body) {
  const errors = [];
  const { title, description } = body;

  if (!title || typeof title !== 'string') {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title cannot be empty' });
  } else if (title.trim().length > 200) {
    errors.push({ field: 'title', message: 'Title must be 200 characters or less' });
  }

  if (description && typeof description === 'string' && description.length > 2000) {
    errors.push({ field: 'description', message: 'Description must be 2000 characters or less' });
  }

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  return {
    title: title.trim(),
    description: description ? description.trim() : null,
  };
}

/**
 * Validate message box update input
 */
export function validateUpdateBox(body) {
  const errors = [];
  const { title, description } = body;

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title cannot be empty' });
    } else if (title.trim().length > 200) {
      errors.push({ field: 'title', message: 'Title must be 200 characters or less' });
    }
  }

  if (description !== undefined && description !== null) {
    if (typeof description === 'string' && description.length > 2000) {
      errors.push({ field: 'description', message: 'Description must be 2000 characters or less' });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  const data = {};
  if (title !== undefined) data.title = title.trim();
  if (description !== undefined) data.description = description ? description.trim() : null;

  return data;
}

/**
 * Validate status update
 */
export function validateUpdateStatus(body) {
  const { status } = body;

  if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
    throw new ValidationError('Invalid status value', [
      { field: 'status', message: 'Status must be either ACTIVE or INACTIVE' },
    ]);
  }

  return status;
}
