import { Router } from 'express';
import * as messagesController from '../controllers/messages.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireBoxOwner } from '../middleware/ownershipCheck.js';

// Mounted at /api/boxes/:id/messages
const router = Router({ mergeParams: true });

router.use(authenticate, requireBoxOwner);

router.get('/', messagesController.list);
router.delete('/', messagesController.deleteAll);
router.get('/:msgId', messagesController.getOne);
router.delete('/:msgId', messagesController.deleteOne);

export default router;
