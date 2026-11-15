export const APP_NAME = 'Personal Message Box';

export const UPLOAD_LIMITS = {
  MAX_IMAGE_SIZE_MB: 10,
  MAX_VIDEO_SIZE_MB: 100,
  MAX_IMAGES_PER_MESSAGE: 5,
  MAX_VIDEOS_PER_MESSAGE: 1,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/webm'],
  ALLOWED_IMAGE_EXTENSIONS: '.jpg,.jpeg,.png,.webp',
  ALLOWED_VIDEO_EXTENSIONS: '.mp4,.mov,.webm',
};

export const BOX_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
};

export const UPLOAD_STATUS = {
  PENDING: 'PENDING',
  UPLOADING: 'UPLOADING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

export const DRIVE_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
  DISCONNECTED: 'DISCONNECTED',
};
