import * as boxesService from '../services/boxes.service.js';
import { validateCreateBox, validateUpdateBox, validateUpdateStatus } from '../validators/box.validator.js';
import { sendSuccess } from '../utils/response.js';

/**
 * List all message boxes for current user
 * GET /api/boxes
 */
export async function list(req, res, next) {
  try {
    const boxes = await boxesService.getUserBoxes(req.user.id);
    return sendSuccess(res, { boxes }, 'Message boxes retrieved');
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new message box
 * POST /api/boxes
 */
export async function create(req, res, next) {
  try {
    const validatedData = validateCreateBox(req.body);
    const box = await boxesService.createBox(req.user.id, validatedData);
    return sendSuccess(res, { box }, 'Message box created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Get single message box details
 * GET /api/boxes/:id
 */
export async function getOne(req, res, next) {
  try {
    const box = await boxesService.getBoxById(req.params.id, req.user.id);
    return sendSuccess(res, { box }, 'Message box details retrieved');
  } catch (error) {
    next(error);
  }
}

/**
 * Update message box title / description
 * PATCH /api/boxes/:id
 */
export async function update(req, res, next) {
  try {
    const validatedData = validateUpdateBox(req.body);
    const box = await boxesService.updateBox(req.params.id, req.user.id, validatedData);
    return sendSuccess(res, { box }, 'Message box updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Update message box active / inactive status
 * PATCH /api/boxes/:id/status
 */
export async function updateStatus(req, res, next) {
  try {
    const status = validateUpdateStatus(req.body);
    const box = await boxesService.updateBoxStatus(req.params.id, req.user.id, status);
    return sendSuccess(res, { box }, `Message box marked as ${status}`);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a message box
 * DELETE /api/boxes/:id
 */
export async function deleteBox(req, res, next) {
  try {
    await boxesService.deleteBox(req.params.id, req.user.id);
    return sendSuccess(res, null, 'Message box deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Download QR Code PNG image
 * GET /api/boxes/:id/qr
 */
export async function getQRCode(req, res, next) {
  try {
    const { buffer, fileName } = await boxesService.generateQRCodePNG(req.params.id, req.user.id);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
}
