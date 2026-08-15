import projectModel from '../models/project.model.js';
import * as projectService from '../services/project.service.js';
import userModel from '../models/user.model.js';
import messageModel from '../models/message.model.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

// Helper to retrieve authenticated database user safely
const getAuthUser = async (req) => {
    if (!req.user || !req.user.email) return null;
    return await userModel.findOne({ email: req.user.email });
};

export const createProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, description, tags, role, createGitRepo, isPrivate } = req.body;
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        const newProject = await projectService.createProject({
            name: typeof name === 'string' ? name.trim() : name,
            userId: loggedInUser._id,
            description: typeof description === 'string' ? description.trim() : '',
            tags: Array.isArray(tags) ? tags : [],
            role,
            createGitRepo: !!createGitRepo,
            isPrivate: isPrivate !== false
        });

        return res.status(201).json(newProject);
    } catch (err) {
        console.error('[Project Controller] Create error:', err.message);
        return res.status(400).json({ message: err.message || 'Failed to create project' });
    }
};

export const getAllProject = async (req, res) => {
    try {
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        const allUserProjects = await projectService.getAllProjectByUserId({
            userId: loggedInUser._id
        });

        return res.status(200).json({ projects: allUserProjects });
    } catch (err) {
        console.error('[Project Controller] getAllProject error:', err.message);
        return res.status(500).json({ error: 'Failed to retrieve projects' });
    }
};

export const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        await projectService.deleteProject({
            projectId,
            userId: loggedInUser._id
        });

        return res.status(200).json({ message: 'Project deleted successfully' });
    } catch (err) {
        console.error('[Project Controller] deleteProject error:', err.message);
        return res.status(400).json({ message: err.message || 'Failed to delete project' });
    }
};

export const addUserToProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId, users } = req.body;
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        const project = await projectService.addUsersToProject({
            projectId,
            users,
            userId: loggedInUser._id
        });

        return res.status(200).json({
            project,
            message: 'Invitations sent successfully!'
        });
    } catch (err) {
        console.error('[Project Controller] addUserToProject error:', err.message);
        return res.status(400).json({ error: err.message || 'Failed to invite users' });
    }
};

export const getPendingInvitations = async (req, res) => {
    try {
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        const invitations = await projectService.getPendingInvitations({
            userId: loggedInUser._id
        });

        return res.status(200).json({ invitations });
    } catch (err) {
        console.error('[Project Controller] getPendingInvitations error:', err.message);
        return res.status(500).json({ error: 'Failed to retrieve invitations' });
    }
};

export const respondToInvitation = async (req, res) => {
    try {
        const { projectId, accept, role } = req.body;
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        const project = await projectService.respondToInvitation({
            projectId,
            userId: loggedInUser._id,
            accept: !!accept,
            role
        });

        return res.status(200).json({
            project,
            message: accept ? 'Invitation accepted successfully!' : 'Invitation declined.'
        });
    } catch (err) {
        console.error('[Project Controller] respondToInvitation error:', err.message);
        return res.status(400).json({ error: err.message || 'Failed to respond to invitation' });
    }
};

export const getProjectById = async (req, res) => {
    const { projectId } = req.params;
    try {
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        const project = await projectService.getProjectById({
            projectId,
            userId: loggedInUser._id
        });

        return res.status(200).json({ project });
    } catch (err) {
        console.error('[Project Controller] getProjectById error:', err.message);
        return res.status(err.statusCode || 404).json({ error: 'Project not found or unauthorized' });
    }
};

export const getMessages = async (req, res) => {
    const { projectId } = req.params;
    try {
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid projectId' });
        }

        // Verify membership before returning project messages
        const isMember = await projectModel.findOne({ _id: projectId, users: loggedInUser._id });
        if (!isMember) {
            return res.status(404).json({ error: 'Project not found or unauthorized' });
        }

        const messages = await messageModel.find({ project: projectId }).sort({ timestamp: 1 });
        return res.status(200).json({ messages });
    } catch (err) {
        console.error('[Project Controller] getMessages error:', err.message);
        return res.status(500).json({ error: 'Failed to retrieve messages' });
    }
};

export const updateFileTree = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId, fileTree, workspaceId } = req.body;
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        const project = await projectService.updateFileTree({
            projectId,
            fileTree,
            workspaceId,
            userId: loggedInUser._id
        });

        return res.status(200).json({ project });
    } catch (err) {
        console.error('[Project Controller] updateFileTree error:', err.message);
        return res.status(err.statusCode || 400).json({ error: err.message || 'Failed to update file tree' });
    }
};

// Update project metadata
export const updateProjectMetadata = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId, description, tags } = req.body;
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        const project = await projectService.updateProjectMetadata({
            projectId,
            description,
            tags,
            userId: loggedInUser._id
        });

        return res.status(200).json({ project });
    } catch (err) {
        console.error('[Project Controller] updateProjectMetadata error:', err.message);
        return res.status(400).json({ error: err.message || 'Failed to update metadata' });
    }
};

// Toggle archive
export const toggleArchive = async (req, res) => {
    try {
        const { projectId } = req.params;
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        const project = await projectService.toggleArchiveProject({
            projectId,
            userId: loggedInUser._id
        });

        return res.status(200).json({ project });
    } catch (err) {
        console.error('[Project Controller] toggleArchive error:', err.message);
        return res.status(400).json({ error: err.message || 'Failed to toggle archive' });
    }
};

// Toggle favorite
export const toggleFavorite = async (req, res) => {
    try {
        const { projectId } = req.params;
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        const project = await projectService.toggleFavoriteProject({
            projectId,
            userId: loggedInUser._id
        });

        return res.status(200).json({ project });
    } catch (err) {
        console.error('[Project Controller] toggleFavorite error:', err.message);
        return res.status(400).json({ error: err.message || 'Failed to toggle favorite' });
    }
};

// Create task
export const createTask = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId } = req.params;
        const taskData = req.body;
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        const project = await projectService.createTask({
            projectId,
            taskData,
            userId: loggedInUser._id
        });

        return res.status(201).json({ project });
    } catch (err) {
        console.error('[Project Controller] createTask error:', err.message);
        return res.status(400).json({ error: err.message || 'Failed to create task' });
    }
};

// Update task
export const updateTask = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;
        const updates = req.body;
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        const project = await projectService.updateTask({
            projectId,
            taskId,
            updates,
            userId: loggedInUser._id
        });

        return res.status(200).json({ project });
    } catch (err) {
        console.error('[Project Controller] updateTask error:', err.message);
        return res.status(400).json({ error: err.message || 'Failed to update task' });
    }
};

// Delete task
export const deleteTask = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        const project = await projectService.deleteTask({
            projectId,
            taskId,
            userId: loggedInUser._id
        });

        return res.status(200).json({ project });
    } catch (err) {
        console.error('[Project Controller] deleteTask error:', err.message);
        return res.status(400).json({ error: err.message || 'Failed to delete task' });
    }
};

// Toggle task completion
export const toggleTaskCompletion = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        const project = await projectService.toggleTaskCompletion({
            projectId,
            taskId,
            userId: loggedInUser._id
        });

        return res.status(200).json({ project });
    } catch (err) {
        console.error('[Project Controller] toggleTaskCompletion error:', err.message);
        return res.status(400).json({ error: err.message || 'Failed to toggle task' });
    }
};

// ── Invite Link Controllers ──────────────────────────────────────────────────

export const generateInvite = async (req, res) => {
    try {
        const { projectId } = req.params;
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        const result = await projectService.generateInviteToken({
            projectId,
            userId: loggedInUser._id
        });

        return res.status(200).json(result);
    } catch (err) {
        console.error('[Project Controller] generateInvite error:', err.message);
        return res.status(400).json({ error: err.message || 'Failed to generate invite' });
    }
};

export const getInvitePreview = async (req, res) => {
    try {
        const { token } = req.params;
        const preview = await projectService.getProjectByInviteToken({ token });
        return res.status(200).json(preview);
    } catch (err) {
        return res.status(400).json({ error: err.message || 'Invalid or expired invite link' });
    }
};

export const joinByInvite = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { token, role } = req.body;
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        const result = await projectService.joinProjectByToken({
            token,
            userId: loggedInUser._id,
            role
        });

        return res.status(200).json({
            message: result.alreadyMember ? 'You are already a member of this project' : 'Joined project successfully!',
            project: result.project,
            alreadyMember: result.alreadyMember
        });
    } catch (err) {
        console.error('[Project Controller] joinByInvite error:', err.message);
        return res.status(400).json({ error: err.message || 'Failed to join project' });
    }
};

// ── Workspace Metadata Operations ──────────────────────────────────────────────

export const createWorkspaceMetadata = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { _id, name, framework, fileTree } = req.body;
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid projectId' });
        }

        const project = await projectModel.findOneAndUpdate(
            { _id: projectId, users: loggedInUser._id },
            {
                $push: {
                    workspaces: {
                        _id: typeof _id === 'string' ? _id : new mongoose.Types.ObjectId().toString(),
                        name: typeof name === 'string' ? name.slice(0, 50) : 'Workspace',
                        framework: typeof framework === 'string' ? framework.slice(0, 30) : 'react',
                        fileTree: (fileTree && typeof fileTree === 'object') ? fileTree : {},
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ error: 'Project not found or unauthorized' });
        }

        return res.status(200).json({ project });
    } catch (err) {
        console.error('[Project Controller] createWorkspaceMetadata error:', err.message);
        return res.status(400).json({ error: 'Failed to create workspace' });
    }
};

export const updateWorkspaceMetadata = async (req, res) => {
    try {
        const { projectId, workspaceId } = req.params;
        const updates = req.body;
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid projectId' });
        }

        const setFields = { "workspaces.$.updatedAt": new Date() };
        if (typeof updates.name === 'string') setFields["workspaces.$.name"] = updates.name.slice(0, 50);
        if (typeof updates.isPinned === 'boolean') setFields["workspaces.$.isPinned"] = updates.isPinned;
        if (typeof updates.isArchived === 'boolean') setFields["workspaces.$.isArchived"] = updates.isArchived;

        const project = await projectModel.findOneAndUpdate(
            { _id: projectId, users: loggedInUser._id, "workspaces._id": workspaceId },
            { $set: setFields },
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ error: 'Project or workspace not found or unauthorized' });
        }

        return res.status(200).json({ project });
    } catch (err) {
        console.error('[Project Controller] updateWorkspaceMetadata error:', err.message);
        return res.status(400).json({ error: 'Failed to update workspace' });
    }
};

export const deleteWorkspaceMetadata = async (req, res) => {
    try {
        const { projectId, workspaceId } = req.params;
        const loggedInUser = await getAuthUser(req);
        if (!loggedInUser) return res.status(401).json({ error: 'Unauthorized user' });

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid projectId' });
        }

        const project = await projectModel.findOneAndUpdate(
            { _id: projectId, users: loggedInUser._id },
            { $pull: { workspaces: { _id: workspaceId } } },
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ error: 'Project not found or unauthorized' });
        }

        return res.status(200).json({ project });
    } catch (err) {
        console.error('[Project Controller] deleteWorkspaceMetadata error:', err.message);
        return res.status(400).json({ error: 'Failed to delete workspace' });
    }
};