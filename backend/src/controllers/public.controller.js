import prisma from '../utils/prisma.js';
import * as uploadService from '../services/upload.service.js';
import { validateSubmitMessage, MAX_SENDER_NAME, MAX_CONTENT } from '../validators/message.validator.js';
import { cleanupTempFiles } from '../middleware/fileValidation.js';
import { uploadLimits, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from '../config/upload.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Public box info — only what a visitor needs. Never exposes messages, owner email or IDs.
 * GET /api/public/boxes/:slug
 */
export async function getBox(req, res, next) {
  try {
    const box = await prisma.messageBox.findUnique({
      where: { publicSlug: req.params.slug },
      select: {
        title: true,
        description: true,
        status: true,
        user: { select: { driveConnection: { select: { status: true } } } },
      },
    });
    if (!box) throw new NotFoundError('Message box');

    const storageReady = box.user.driveConnection?.status === 'ACTIVE';

    return sendSuccess(res, {
      box: {
        title: box.title,
        description: box.description,
        status: box.status,
        acceptingMessages: box.status === 'ACTIVE' && storageReady,
      },
      limits: {
        maxImages: uploadLimits.maxImagesPerMessage,
        maxVideos: uploadLimits.maxVideosPerMessage,
        maxImageSizeMB: uploadLimits.maxImageSize / 1024 / 1024,
        maxVideoSizeMB: uploadLimits.maxVideoSize / 1024 / 1024,
        imageTypes: Object.keys(ALLOWED_IMAGE_TYPES),
        videoTypes: Object.keys(ALLOWED_VIDEO_TYPES),
        maxSenderName: MAX_SENDER_NAME,
        maxContent: MAX_CONTENT,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Submit a message (multipart: senderName, content, files[])
 * POST /api/public/boxes/:slug/messages
 */
export async function submitMessage(req, res, next) {
  const files = req.files || [];
  try {
    const data = validateSubmitMessage(req.body, files.length);
    const { message, uploaded, failed } = await uploadService.submitMessage(req.params.slug, data, files);

    const msg = failed
      ? `Message sent, but ${failed} file(s) could not be uploaded`
      : 'Message sent successfully';

    return sendSuccess(res, {
      messageId: message.id,
      createdAt: message.createdAt,
      files: { total: files.length, uploaded, failed },
    }, msg, 201);
  } catch (error) {
    next(error);
  } finally {
    await cleanupTempFiles(files);
  }
}
