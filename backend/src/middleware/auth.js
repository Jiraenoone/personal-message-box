import { verifyToken } from '../utils/jwt.js';
import prisma from '../utils/prisma.js';
import { AuthenticationError } from '../utils/errors.js';

/**
 * Authentication middleware.
 * Verifies JWT token from httpOnly cookie or Authorization header.
 * Attaches the authenticated user to req.user.
 */
export async function authenticate(req, res, next) {
  try {
    let token = req.cookies?.token;

    // Fallback to Bearer token in Authorization header
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AuthenticationError('Authentication required. Please log in.');
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AuthenticationError('Session expired. Please log in again.');
      }
      throw new AuthenticationError('Invalid authentication token.');
    }

    // Fetch user from PostgreSQL
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('User account no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware.
 * If token is present and valid, attaches req.user; otherwise continues as guest.
 */
export async function optionalAuth(req, res, next) {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          displayName: true,
        },
      });
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // Ignore error for optional authentication
  }
  next();
}
