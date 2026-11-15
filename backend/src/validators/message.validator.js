import { ValidationError } from '../utils/errors.js';

export const MAX_SENDER_NAME = 100;
export const MAX_CONTENT = 5000;

// Strip ASCII control chars (keep \n and \t in message body)
const stripControl = (s, keepNewlines) =>
  keepNewlines ? s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') : s.replace(/[\u0000-\u001F\u007F]/g, '');

/**
 * Validate public message submission.
 * Text is stored as plain text; the frontend renders it via React (auto-escaped), never as HTML.
 * @param {object} body - multipart text fields
 * @param {number} fileCount - number of attached files
 */
export function validateSubmitMessage(body = {}, fileCount = 0) {
  const errors = [];
  const rawName = typeof body.senderName === 'string' ? body.senderName : '';
  const rawContent = typeof body.content === 'string' ? body.content : '';

  const senderName = stripControl(rawName, false).trim();
  const content = stripControl(rawContent, true).trim();

  if (!senderName) {
    errors.push({ field: 'senderName', message: 'Sender name is required' });
  } else if (senderName.length > MAX_SENDER_NAME) {
    errors.push({ field: 'senderName', message: `Sender name must be ${MAX_SENDER_NAME} characters or less` });
  }

  if (content.length > MAX_CONTENT) {
    errors.push({ field: 'content', message: `Message must be ${MAX_CONTENT} characters or less` });
  }

  if (!content && fileCount === 0) {
    errors.push({ field: 'content', message: 'Please write a message or attach at least one file' });
  }

  if (errors.length) {
    throw new ValidationError('Validation failed', errors);
  }

  return { senderName, content: content || null };
}

export default { validateSubmitMessage };
