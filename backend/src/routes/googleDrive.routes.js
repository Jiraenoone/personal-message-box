import { Router } from 'express';
import * as driveController from '../controllers/googleDrive.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// OAuth initiation & status (authenticated)
router.get('/connect', authenticate, driveController.connect);
router.get('/status', authenticate, driveController.getStatus);
router.post('/disconnect', authenticate, driveController.disconnect);

// OAuth redirect callback from Google (public GET callback, validated via state param)
router.get('/callback', driveController.callback);

export default router;
