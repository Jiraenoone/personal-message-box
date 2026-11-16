import crypto from 'crypto';
import { google } from 'googleapis';
import config from '../config/index.js';
import { encrypt, decrypt } from './encryption.service.js';
import logger from '../utils/logger.js';

export const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

// "Connect Google Drive" for an already signed-in user
const SCOPES = [
  DRIVE_FILE_SCOPE,
  'https://www.googleapis.com/auth/userinfo.email',
];

// "Sign in with Google": identity + Drive in one consent, so the account and
// its Drive connection use the same Google account
const SIGN_IN_SCOPES = ['openid', 'email', 'profile', DRIVE_FILE_SCOPE];

// ── OAuth state (CSRF protection), shared by both flows ────────────
// In-memory, single instance; entries expire after 10 minutes.
const STATE_TTL_MS = 10 * 60 * 1000;
const oauthStates = new Map();

/** Create a random state value bound to flow data, e.g. { mode: 'login' } or { mode: 'connect', userId } */
export function createState(data) {
  const now = Date.now();
  for (const [k, v] of oauthStates) if (now - v.createdAt > STATE_TTL_MS) oauthStates.delete(k);
  const state = crypto.randomBytes(32).toString('hex');
  oauthStates.set(state, { ...data, createdAt: now });
  return state;
}

/** Return and delete the data for a state value (single use), or null if unknown/expired */
export function consumeState(state) {
  if (!state || typeof state !== 'string') return null;
  const data = oauthStates.get(state);
  oauthStates.delete(state);
  if (!data || Date.now() - data.createdAt > STATE_TTL_MS) return null;
  return data;
}

/**
 * Authorization URL for "Sign in with Google".
 * prompt=select_account normally; 'consent' when we need Google to re-issue a refresh token.
 */
export function getSignInUrl(state, { forceConsent = false } = {}) {
  return createOAuth2Client().generateAuthUrl({
    access_type: 'offline',
    prompt: forceConsent ? 'consent' : 'select_account',
    scope: SIGN_IN_SCOPES,
    state,
    include_granted_scopes: true,
  });
}

/**
 * Exchange a sign-in code: verifies the ID token and reports which scopes were granted.
 * @returns {Promise<{ profile: { sub, email, emailVerified, name }, scopes: Set<string>, encryptedRefreshToken: string|null }>}
 */
export async function exchangeSignInCode(code) {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) throw new Error('Google did not return an ID token');

  // Verifies signature, issuer, expiry and that the token was issued to OUR client ID
  const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: config.google.clientId });
  const p = ticket.getPayload();

  return {
    profile: {
      sub: p.sub,
      email: (p.email || '').toLowerCase(),
      emailVerified: p.email_verified === true,
      name: p.name || '',
    },
    scopes: new Set((tokens.scope || '').split(' ').filter(Boolean)),
    encryptedRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
  };
}

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
  createState,
  consumeState,
  getSignInUrl,
  exchangeSignInCode,
  getAuthUrl,
  getTokensFromCode,
  getAuthenticatedClient,
};
