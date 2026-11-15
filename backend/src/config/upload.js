import config from './index.js';

export const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

export const ALLOWED_VIDEO_TYPES = {
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/webm': ['.webm'],
};

export const FILE_SIGNATURES = {
  'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
  'image/webp': [Buffer.from('RIFF')], // RIFF header, WEBP at offset 8
  'video/mp4': [
    Buffer.from([0x00, 0x00, 0x00]),    // ftyp box (variable offset)
    Buffer.from('ftyp'),                 // ftyp identifier
  ],
  'video/quicktime': [Buffer.from('ftyp')],
  'video/webm': [Buffer.from([0x1A, 0x45, 0xDF, 0xA3])], // EBML header
};

export const uploadLimits = {
  maxImageSize: config.upload.maxImageSizeMB * 1024 * 1024,
  maxVideoSize: config.upload.maxVideoSizeMB * 1024 * 1024,
  maxImagesPerMessage: config.upload.maxImagesPerMessage,
  maxVideosPerMessage: config.upload.maxVideosPerMessage,
  maxTotalFiles: config.upload.maxImagesPerMessage + config.upload.maxVideosPerMessage,
};
