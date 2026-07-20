import projectModel from '../models/project.model.js';
import * as projectService from '../services/project.service.js';
import userModel from '../models/user.model.js';
import messageModel from '../models/message.model.js';
import { validationResult } from 'express-validator';


export const createProject = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { name, description, tags, role } = req.body;
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        const userId = loggedInUser._id;

        const newProject = await projectService.createProject({
            name,
            userId,
            description,
            tags,
            role
        });

        res.status(201).json(newProject);

    } catch (err) {
        console.log(err);
        res.status(400).json({ message: err.message });
    }



}

export const getAllProject = async (req, res) => {
    try {

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        })

        const allUserProjects = await projectService.getAllProjectByUserId({
            userId: loggedInUser._id
        })

        return res.status(200).json({
            projects: allUserProjects
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }
}

export const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params
        const loggedInUser = await userModel.findOne({ email: req.user.email })

        await projectService.deleteProject({
            projectId,
            userId: loggedInUser._id
        })

        return res.status(200).json({
            message: 'Project deleted successfully'
        })
    } catch (err) {
        console.log(err)
        res.status(400).json({ message: err.message })
    }
}


export const addUserToProject = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { projectId, users } = req.body

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        })


        const project = await projectService.addUsersToProject({
            projectId,
            users,
            userId: loggedInUser._id
        })

        return res.status(200).json({
            project,
            message: 'Invitations sent successfully!'
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }


}

export const getPendingInvitations = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({
            email: req.user.email
        })

        const invitations = await projectService.getPendingInvitations({
            userId: loggedInUser._id
        })

        return res.status(200).json({
            invitations
        })
    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }
}

export const respondToInvitation = async (req, res) => {
    try {
        const { projectId, accept } = req.body
        const loggedInUser = await userModel.findOne({
            email: req.user.email
        })

        const project = await projectService.respondToInvitation({
            projectId,
            userId: loggedInUser._id,
            accept: !!accept
        })

        return res.status(200).json({
            project,
            message: accept ? 'Invitation accepted successfully!' : 'Invitation declined.'
        })
    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }
}

export const getProjectById = async (req, res) => {

    const { projectId } = req.params;

    try {

        const project = await projectService.getProjectById({ projectId });

        return res.status(200).json({
            project
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }

}

export const getMessages = async (req, res) => {
    const { projectId } = req.params;
    try {
        const messages = await messageModel.find({ project: projectId }).sort({ timestamp: 1 });
        return res.status(200).json({
            messages
        });
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
}

export const updateFileTree = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { projectId, fileTree } = req.body;

        const project = await projectService.updateFileTree({
            projectId,
            fileTree
        })

        return res.status(200).json({
            project
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }

}

// Update project metadata
export const updateProjectMetadata = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId, description, tags } = req.body;
        const loggedInUser = await userModel.findOne({ email: req.user.email });

        const project = await projectService.updateProjectMetadata({
            projectId,
            description,
            tags,
            userId: loggedInUser._id
        });

        return res.status(200).json({ project });

    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
}

// Toggle archive
export const toggleArchive = async (req, res) => {
    try {
        const { projectId } = req.params;
        const loggedInUser = await userModel.findOne({ email: req.user.email });

        const project = await projectService.toggleArchiveProject({
            projectId,
            userId: loggedInUser._id
        });

        return res.status(200).json({ project });

    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
}

// Toggle favorite
export const toggleFavorite = async (req, res) => {
    try {
        const { projectId } = req.params;
        const loggedInUser = await userModel.findOne({ email: req.user.email });

        const project = await projectService.toggleFavoriteProject({
            projectId,
            userId: loggedInUser._id
        });

        return res.status(200).json({ project });

    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
}

// Create task
export const createTask = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId } = req.params;
        const taskData = req.body;
        const loggedInUser = await userModel.findOne({ email: req.user.email });

        const project = await projectService.createTask({
            projectId,
            userId: loggedInUser._id,
            taskData
        });

        return res.status(200).json({ project });

    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
}

// Update task
export const updateTask = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId, taskId } = req.params;
        const updates = req.body;
        const loggedInUser = await userModel.findOne({ email: req.user.email });

        const project = await projectService.updateTask({
            projectId,
            taskId,
            updates,
            userId: loggedInUser._id
        });

        return res.status(200).json({ project });

    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
}

// Delete task
export const deleteTask = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;
        const loggedInUser = await userModel.findOne({ email: req.user.email });

        const project = await projectService.deleteTask({
            projectId,
            taskId,
            userId: loggedInUser._id
        });

        return res.status(200).json({ project });

    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
}

// ── Invite Link Controllers ───────────────────────────────────────────────────

// POST /projects/:projectId/invite/generate  (auth required)
export const generateInvite = async (req, res) => {
    try {
        const { projectId } = req.params
        const loggedInUser = await userModel.findOne({ email: req.user.email })

        const { token, expiresAt } = await projectService.generateInviteToken({
            projectId,
            userId: loggedInUser._id
        })

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
        const inviteUrl = `${frontendUrl}/invite/${token}`

        return res.status(200).json({ inviteUrl, token, expiresAt })
    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }
}

// GET /projects/invite/:token/preview  (no auth required)
export const getInvitePreview = async (req, res) => {
    try {
        const { token } = req.params
        const projectInfo = await projectService.getProjectByInviteToken({ token })
        return res.status(200).json({ project: projectInfo })
    } catch (err) {
        console.log(err)
        const status = err.message === 'Invite link has expired' ? 410 : 404
        res.status(status).json({ error: err.message })
    }
}

// POST /projects/invite/join  (auth required)  body: { token }
export const joinByInvite = async (req, res) => {
    try {
        const { token } = req.body
        const loggedInUser = await userModel.findOne({ email: req.user.email })

        const result = await projectService.joinProjectByToken({
            token,
            userId: loggedInUser._id
        })

        return res.status(200).json({
            alreadyMember: result.alreadyMember,
            project: result.project
        })
    } catch (err) {
        console.log(err)
        const status = err.message === 'Invite link has expired' ? 410 : 400
        res.status(status).json({ error: err.message })
    }
}

// Toggle task completion
export const toggleTaskCompletion = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;
        const loggedInUser = await userModel.findOne({ email: req.user.email });

        const project = await projectService.toggleTaskCompletion({
            projectId,
            taskId,
            userId: loggedInUser._id
        });

        return res.status(200).json({ project });

    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
}