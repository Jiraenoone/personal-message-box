import { Router } from 'express';
import * as publicController from '../controllers/public.controller.js';
import { publicSubmitLimiter } from '../middleware/rateLimiter.js';
import { receiveFiles, validateUploadedFiles } from '../middleware/fileValidation.js';

const router = Router();

// No authentication — anyone with the link / QR code
router.get('/boxes/:slug', publicController.getBox);
router.post(
  '/boxes/:slug/messages',
  publicSubmitLimiter,
  receiveFiles,
  validateUploadedFiles,
  publicController.submitMessage
);

export default router;
