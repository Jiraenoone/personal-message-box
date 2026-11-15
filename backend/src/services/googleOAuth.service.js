import { google } from 'googleapis';
import config from '../config/index.js';
import { encrypt, decrypt } from './encryption.service.js';
import logger from '../utils/logger.js';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
];

/**
 * Check if real Google OAuth credentials have been provided
 */
export function isConfigured() {
  const { clientId, clientSecret } = config.google;
  return (
    Boolean(clientId) &&
    Boolean(clientSecret) &&
    clientId !== 'your-google-client-id' &&
    clientSecret !== 'your-google-client-secret'
  );
}

/**
 * Create a new OAuth2 client instance
 */
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );
}

/**
 * Generate Google OAuth 2.0 authorization URL
 * @param {string} state - Random security state to prevent CSRF
 * @returns {string} URL to redirect user to Google consent screen
 */
export function getAuthUrl(state) {
  if (!isConfigured()) {
    return null;
  }

  const oauth2Client = createOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Always prompt to ensure we get a refresh token
    scope: SCOPES,
    state,
    include_granted_scopes: true,
  });
}

/**
 * Exchange authorization code for tokens
 * @param {string} code - Auth code received from callback
 * @returns {Promise<{ accessToken: string, encryptedRefreshToken: string, googleAccountId: string }>}
 */
export async function getTokensFromCode(code) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    logger.warn('Google did not return a refresh token. User might have previously authorized.');
  }

  oauth2Client.setCredentials(tokens);

  // Fetch user email / googleAccountId
  let googleAccountId = 'google-user';
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    googleAccountId = userInfo.data.email || userInfo.data.id || 'google-user';
  } catch (err) {
    logger.warn('Could not fetch Google userinfo:', err.message);
  }

  const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

  return {
    accessToken: tokens.access_token,
    encryptedRefreshToken,
    googleAccountId,
  };
}

/**
 * Get an authenticated OAuth2Client using stored encrypted refresh token
 * @param {string} encryptedRefreshToken
 * @returns {google.auth.OAuth2}
 */
export function getAuthenticatedClient(encryptedRefreshToken) {
  const oauth2Client = createOAuth2Client();
  const refreshToken = decrypt(encryptedRefreshToken);

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

export default {
  isConfigured,
  createOAuth2Client,
  getAuthUrl,
  getTokensFromCode,
  getAuthenticatedClient,
};
