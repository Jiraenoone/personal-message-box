import * as messagesService from '../services/messages.service.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

const cleanupNote = (r) => (r === 'done' ? '' : ' (files could not be removed from storage — check Google Drive)');

/**
 * GET /api/boxes/:id/messages?page=&limit=&filter=image|video|text&search=
 */
export async function list(req, res, next) {
  try {
    const { messages, pagination } = await messagesService.listMessages(req.box.id, req.query);
    return sendPaginated(res, { messages, box: { id: req.box.id, title: req.box.title, status: req.box.status } }, pagination, 'Messages retrieved');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/boxes/:id/messages/:msgId
 */
export async function getOne(req, res, next) {
  try {
    const message = await messagesService.getMessage(req.box.id, req.params.msgId);
    return sendSuccess(res, { message, box: { id: req.box.id, title: req.box.title } }, 'Message retrieved');
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/boxes/:id/messages/:msgId
 */
export async function deleteOne(req, res, next) {
  try {
    const { storageCleanup } = await messagesService.deleteMessage(req.box, req.params.msgId);
    return sendSuccess(res, { storageCleanup }, `Message deleted${cleanupNote(storageCleanup)}`);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/boxes/:id/messages
 */
export async function deleteAll(req, res, next) {
  try {
    const { deleted, storageCleanup } = await messagesService.deleteAllMessages(req.box);
    return sendSuccess(res, { deleted, storageCleanup }, `${deleted} message(s) deleted${cleanupNote(storageCleanup)}`);
  } catch (error) {
    next(error);
  }
}
