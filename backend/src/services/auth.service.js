import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { generateToken } from '../utils/jwt.js';
import { AuthenticationError, ConflictError, NotFoundError } from '../utils/errors.js';

const BCRYPT_SALT_ROUNDS = 12;

function sanitizeUser(user) {
  // eslint-disable-next-line no-unused-vars
  const { passwordHash, googleId, ...sanitized } = user;
  return sanitized;
}

const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  displayName: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Find, link or create the app account for a verified Google profile.
 * 1. Same Google account (googleId) → that user
 * 2. Existing account with the same email → link Google to it (only if Google verified the email)
 * 3. Otherwise → new passwordless account
 * @param {{ sub: string, email: string, emailVerified: boolean, name: string }} profile
 * @returns {Promise<{ user: object, token: string, created: boolean }>}
 */
export async function signInWithGoogle(profile) {
  if (!profile.sub || !profile.email) {
    throw new AuthenticationError('Google did not provide an email address');
  }
  if (!profile.emailVerified) {
    // Linking by an unverified email would let someone take over another person's account
    throw new AuthenticationError('Your Google email address is not verified');
  }

  let created = false;
  let user = await prisma.user.findUnique({ where: { googleId: profile.sub }, select: PUBLIC_USER_SELECT });

  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
    if (byEmail) {
      if (byEmail.googleId && byEmail.googleId !== profile.sub) {
        throw new ConflictError('This email is already linked to a different Google account');
      }
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: { googleId: profile.sub },
        select: PUBLIC_USER_SELECT,
      });
    } else {
      const displayName = (profile.name || profile.email.split('@')[0]).trim().slice(0, 100) || 'User';
      user = await prisma.user.create({
        data: { email: profile.email, displayName, googleId: profile.sub, passwordHash: null },
        select: PUBLIC_USER_SELECT,
      });
      created = true;
    }
  }

  const token = generateToken({ id: user.id, email: user.email });
  return { user, token, created };
}

/**
 * Register a new user in PostgreSQL
 */
export async function register({ email, password, displayName }) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError('An account with this email already exists. Please sign in instead (or use "Continue with Google").');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const token = generateToken({ id: user.id, email: user.email });
  return { user, token };
}

/**
 * Authenticate user login against PostgreSQL
 */
export async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      driveConnection: {
        select: {
          id: true,
          status: true,
          googleAccountId: true,
          connectedAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Account created with "Sign in with Google" — it has no password
  if (!user.passwordHash) {
    throw new AuthenticationError('This account uses Google sign-in. Please use "Continue with Google".');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AuthenticationError('Invalid email or password');
  }

  const token = generateToken({ id: user.id, email: user.email });
  return { user: sanitizeUser(user), token };
}

/**
 * Get current user profile by user ID from PostgreSQL
 */
export async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
      updatedAt: true,
      driveConnection: {
        select: {
          id: true,
          status: true,
          googleAccountId: true,
          connectedAt: true,
        },
      },
      _count: {
        select: {
          messageBoxes: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}
