/**
 * Validate email format.
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength.
 * Minimum 8 characters, at least one letter and one number.
 */
export function isValidPassword(password) {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

/**
 * Validate sender name.
 */
export function isValidSenderName(name) {
  return name && name.trim().length >= 1 && name.trim().length <= 100;
}

/**
 * Validate file type against allowed types.
 */
export function isAllowedImageType(file) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  return allowed.includes(file.type);
}

export function isAllowedVideoType(file) {
  const allowed = ['video/mp4', 'video/quicktime', 'video/webm'];
  return allowed.includes(file.type);
}

/**
 * Validate file size (in bytes).
 */
export function isWithinSizeLimit(file, maxSizeMB) {
  return file.size <= maxSizeMB * 1024 * 1024;
}
