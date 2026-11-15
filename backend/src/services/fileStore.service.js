/**
 * File storage abstraction for message attachments.
 *
 * - "drive": the box owner's Google Drive (production path).
 *   Layout: Personal Message Box / <box title> / <message id> / <files>
 * - "local": development-only fallback, used when Google OAuth is not configured
 *   or the owner's connection is the seeded mock. Files go to backend/uploads/<boxId>/<messageId>/.
 *
 * MessageFile.driveFileId stores the Drive file ID, or "local:<relative path>" for local files.
 */
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';
import * as googleOAuth from './googleOAuth.service.js';
import * as googleDrive from './googleDrive.service.js';
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const LOCAL_PREFIX = 'local:';
const MOCK_TOKEN = 'mock-encrypted-refresh-token';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const LOCAL_UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

function useLocalStore(connection) {
  if (config.nodeEnv === 'production') return false;
  return !googleOAuth.isConfigured() || connection.encryptedRefreshToken === MOCK_TOKEN;
}

/** Resolve a stored "local:..." id to an absolute path, refusing path traversal. */
export function resolveLocalPath(storedId) {
  if (!storedId?.startsWith(LOCAL_PREFIX)) return null;
  const abs = path.resolve(LOCAL_UPLOAD_DIR, storedId.slice(LOCAL_PREFIX.length));
  if (!abs.startsWith(LOCAL_UPLOAD_DIR + path.sep)) return null;
  return abs;
}

/** Absolute path inside LOCAL_UPLOAD_DIR from trusted UUID segments (box / message IDs). */
function localDir(...segments) {
  const abs = path.resolve(LOCAL_UPLOAD_DIR, ...segments);
  if (!abs.startsWith(LOCAL_UPLOAD_DIR + path.sep)) throw new Error('Invalid local path');
  return abs;
}

/**
 * Parse a single HTTP byte range ("bytes=start-end", "bytes=start-", "bytes=-suffix").
 * @returns {{start:number,end:number}|null|'invalid'}
 */
export function parseRange(header, size) {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === '' && m[2] === '')) return 'invalid';
  let start;
  let end;
  if (m[1] === '') {
    const suffix = parseInt(m[2], 10);
    start = Math.max(size - suffix, 0);
    end = size - 1;
  } else {
    start = parseInt(m[1], 10);
    end = m[2] === '' ? size - 1 : Math.min(parseInt(m[2], 10), size - 1);
  }
  if (start > end || start >= size) return 'invalid';
  return { start, end };
}

const localStore = {
  kind: 'local',

  async createMessageFolder(box, messageId) {
    const rel = path.join(box.id, messageId);
    await fsp.mkdir(localDir(rel), { recursive: true });
    return rel;
  },

  async uploadFile(folder, tempPath, fileName) {
    const rel = path.join(folder, fileName);
    await fsp.copyFile(tempPath, localDir(rel));
    return `${LOCAL_PREFIX}${rel.split(path.sep).join('/')}`;
  },

  /** @returns {{ status, headers, stream }} */
  async openStream(storedId, rangeHeader) {
    const abs = resolveLocalPath(storedId);
    if (!abs) throw new AppError('File not found', 404, 'NOT_FOUND');
    let stat;
    try {
      stat = await fsp.stat(abs);
    } catch {
      throw new AppError('File not found in storage', 404, 'NOT_FOUND');
    }
    const size = stat.size;
    const range = parseRange(rangeHeader, size);
    if (range === 'invalid') {
      return { status: 416, headers: { 'Content-Range': `bytes */${size}` }, stream: null };
    }
    if (range) {
      return {
        status: 206,
        headers: {
          'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
          'Content-Length': String(range.end - range.start + 1),
        },
        stream: fs.createReadStream(abs, { start: range.start, end: range.end }),
      };
    }
    return { status: 200, headers: { 'Content-Length': String(size) }, stream: fs.createReadStream(abs) };
  },

  async deleteMessageFiles(box, messageId) {
    await fsp.rm(localDir(box.id, messageId), { recursive: true, force: true });
  },

  async deleteBoxFiles(box) {
    await fsp.rm(localDir(box.id), { recursive: true, force: true });
  },
};

function driveStore(connection) {
  let authClient;
  try {
    authClient = googleOAuth.getAuthenticatedClient(connection.encryptedRefreshToken);
  } catch {
    throw new AppError('Box owner storage is unavailable', 503, 'STORAGE_UNAVAILABLE');
  }

  return {
    kind: 'drive',

    async createMessageFolder(box, messageId) {
      const rootId = connection.rootFolderId || (await googleDrive.getOrCreateRootFolder(authClient));
      const boxFolderId = await googleDrive.getOrCreateBoxFolder(authClient, rootId, box.title, box.id);
      return googleDrive.createMessageFolder(authClient, boxFolderId, messageId);
    },

    async uploadFile(folderId, tempPath, fileName, mimeType) {
      const result = await googleDrive.uploadFile(authClient, folderId, fs.createReadStream(tempPath), fileName, mimeType);
      return result.id;
    },

    /** Proxy Drive's response, forwarding Range so the browser can seek in videos. */
    async openStream(storedId, rangeHeader) {
      try {
        const res = await googleDrive.getFileStream(authClient, storedId, rangeHeader);
        const headers = {};
        if (res.headers['content-length']) headers['Content-Length'] = res.headers['content-length'];
        if (res.headers['content-range']) headers['Content-Range'] = res.headers['content-range'];
        return { status: res.status, headers, stream: res.data };
      } catch (err) {
        const status = err.response?.status || err.code;
        if (status === 416) return { status: 416, headers: {}, stream: null };
        if (status === 404) throw new AppError('File not found in Google Drive', 404, 'NOT_FOUND');
        if (status === 401 || status === 403 || err.message?.includes('invalid_grant')) {
          throw new AppError('Google Drive access was revoked. Please reconnect Google Drive.', 502, 'DRIVE_ACCESS_REVOKED');
        }
        throw err;
      }
    },

    /** Delete the message folder (removes all files in it); fall back to per-file deletes. */
    async deleteMessageFiles(box, messageId, storedIds = []) {
      if (!storedIds.length) return;
      let folderId = null;
      try {
        const parents = await googleDrive.getFileParents(authClient, storedIds[0]);
        folderId = parents[0] || null;
      } catch (err) {
        if (err.code !== 404) logger.warn('Could not look up message folder', { messageId, error: err.message });
      }
      // Only delete the parent if it is really this message's folder (named by message ID)
      if (folderId) {
        try {
          const drive = googleDrive.getDriveClient(authClient);
          const { data } = await drive.files.get({ fileId: folderId, fields: 'name' });
          if (data.name === messageId) {
            await googleDrive.deleteFile(authClient, folderId);
            return;
          }
        } catch (err) {
          logger.warn('Could not delete message folder, deleting files one by one', { messageId, error: err.message });
        }
      }
      for (const id of storedIds) {
        await googleDrive.deleteFile(authClient, id);
      }
    },

    async deleteBoxFiles(box) {
      const folderId = await googleDrive.findBoxFolder(authClient, box.id);
      if (folderId) await googleDrive.deleteFile(authClient, folderId);
    },
  };
}

/** Get the storage driver for a box owner's storage connection. */
export function getStore(connection) {
  return useLocalStore(connection) ? localStore : driveStore(connection);
}

/** The local dev store (for cleaning up leftovers regardless of current mode). */
export function getLocalStore() {
  return localStore;
}

/** Pick the driver that holds an already-stored file, based on its stored ID format. */
export function getStoreForFile(storedId, connection) {
  if (storedId?.startsWith(LOCAL_PREFIX)) return localStore;
  if (!connection) throw new AppError('Box owner storage is unavailable', 503, 'STORAGE_UNAVAILABLE');
  return driveStore(connection);
}

/**
 * Best-effort storage cleanup. Never throws — DB deletion should still go ahead
 * when Drive is disconnected/revoked; the result tells the UI what happened.
 * @returns {Promise<'done'|'skipped'|'failed'>}
 */
export async function safeCleanup(label, fn) {
  try {
    await fn();
    return 'done';
  } catch (err) {
    const skipped = err.code === 'STORAGE_UNAVAILABLE';
    logger.warn(`Storage cleanup ${skipped ? 'skipped' : 'failed'}: ${label}`, { error: err.message });
    return skipped ? 'skipped' : 'failed';
  }
}

export default { getStore, getStoreForFile, resolveLocalPath, parseRange, safeCleanup, LOCAL_UPLOAD_DIR };
