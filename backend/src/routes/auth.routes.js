import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public auth endpoints (rate-limited)
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);

// "Sign in with Google" (sign in or sign up). Google redirects back to /api/google-drive/callback.
router.get('/google', authController.googleStart);

// Logout must work even with an expired/invalid token, so the cookie always gets cleared
router.post('/logout', authController.logout);

// Protected auth endpoints
router.get('/me', authenticate, authController.getMe);

export default router;
