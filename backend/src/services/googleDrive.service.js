import { google } from 'googleapis';
import logger from '../utils/logger.js';

const ROOT_FOLDER_NAME = 'Personal Message Box';

/**
 * Initialize Google Drive API client
 */
export function getDriveClient(authClient) {
  return google.drive({ version: 'v3', auth: authClient });
}

/**
 * Find or create the application root folder ("Personal Message Box") in owner's Drive
 * @param {google.auth.OAuth2} authClient
 * @returns {Promise<string>} Root folder ID
 */
export async function getOrCreateRootFolder(authClient) {
  const drive = getDriveClient(authClient);

  try {
    // Search for existing root folder created by our app
    const res = await drive.files.list({
      q: `name = '${ROOT_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (res.data.files && res.data.files.length > 0) {
      const existingId = res.data.files[0].id;
      logger.info(`Found existing root folder: ${existingId}`);
      return existingId;
    }

    // Create new root folder
    const folderMetadata = {
      name: ROOT_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Dedicated folder for Personal Message Box uploads',
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id, name',
    });

    logger.info(`Created new application root folder: ${folder.data.id}`);
    return folder.data.id;
  } catch (error) {
    logger.error('Failed to get/create root folder in Google Drive:', error);
    throw error;
  }
}

/**
 * Create a subfolder for a specific Message Box
 * @param {google.auth.OAuth2} authClient
 * @param {string} rootFolderId
 * @param {string} boxTitle
 * @param {string} boxId
 * @returns {Promise<string>} Box folder ID
 */
export async function createBoxFolder(authClient, rootFolderId, boxTitle, boxId) {
  const drive = getDriveClient(authClient);

  const folderName = `${boxTitle} (${boxId.substring(0, 8)})`;
  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [rootFolderId],
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id, name',
  });

  return folder.data.id;
}

/**
 * Find (by appProperties.pmbBoxId, so renaming the box is safe) or create the box folder
 * @returns {Promise<string>} Box folder ID
 */
export async function getOrCreateBoxFolder(authClient, rootFolderId, boxTitle, boxId) {
  const drive = getDriveClient(authClient);

  const res = await drive.files.list({
    q: `appProperties has { key='pmbBoxId' and value='${boxId}' } and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
    spaces: 'drive',
  });
  if (res.data.files?.length) {
    return res.data.files[0].id;
  }

  const folder = await drive.files.create({
    requestBody: {
      name: boxTitle.replace(/[\\/]/g, '-').slice(0, 200),
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolderId],
      appProperties: { pmbBoxId: boxId },
    },
    fields: 'id',
  });
  return folder.data.id;
}

/**
 * Find the box folder ID (by appProperties.pmbBoxId) without creating it.
 * @returns {Promise<string|null>}
 */
export async function findBoxFolder(authClient, boxId) {
  const drive = getDriveClient(authClient);
  const res = await drive.files.list({
    q: `appProperties has { key='pmbBoxId' and value='${boxId}' } and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
    spaces: 'drive',
  });
  return res.data.files?.[0]?.id || null;
}

/**
 * Get the parent folder IDs of a file.
 * @returns {Promise<string[]>}
 */
export async function getFileParents(authClient, fileId) {
  const drive = getDriveClient(authClient);
  const res = await drive.files.get({ fileId, fields: 'parents' });
  return res.data.parents || [];
}

/**
 * Create a subfolder for a specific Message
 * @param {google.auth.OAuth2} authClient
 * @param {string} boxFolderId
 * @param {string} messageId
 * @returns {Promise<string>} Message folder ID
 */
export async function createMessageFolder(authClient, boxFolderId, messageId) {
  const drive = getDriveClient(authClient);

  const folderName = messageId;
  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [boxFolderId],
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id, name',
  });

  return folder.data.id;
}

/**
 * Upload a media file stream to Google Drive
 * @param {google.auth.OAuth2} authClient
 * @param {string} folderId - Parent folder ID
 * @param {ReadableStream} fileStream - Readable stream of file content
 * @param {string} fileName - File name
 * @param {string} mimeType - File MIME type
 * @returns {Promise<{ id: string, name: string, size: number }>}
 */
export async function uploadFile(authClient, folderId, fileStream, fileName, mimeType) {
  const drive = getDriveClient(authClient);

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType,
    body: fileStream,
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name, mimeType, size',
  });

  return {
    id: response.data.id,
    name: response.data.name,
    mimeType: response.data.mimeType,
    size: parseInt(response.data.size || '0', 10),
  };
}

/**
 * Download/stream file from Google Drive for private media proxy
 * @param {google.auth.OAuth2} authClient
 * @param {string} fileId
 * @param {string} [rangeHeader] - Optional Range header for video streaming
 * @returns {Promise<any>}
 */
export async function getFileStream(authClient, fileId, rangeHeader) {
  const drive = getDriveClient(authClient);

  const options = {
    fileId,
    alt: 'media',
  };

  const headers = {};
  if (rangeHeader) {
    headers.Range = rangeHeader;
  }

  return drive.files.get(options, {
    responseType: 'stream',
    headers,
  });
}

/**
 * Delete a file or folder from Google Drive
 * @param {google.auth.OAuth2} authClient
 * @param {string} fileId
 */
export async function deleteFile(authClient, fileId) {
  const drive = getDriveClient(authClient);
  try {
    await drive.files.delete({ fileId });
    return true;
  } catch (error) {
    // If already deleted or not found, don't crash
    if (error.code === 404) {
      return true;
    }
    logger.warn(`Could not delete file ${fileId} from Drive:`, error.message);
    throw error;
  }
}

/**
 * Retrieve storage quota for owner's Google account
 * @param {google.auth.OAuth2} authClient
 */
export async function getStorageQuota(authClient) {
  const drive = getDriveClient(authClient);
  try {
    const res = await drive.about.get({
      fields: 'storageQuota, user',
    });
    return res.data;
  } catch (err) {
    logger.warn('Could not fetch storage quota:', err.message);
    return null;
  }
}

export default {
  getDriveClient,
  getOrCreateRootFolder,
  createBoxFolder,
  getOrCreateBoxFolder,
  findBoxFolder,
  getFileParents,
  createMessageFolder,
  uploadFile,
  getFileStream,
  deleteFile,
  getStorageQuota,
};
