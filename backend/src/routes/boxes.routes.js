import { Router } from 'express';
import * as boxesController from '../controllers/boxes.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protect all box routes with authentication
router.use(authenticate);

router.get('/', boxesController.list);
router.post('/', boxesController.create);
router.get('/:id', boxesController.getOne);
router.patch('/:id', boxesController.update);
router.patch('/:id/status', boxesController.updateStatus);
router.delete('/:id', boxesController.deleteBox);
router.get('/:id/qr', boxesController.getQRCode);

export default router;
