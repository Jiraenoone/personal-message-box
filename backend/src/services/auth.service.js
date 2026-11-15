import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { generateToken } from '../utils/jwt.js';
import { AuthenticationError, ConflictError, NotFoundError } from '../utils/errors.js';

const BCRYPT_SALT_ROUNDS = 12;

function sanitizeUser(user) {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}

/**
 * Register a new user in PostgreSQL
 */
export async function register({ email, password, displayName }) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
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
