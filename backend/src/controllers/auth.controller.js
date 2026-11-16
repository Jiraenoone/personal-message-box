import config from '../config/index.js';
import prisma from '../utils/prisma.js';
import logger from '../utils/logger.js';
import * as authService from '../services/auth.service.js';
import * as googleOAuth from '../services/googleOAuth.service.js';
import * as googleDrive from '../services/googleDrive.service.js';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';
import { sendSuccess } from '../utils/response.js';

const MOCK_TOKEN = 'mock-encrypted-refresh-token';

const cookieOptions = {
  httpOnly: config.cookie.httpOnly,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  maxAge: config.cookie.maxAge,
  path: config.cookie.path,
};

/**
 * Register new user
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const validatedData = validateRegister(req.body);
    const { user, token } = await authService.register(validatedData);

    // Set JWT in httpOnly cookie
    res.cookie(config.cookie.name, token, cookieOptions);

    return sendSuccess(res, { user }, 'Account registered successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Log in existing user
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const validatedData = validateLogin(req.body);
    const { user, token } = await authService.login(validatedData);

    // Set JWT in httpOnly cookie
    res.cookie(config.cookie.name, token, cookieOptions);

    return sendSuccess(res, { user }, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Log out user
 * POST /api/auth/logout
 */
export async function logout(req, res, next) {
  try {
    res.clearCookie(config.cookie.name, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      path: config.cookie.path,
    });

    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const user = await authService.getUserById(req.user.id);
    return sendSuccess(res, { user }, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Start "Sign in with Google" (also used to sign up).
 * GET /api/auth/google[?consent=1]
 */
export function googleStart(req, res) {
  if (!googleOAuth.isConfigured()) {
    return res.redirect(`${config.frontendUrl}/login?error=google_not_configured`);
  }
  const forceConsent = req.query.consent === '1';
  const state = googleOAuth.createState({ mode: 'login', forceConsent });
  return res.redirect(googleOAuth.getSignInUrl(state, { forceConsent }));
}

/**
 * Save the Drive connection obtained during Google sign-in.
 * Never replaces an active connection to a DIFFERENT Google account — files already
 * stored there would become unreachable. (The owner can switch on the Google Drive page.)
 * @returns {Promise<'saved'|'kept_existing'|'needs_consent'>}
 */
async function saveDriveFromSignIn(userId, googleEmail, encryptedRefreshToken) {
  const existing = await prisma.googleDriveConnection.findUnique({ where: { userId } });
  const existingReal = existing?.status === 'ACTIVE' && existing.encryptedRefreshToken !== MOCK_TOKEN;

  if (existingReal && existing.googleAccountId !== googleEmail) return 'kept_existing';
  if (!encryptedRefreshToken) {
    // Google only issues a refresh token on first consent; reuse the one we have
    return existingReal ? 'kept_existing' : 'needs_consent';
  }

  const authClient = googleOAuth.getAuthenticatedClient(encryptedRefreshToken);
  const rootFolderId = await googleDrive.getOrCreateRootFolder(authClient);
  await prisma.googleDriveConnection.upsert({
    where: { userId },
    create: { userId, googleAccountId: googleEmail, encryptedRefreshToken, rootFolderId, status: 'ACTIVE' },
    update: { googleAccountId: googleEmail, encryptedRefreshToken, rootFolderId, status: 'ACTIVE' },
  });
  return 'saved';
}

/**
 * Finish "Sign in with Google". Called from the shared OAuth callback
 * (/api/google-drive/callback) when the state's mode is 'login'.
 */
export async function handleGoogleSignInCallback(req, res, code, stateData) {
  const fail = (reason) => res.redirect(`${config.frontendUrl}/login?error=${reason}`);
  try {
    const { profile, scopes, encryptedRefreshToken } = await googleOAuth.exchangeSignInCode(code);
    const { user, token, created } = await authService.signInWithGoogle(profile);

    // Signed in from here on, even if the Drive part below needs another step
    res.cookie(config.cookie.name, token, cookieOptions);
    logger.info(`Google sign-in ${created ? '(new account)' : ''} for user ${user.id}`);

    if (!scopes.has(googleOAuth.DRIVE_FILE_SCOPE)) {
      // User unticked the Drive permission on Google's consent screen
      return res.redirect(`${config.frontendUrl}/google-drive?error=drive_scope_missing`);
    }

    const drive = await saveDriveFromSignIn(user.id, profile.email, encryptedRefreshToken);
    if (drive === 'needs_consent') {
      // Ask Google once more with prompt=consent so it issues a refresh token (only once, no loop)
      if (!stateData.forceConsent) return res.redirect(`${config.backendUrl}/api/auth/google?consent=1`);
      return res.redirect(`${config.frontendUrl}/google-drive?error=no_refresh_token`);
    }

    return res.redirect(`${config.frontendUrl}/dashboard`);
  } catch (err) {
    logger.warn('Google sign-in failed', { error: err.message });
    if (/not verified/i.test(err.message)) return fail('email_not_verified');
    if (/different Google account/i.test(err.message)) return fail('google_account_conflict');
    return fail('google_failed');
  }
}
