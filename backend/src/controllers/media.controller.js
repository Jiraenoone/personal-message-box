import { pipeline } from 'stream/promises';
import prisma from '../utils/prisma.js';
import logger from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';
import { isUuid } from '../middleware/ownershipCheck.js';
import { getStoreForFile } from '../services/fileStore.service.js';

/**
 * Stream a message attachment to its owner, proxied from Google Drive (or local dev storage).
 * Supports HTTP Range so <video> can seek without downloading the whole file.
 * GET /api/messages/:msgId/files/:fileId
 */
export async function streamFile(req, res, next) {
  try {
    const { msgId, fileId } = req.params;
    if (!isUuid(msgId) || !isUuid(fileId)) throw new NotFoundError('File');

    // Ownership: file -> message -> box -> user must be the requester (404 otherwise)
    const file = await prisma.messageFile.findFirst({
      where: {
        id: fileId,
        messageId: msgId,
        uploadStatus: 'COMPLETED',
        message: { deletedAt: null, box: { userId: req.user.id } },
      },
      include: { driveConnection: true },
    });
    if (!file || !file.driveFileId) throw new NotFoundError('File');

    const connection = file.driveConnection?.status === 'ACTIVE' ? file.driveConnection : null;
    const store = getStoreForFile(file.driveFileId, connection);
    const { status, headers, stream } = await store.openStream(file.driveFileId, req.headers.range);

    res.status(status);
    res.set({
      ...headers,
      'Content-Type': file.mimeType,
      'Accept-Ranges': 'bytes',
      // Private: only the owner's browser may cache it
      'Cache-Control': 'private, max-age=3600',
      // Frontend (another port/subdomain of the same site) may embed it in <img>/<video>
      'Cross-Origin-Resource-Policy': 'same-site',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': `${req.query.download === '1' ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    });

    if (!stream) return res.end();

    // Stop pulling from Drive/disk if the browser aborts (common while seeking video)
    req.on('close', () => stream.destroy());
    try {
      await pipeline(stream, res);
    } catch (err) {
      if (err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
        logger.warn('Media stream error', { fileId, error: err.message });
      }
    }
  } catch (error) {
    next(error);
  }
}
