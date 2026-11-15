import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import prisma from '../utils/prisma.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import config from '../config/index.js';
import { deleteAllMessages } from './messages.service.js';

/**
 * Get all message boxes belonging to the user
 */
export async function getUserBoxes(userId) {
  const boxes = await prisma.messageBox.findMany({
    where: { userId },
    include: {
      _count: {
        select: {
          messages: {
            where: { deletedAt: null },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return boxes.map((box) => ({
    ...box,
    publicUrl: `${config.frontendUrl}/m/${box.publicSlug}`,
    messageCount: box._count.messages,
  }));
}

/**
 * Get single message box by ID with ownership verification
 */
export async function getBoxById(boxId, userId) {
  const box = await prisma.messageBox.findUnique({
    where: { id: boxId },
    include: {
      _count: {
        select: {
          messages: {
            where: { deletedAt: null },
          },
        },
      },
    },
  });

  if (!box) {
    throw new NotFoundError('Message box');
  }

  // Same response as "not found" so other users' box IDs can't be confirmed
  if (box.userId !== userId) {
    throw new NotFoundError('Message box');
  }

  return {
    ...box,
    publicUrl: `${config.frontendUrl}/m/${box.publicSlug}`,
    messageCount: box._count.messages,
  };
}

/**
 * Create a new message box
 * Requires active Google Drive connection
 */
export async function createBox(userId, { title, description }) {
  // Requirement 3: Users cannot create message boxes until Google Drive is successfully connected
  const driveConnection = await prisma.googleDriveConnection.findUnique({
    where: { userId },
  });

  if (!driveConnection || driveConnection.status !== 'ACTIVE') {
    throw new AppError(
      'Google Drive must be connected before creating a message box',
      400,
      'DRIVE_NOT_CONNECTED'
    );
  }

  // Generate cryptographically random, unpredictable public slug
  const publicSlug = nanoid(16);

  const box = await prisma.messageBox.create({
    data: {
      userId,
      title,
      description,
      publicSlug,
      status: 'ACTIVE',
    },
  });

  return {
    ...box,
    publicUrl: `${config.frontendUrl}/m/${box.publicSlug}`,
    messageCount: 0,
  };
}

/**
 * Update message box title / description
 */
export async function updateBox(boxId, userId, updateData) {
  await getBoxById(boxId, userId); // Verifies ownership

  const updatedBox = await prisma.messageBox.update({
    where: { id: boxId },
    data: {
      ...updateData,
      updatedAt: new Date(),
    },
    include: {
      _count: {
        select: {
          messages: {
            where: { deletedAt: null },
          },
        },
      },
    },
  });

  return {
    ...updatedBox,
    publicUrl: `${config.frontendUrl}/m/${updatedBox.publicSlug}`,
    messageCount: updatedBox._count.messages,
  };
}

/**
 * Update message box active / inactive status
 */
export async function updateBoxStatus(boxId, userId, status) {
  await getBoxById(boxId, userId); // Verifies ownership

  const updatedBox = await prisma.messageBox.update({
    where: { id: boxId },
    data: {
      status,
      updatedAt: new Date(),
    },
    include: {
      _count: {
        select: {
          messages: {
            where: { deletedAt: null },
          },
        },
      },
    },
  });

  return {
    ...updatedBox,
    publicUrl: `${config.frontendUrl}/m/${updatedBox.publicSlug}`,
    messageCount: updatedBox._count.messages,
  };
}

/**
 * Delete a message box
 */
export async function deleteBox(boxId, userId) {
  const box = await getBoxById(boxId, userId); // Verifies ownership

  // Remove attachments from Google Drive / local storage before the DB cascade drops the records
  const { storageCleanup } = await deleteAllMessages(box);

  await prisma.messageBox.delete({
    where: { id: boxId },
  });

  return { id: boxId, storageCleanup };
}

/**
 * Generate QR Code as a PNG image buffer for download or display
 */
export async function generateQRCodePNG(boxId, userId) {
  const box = await getBoxById(boxId, userId);
  const publicUrl = `${config.frontendUrl}/m/${box.publicSlug}`;

  const qrBuffer = await QRCode.toBuffer(publicUrl, {
    type: 'png',
    width: 500,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  return {
    buffer: qrBuffer,
    fileName: `qrcode-${box.publicSlug}.png`,
    publicUrl,
  };
}

export default {
  getUserBoxes,
  getBoxById,
  createBox,
  updateBox,
  updateBoxStatus,
  deleteBox,
  generateQRCodePNG,
};
