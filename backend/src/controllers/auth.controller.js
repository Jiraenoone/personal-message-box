import config from '../config/index.js';
import * as authService from '../services/auth.service.js';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';
import { sendSuccess } from '../utils/response.js';

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
