import crypto from 'crypto';
import config from '../config/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits auth tag

/**
 * Derives a 32-byte key from config.encryption.key using SHA-256
 */
function getDerivedKey() {
  const secret = config.encryption.key || 'personal-message-box-default-encryption-key-32b';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt plain text using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} iv:authTag:encryptedText (hex format)
 */
export function encrypt(text) {
  if (!text) return '';

  const key = getDerivedKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt cipher text using AES-256-GCM
 * @param {string} encryptedData - iv:authTag:encryptedText (hex format)
 * @returns {string} Decrypted plain text
 */
export function decrypt(encryptedData) {
  if (!encryptedData) return '';

  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const [ivHex, authTagHex, cipherTextHex] = parts;
  const key = getDerivedKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherTextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export default {
  encrypt,
  decrypt,
};
