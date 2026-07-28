import { Router } from 'express';
import * as githubController from '../controllers/github.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

// OAuth callback (GitHub redirects here)
router.get('/callback', githubController.githubCallback);

// Link via Personal Access Token
router.post('/link-token', authMiddleware.authUser, githubController.linkPersonalToken);

// Disconnect GitHub account
router.post('/disconnect', authMiddleware.authUser, githubController.disconnectGithub);

export default router;
