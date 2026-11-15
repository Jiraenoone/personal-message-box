import { Router } from 'express';
import * as mediaController from '../controllers/media.controller.js';
import { authenticate } from '../middleware/auth.js';

// Mounted at /api/messages
const router = Router();

router.get('/:msgId/files/:fileId', authenticate, mediaController.streamFile);

export default router;
