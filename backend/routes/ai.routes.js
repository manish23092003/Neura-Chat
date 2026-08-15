import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
import * as authMiddleWare from '../middleware/auth.middleware.js';

const router = Router();

// Protect AI endpoint with authentication
router.get('/get-result', authMiddleWare.authUser, aiController.getResult);

export default router;