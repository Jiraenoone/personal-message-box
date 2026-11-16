import config from '../config/index.js';
import prisma from '../utils/prisma.js';
import * as googleOAuth from '../services/googleOAuth.service.js';
import * as googleDrive from '../services/googleDrive.service.js';
import { sendSuccess } from '../utils/response.js';
import logger from '../utils/logger.js';
import { handleGoogleSignInCallback } from './auth.controller.js';


/**
 * Initiate Google Drive OAuth connection
 * GET /api/google-drive/connect
 */
export async function connect(req, res, next) {
  try {
    const isConfigured = googleOAuth.isConfigured();

    if (!isConfigured) {
      return sendSuccess(res, {
        isConfigured: false,
        message: 'Google OAuth credentials not configured in .env. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      });
    }

    // Random single-use state bound to this user (CSRF protection)
    const state = googleOAuth.createState({ mode: 'connect', userId: req.user.id });

    const authUrl = googleOAuth.getAuthUrl(state);
    return sendSuccess(res, { authUrl, isConfigured: true });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle Google OAuth callback
 * GET /api/google-drive/callback
 */
export async function callback(req, res) {
  const { code, state, error } = req.query;

  // One redirect URI serves both "Sign in with Google" and "Connect Drive"; the state says which
  const storedState = googleOAuth.consumeState(state);
  const isLogin = storedState?.mode === 'login';
  const errorPage = isLogin ? '/login' : '/google-drive';

  if (error) {
    logger.warn('Google OAuth error callback:', { error });
    const reason = error === 'access_denied' ? 'access_denied' : 'connection_failed';
    return res.redirect(`${config.frontendUrl}${errorPage}?error=${reason}`);
  }

  if (!code || !state) {
    return res.redirect(`${config.frontendUrl}${errorPage}?error=missing_code_or_state`);
  }

  if (!storedState) {
    return res.redirect(`${config.frontendUrl}/login?error=invalid_state`);
  }

  if (isLogin) {
    return handleGoogleSignInCallback(req, res, code, storedState);
  }

  const userId = storedState.userId;

  try {
    // 1. Exchange code for tokens
    const { encryptedRefreshToken, googleAccountId } = await googleOAuth.getTokensFromCode(code);

    if (!encryptedRefreshToken) {
      return res.redirect(`${config.frontendUrl}/google-drive?error=no_refresh_token`);
    }

    // 2. Initialize Drive client & create root folder
    const authClient = googleOAuth.getAuthenticatedClient(encryptedRefreshToken);
    const rootFolderId = await googleDrive.getOrCreateRootFolder(authClient);

    // 3. Save connection into PostgreSQL
    await prisma.googleDriveConnection.upsert({
      where: { userId },
      create: {
        userId,
        googleAccountId,
        encryptedRefreshToken,
        rootFolderId,
        status: 'ACTIVE',
      },
      update: {
        googleAccountId,
        encryptedRefreshToken,
        rootFolderId,
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    logger.info(`Google Drive connected successfully for user ${userId} (${googleAccountId})`);
    return res.redirect(`${config.frontendUrl}/google-drive?connected=true`);
  } catch (err) {
    logger.error('Google OAuth callback failed:', { error: err.message });
    // Don't reflect internal error text into the URL; the frontend maps codes to messages
    return res.redirect(`${config.frontendUrl}/google-drive?error=connection_failed`);
  }
}

/**
 * Get current Google Drive connection status from PostgreSQL
 * GET /api/google-drive/status
 */
export async function getStatus(req, res, next) {
  try {
    const userId = req.user.id;

    const connection = await prisma.googleDriveConnection.findUnique({
      where: { userId },
      select: {
        id: true,
        googleAccountId: true,
        rootFolderId: true,
        status: true,
        connectedAt: true,
        updatedAt: true,
      },
    });

    const isConfigured = googleOAuth.isConfigured();
    const isConnected = Boolean(connection && connection.status === 'ACTIVE');

    return sendSuccess(res, {
      isConnected,
      connection,
      isConfigured,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Disconnect Google Drive
 * POST /api/google-drive/disconnect
 */
export async function disconnect(req, res, next) {
  try {
    const userId = req.user.id;

    await prisma.googleDriveConnection.updateMany({
      where: { userId },
      data: {
        status: 'DISCONNECTED',
        updatedAt: new Date(),
      },
    });

    logger.info(`Google Drive disconnected for user ${userId}`);
    return sendSuccess(res, null, 'Google Drive has been disconnected. Existing files remain in your Google Drive.');
  } catch (error) {
    next(error);
  }
}
