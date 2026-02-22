import { Router } from 'express';
import { body } from 'express-validator';
import * as projectController from '../controllers/project.controller.js';
import * as authMiddleWare from '../middleware/auth.middleware.js';

const router = Router();


router.post('/create',
    authMiddleWare.authUser,
    body('name').isString().withMessage('Name is required'),
    projectController.createProject
)

router.get('/all',
    authMiddleWare.authUser,
    projectController.getAllProject
)

router.put('/add-user',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('users').isArray({ min: 1 }).withMessage('Users must be an array of strings').bail()
        .custom((users) => users.every(user => typeof user === 'string')).withMessage('Each user must be a string'),
    projectController.addUserToProject
)

router.get('/get-project/:projectId',
    authMiddleWare.authUser,
    projectController.getProjectById
)

router.put('/update-file-tree',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('fileTree').isObject().withMessage('File tree is required'),
    projectController.updateFileTree
)

router.delete('/:projectId',
    authMiddleWare.authUser,
    projectController.deleteProject
)


// Update project metadata (description and tags)
router.put('/update-metadata',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    projectController.updateProjectMetadata
)

// Toggle archive status
router.put('/:projectId/toggle-archive',
    authMiddleWare.authUser,
    projectController.toggleArchive
)

// Toggle favorite status
router.put('/:projectId/toggle-favorite',
    authMiddleWare.authUser,
    projectController.toggleFavorite
)

// Task management routes
router.post('/:projectId/tasks',
    authMiddleWare.authUser,
    body('title').isString().withMessage('Task title is required'),
    projectController.createTask
)

router.put('/:projectId/tasks/:taskId',
    authMiddleWare.authUser,
    projectController.updateTask
)

router.delete('/:projectId/tasks/:taskId',
    authMiddleWare.authUser,
    projectController.deleteTask
)

router.put('/:projectId/tasks/:taskId/toggle',
    authMiddleWare.authUser,
    projectController.toggleTaskCompletion
)

router.put('/:projectId/clear-chat', authMiddleWare.authUser, projectController.clearChat);


export default router;