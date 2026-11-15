import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, uploadLimits } from '../config/upload.js';
import { detectFileMimeType } from '../utils/fileSignature.js';
import { ValidationError } from '../utils/errors.js';

const TMP_DIR = path.join(os.tmpdir(), 'pmb-uploads');
await fs.mkdir(TMP_DIR, { recursive: true });

const ALLOWED_EXTENSIONS = new Set(
  [...Object.values(ALLOWED_IMAGE_TYPES), ...Object.values(ALLOWED_VIDEO_TYPES)].flat()
);

/**
 * Multer: stream uploads to a temp dir (avoids holding 100MB videos in memory).
 * Per-file size cap is the largest allowed (video); per-type caps are checked afterwards.
 */
const upload = multer({
  storage: multer.diskStorage({
    destination: TMP_DIR,
    filename: (req, file, cb) => cb(null, crypto.randomUUID()),
  }),
  limits: {
    fileSize: Math.max(uploadLimits.maxImageSize, uploadLimits.maxVideoSize),
    files: uploadLimits.maxTotalFiles,
    fields: 10,
    fieldSize: 64 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new ValidationError('Unsupported file type', [
        { field: 'files', message: `"${file.originalname}" is not an allowed file type` },
      ]));
    }
    cb(null, true);
  },
});

export async function cleanupTempFiles(files = []) {
  await Promise.all(files.map((f) => fs.unlink(f.path).catch(() => {})));
}

/**
 * Accept up to N files in the "files" field.
 * multer may leave partial temp files on error, so clean up whatever it attached.
 */
export function receiveFiles(req, res, next) {
  upload.array('files', uploadLimits.maxTotalFiles)(req, res, async (err) => {
    if (err) {
      await cleanupTempFiles(req.files);
      return next(err);
    }
    next();
  });
}

/**
 * Verify each uploaded file's real type via magic bytes, extension consistency,
 * per-type size limits and per-type counts. Sets file.kind ('image' | 'video')
 * and file.detectedMime. Deletes temp files and rejects on any problem.
 */
export async function validateUploadedFiles(req, res, next) {
  const files = req.files || [];
  try {
    const errors = [];
    let images = 0;
    let videos = 0;

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const mime = await detectFileMimeType(file.path);
      const isImage = mime && ALLOWED_IMAGE_TYPES[mime];
      const isVideo = mime && ALLOWED_VIDEO_TYPES[mime];

      if (!isImage && !isVideo) {
        errors.push({ field: 'files', message: `"${file.originalname}" content does not match an allowed image or video format` });
        continue;
      }

      // Extension must belong to the same family as the real content (stops e.g. .jpg that is really a video)
      const familyExts = Object.values(isImage ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES).flat();
      if (!familyExts.includes(ext)) {
        errors.push({ field: 'files', message: `"${file.originalname}" extension does not match its content` });
        continue;
      }

      file.detectedMime = mime;
      file.kind = isImage ? 'image' : 'video';

      if (isImage) {
        images += 1;
        if (file.size > uploadLimits.maxImageSize) {
          errors.push({ field: 'files', message: `"${file.originalname}" exceeds ${uploadLimits.maxImageSize / 1024 / 1024}MB image limit` });
        }
      } else {
        videos += 1;
        if (file.size > uploadLimits.maxVideoSize) {
          errors.push({ field: 'files', message: `"${file.originalname}" exceeds ${uploadLimits.maxVideoSize / 1024 / 1024}MB video limit` });
        }
      }
    }

    if (images > uploadLimits.maxImagesPerMessage) {
      errors.push({ field: 'files', message: `At most ${uploadLimits.maxImagesPerMessage} images per message` });
    }
    if (videos > uploadLimits.maxVideosPerMessage) {
      errors.push({ field: 'files', message: `At most ${uploadLimits.maxVideosPerMessage} video per message` });
    }

    if (errors.length) {
      await cleanupTempFiles(files);
      throw new ValidationError('File validation failed', errors);
    }
    next();
  } catch (err) {
    await cleanupTempFiles(files);
    next(err);
  }
}

export default { receiveFiles, validateUploadedFiles, cleanupTempFiles };
