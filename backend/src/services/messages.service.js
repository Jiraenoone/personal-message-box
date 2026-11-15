import prisma from '../utils/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import { isUuid } from '../middleware/ownershipCheck.js';
import { getStore, getStoreForFile, getLocalStore, safeCleanup } from './fileStore.service.js';

const FILE_SELECT = {
  id: true,
  fileName: true,
  mimeType: true,
  fileSize: true,
  uploadStatus: true,
  createdAt: true,
};

/** BigInt fileSize -> number, add a stream URL path and media kind */
function serializeFile(messageId, f) {
  return {
    id: f.id,
    fileName: f.fileName,
    mimeType: f.mimeType,
    fileSize: Number(f.fileSize),
    uploadStatus: f.uploadStatus,
    kind: f.mimeType.startsWith('image/') ? 'image' : f.mimeType.startsWith('video/') ? 'video' : 'other',
    url: f.uploadStatus === 'COMPLETED' ? `/api/messages/${messageId}/files/${f.id}` : null,
  };
}

function serializeMessage(m) {
  const files = (m.files || []).map((f) => serializeFile(m.id, f));
  return {
    id: m.id,
    senderName: m.senderName,
    content: m.content,
    createdAt: m.createdAt,
    files,
    imageCount: files.filter((f) => f.kind === 'image').length,
    videoCount: files.filter((f) => f.kind === 'video').length,
  };
}

const FILTERS = {
  image: { files: { some: { mimeType: { startsWith: 'image/' } } } },
  video: { files: { some: { mimeType: { startsWith: 'video/' } } } },
  text: { files: { none: {} } },
};

/**
 * Paginated list of messages in a box, newest first.
 * @param {string} boxId - already ownership-checked
 * @param {{ page?: any, limit?: any, filter?: string, search?: string }} query
 */
export async function listMessages(boxId, query = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const where = {
    boxId,
    deletedAt: null,
    ...(FILTERS[query.filter] || {}),
  };
  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 100) : '';
  if (search) {
    where.OR = [
      { senderName: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, messages] = await prisma.$transaction([
    prisma.message.count({ where }),
    prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { files: { select: FILE_SELECT, orderBy: { fileName: 'asc' } } },
    }),
  ]);

  return { messages: messages.map(serializeMessage), pagination: { page, limit, total } };
}

async function findMessageInBox(boxId, messageId, includeStorage = false) {
  if (!isUuid(messageId)) throw new NotFoundError('Message');
  const message = await prisma.message.findFirst({
    where: { id: messageId, boxId, deletedAt: null },
    include: {
      files: includeStorage
        ? { orderBy: { fileName: 'asc' }, include: { driveConnection: true } }
        : { select: FILE_SELECT, orderBy: { fileName: 'asc' } },
    },
  });
  if (!message) throw new NotFoundError('Message');
  return message;
}

export async function getMessage(boxId, messageId) {
  return serializeMessage(await findMessageInBox(boxId, messageId));
}

/** Remove a message's files from storage (Drive or local), grouped by where they live. */
async function cleanupMessageStorage(box, message) {
  const stored = message.files.filter((f) => f.driveFileId);
  if (!stored.length) return 'done';

  const groups = new Map(); // store kind -> { store, ids }
  for (const f of stored) {
    let store;
    try {
      store = getStoreForFile(f.driveFileId, f.driveConnection?.status === 'ACTIVE' ? f.driveConnection : null);
    } catch (err) {
      return safeCleanup(`message ${message.id}`, () => { throw err; });
    }
    if (!groups.has(store.kind)) groups.set(store.kind, { store, ids: [] });
    groups.get(store.kind).ids.push(f.driveFileId);
  }

  let result = 'done';
  for (const { store, ids } of groups.values()) {
    const r = await safeCleanup(`message ${message.id}`, () => store.deleteMessageFiles(box, message.id, ids));
    if (r !== 'done') result = r;
  }
  return result;
}

/**
 * Delete one message: storage files first (best effort), then the DB rows.
 * @returns {{ storageCleanup: 'done'|'skipped'|'failed' }}
 */
export async function deleteMessage(box, messageId) {
  const message = await findMessageInBox(box.id, messageId, true);
  const storageCleanup = await cleanupMessageStorage(box, message);
  await prisma.message.delete({ where: { id: message.id } });
  return { storageCleanup };
}

/**
 * Delete every message in a box (and their files). Used by "delete all" and box deletion.
 * @returns {{ deleted: number, storageCleanup: 'done'|'skipped'|'failed' }}
 */
export async function deleteAllMessages(box) {
  const messages = await prisma.message.findMany({
    where: { boxId: box.id },
    include: { files: { include: { driveConnection: true } } },
  });

  // One folder delete per storage location instead of one call per message.
  // Always include the local dir and the owner's current store, so empty box folders
  // (left after deleting messages one by one) are removed too.
  const stores = new Map([['local', getLocalStore()]]);
  let storageCleanup = 'done';
  const ownerConnection = await prisma.googleDriveConnection.findUnique({ where: { userId: box.userId } });
  if (ownerConnection?.status === 'ACTIVE') {
    try {
      const store = getStore(ownerConnection);
      stores.set(store.kind, store);
    } catch {
      // Drive unreachable — handled below via per-file stores / 'skipped'
    }
  }
  for (const f of messages.flatMap((m) => m.files).filter((x) => x.driveFileId)) {
    try {
      const store = getStoreForFile(f.driveFileId, f.driveConnection?.status === 'ACTIVE' ? f.driveConnection : null);
      stores.set(store.kind, store);
    } catch {
      storageCleanup = 'skipped';
    }
  }
  for (const store of stores.values()) {
    const r = await safeCleanup(`box ${box.id}`, () => store.deleteBoxFiles(box));
    if (r !== 'done') storageCleanup = r;
  }

  const { count } = await prisma.message.deleteMany({ where: { boxId: box.id } });
  return { deleted: count, storageCleanup };
}

export default { listMessages, getMessage, deleteMessage, deleteAllMessages };
