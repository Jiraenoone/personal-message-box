import path from 'path';
import prisma from '../utils/prisma.js';
import logger from '../utils/logger.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import { getStore } from './fileStore.service.js';

/**
 * Load an ACTIVE box by public slug together with its owner's active storage connection.
 * Throws the right public-facing error when the box cannot receive messages.
 */
export async function getReceivableBox(slug) {
  const box = await prisma.messageBox.findUnique({
    where: { publicSlug: slug },
    include: { user: { select: { driveConnection: true } } },
  });

  if (!box) throw new NotFoundError('Message box');
  if (box.status !== 'ACTIVE') {
    throw new AppError('This message box is no longer accepting messages', 403, 'BOX_INACTIVE');
  }
  const connection = box.user.driveConnection;
  if (!connection || connection.status !== 'ACTIVE') {
    throw new AppError('This message box cannot receive messages right now', 503, 'STORAGE_UNAVAILABLE');
  }
  return { box, connection };
}

/**
 * When Google rejects the refresh token (user revoked access / token expired), mark the
 * connection EXPIRED so the public page stops accepting uploads and the owner sees "reconnect".
 */
async function markConnectionIfRevoked(connection, err) {
  const revoked = err?.message?.includes('invalid_grant') || err?.response?.status === 401;
  if (!revoked || connection.status !== 'ACTIVE') return;
  connection.status = 'EXPIRED';
  await prisma.googleDriveConnection.update({ where: { id: connection.id }, data: { status: 'EXPIRED' } }).catch(() => {});
  logger.warn(`Google Drive access revoked for connection ${connection.id}; marked EXPIRED`);
}

/** Build a safe, unique-ish filename for storage: 01_photo.jpg */
function storageFileName(file, index) {
  const ext = path.extname(file.originalname).toLowerCase();
  const base = path.basename(file.originalname, path.extname(file.originalname))
    .replace(/[^\p{L}\p{N}._ -]/gu, '_')
    .slice(0, 80) || 'file';
  return `${String(index + 1).padStart(2, '0')}_${base}${ext}`;
}

/**
 * Save a public message and upload its attachments to the owner's storage.
 * The message row is created first; each file is tracked in message_files with
 * PENDING -> COMPLETED / FAILED, and overall progress in upload_sessions.
 *
 * @param {string} slug
 * @param {{ senderName: string, content: string|null }} data
 * @param {Express.Multer.File[]} files - validated temp files (kind, detectedMime set)
 */
export async function submitMessage(slug, data, files = []) {
  const { box, connection } = await getReceivableBox(slug);
  const store = getStore(connection);

  const message = await prisma.message.create({
    data: {
      boxId: box.id,
      senderName: data.senderName,
      content: data.content,
      files: {
        create: files.map((file, i) => ({
          driveConnectionId: connection.id,
          fileName: storageFileName(file, i),
          mimeType: file.detectedMime,
          fileSize: BigInt(file.size),
          uploadStatus: 'PENDING',
        })),
      },
      uploadSession: files.length
        ? { create: { status: 'UPLOADING', totalFiles: files.length } }
        : undefined,
    },
    include: { files: { orderBy: { fileName: 'asc' } } },
  });

  if (!files.length) {
    return { message, uploaded: 0, failed: 0 };
  }

  let folderId;
  try {
    folderId = await store.createMessageFolder(box, message.id);
  } catch (err) {
    logger.error('Failed to create storage folder for message', { messageId: message.id, error: err.message });
    await markConnectionIfRevoked(connection, err);
  }

  let uploaded = 0;
  let failed = 0;
  // Sequential upload keeps memory/bandwidth predictable and Drive quota errors simple to handle
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const record = message.files[i];
    try {
      if (!folderId) throw new Error('No storage folder');
      const storedId = await store.uploadFile(folderId, file.path, record.fileName, file.detectedMime);
      await prisma.messageFile.update({
        where: { id: record.id },
        data: { driveFileId: storedId, uploadStatus: 'COMPLETED' },
      });
      uploaded += 1;
    } catch (err) {
      failed += 1;
      logger.error('File upload to storage failed', { messageId: message.id, fileId: record.id, error: err.message });
      await markConnectionIfRevoked(connection, err);
      await prisma.messageFile.update({ where: { id: record.id }, data: { uploadStatus: 'FAILED' } });
    }
  }

  await prisma.uploadSession.update({
    where: { messageId: message.id },
    data: {
      completedFiles: uploaded,
      status: failed === 0 ? 'COMPLETED' : uploaded === 0 ? 'FAILED' : 'PARTIAL',
      errorMessage: failed ? `${failed} file(s) failed to upload` : null,
    },
  });

  logger.info(`Message ${message.id} received for box ${box.id} (${uploaded} uploaded, ${failed} failed, store=${store.kind})`);
  return { message, uploaded, failed };
}

export default { getReceivableBox, submitMessage };
