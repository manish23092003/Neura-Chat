import projectModel from '../models/project.model.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import userModel from '../models/user.model.js';
import { createGitHubRepo, syncTreeToGitHub } from './github.service.js';

export const createProject = async ({
    name, userId, description, tags, role, createGitRepo = false, isPrivate = true
}) => {
    if (!name) {
        throw new Error('Name is required')
    }
    if (!userId) {
        throw new Error('UserId is required')
    }

    let githubRepoName = null;
    let githubRepoUrl = null;
    let githubSyncStatus = null;

    if (createGitRepo) {
        const user = await userModel.findById(userId);
        if (user && user.github && user.github.accessToken) {
            try {
                const repoData = await createGitHubRepo(user.github.accessToken, name, isPrivate);
                githubRepoName = repoData.fullName;
                githubRepoUrl = repoData.url;
                githubSyncStatus = 'synced';
            } catch (err) {
                console.error('Failed to create repository on GitHub:', err.message);
                githubSyncStatus = 'error';
            }
        }
    }

    let project;
    try {
        const roles = {};
        if (role) {
            roles[userId.toString()] = role;
        }

        project = await projectModel.create({
            name,
            users: [userId],
            roles,
            description: description || '',
            tags: tags || [],
            githubRepoName,
            githubRepoUrl,
            githubSyncStatus
        });
    } catch (error) {
        if (error.code === 11000) {
            throw new Error('Project name already exists');
        }
        throw error;
    }

    return project;

}


export const getAllProjectByUserId = async ({ userId }) => {
    if (!userId) {
        throw new Error('UserId is required')
    }

    const allUserProjects = await projectModel.find({
        users: userId
    }).populate('users').populate('favoritedBy')

    return allUserProjects
}

export const deleteProject = async ({ projectId, userId }) => {
    if (!projectId) {
        throw new Error('ProjectId is required')
    }

    if (!userId) {
        throw new Error('UserId is required')
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid projectId')
    }

    const project = await projectModel.findById(projectId)

    if (!project) {
        throw new Error('Project not found')
    }

    // Check if user is authorized to delete (must be a member of the project)
    if (!project.users.includes(userId)) {
        throw new Error('Unauthorized to delete this project')
    }

    await projectModel.findByIdAndDelete(projectId)

    return { message: 'Project deleted successfully' }
}


export const addUsersToProject = async ({ projectId, users, userId }) => {

    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!users) {
        throw new Error("users are required")
    }

    if (!Array.isArray(users) || users.some(userId => !mongoose.Types.ObjectId.isValid(userId))) {
        throw new Error("Invalid userId(s) in users array")
    }

    if (!userId) {
        throw new Error("userId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid userId")
    }


    const project = await projectModel.findOne({
        _id: projectId,
        users: userId
    })

    if (!project) {
        throw new Error("User not belong to this project")
    }

    const updatedProject = await projectModel.findOneAndUpdate({
        _id: projectId
    }, {
        $addToSet: {
            pendingUsers: {
                $each: users
            }
        }
    }, {
        new: true
    })

    return updatedProject

}

export const getPendingInvitations = async ({ userId }) => {
    if (!userId) {
        throw new Error("userId is required")
    }

    // Find all projects where this user is in the pendingUsers list
    const invitations = await projectModel.find({
        pendingUsers: userId
    }).populate('users', 'email name') // populate the members who invited them

    return invitations;
}

export const respondToInvitation = async ({ projectId, userId, accept, role }) => {
    if (!projectId || !userId) {
        throw new Error("projectId and userId are required")
    }

    const project = await projectModel.findById(projectId)
    if (!project) {
        throw new Error("Project not found")
    }

    // Verify user actually has a pending invitation
    const hasInvitation = project.pendingUsers.some(id => id.toString() === userId.toString())
    if (!hasInvitation) {
        throw new Error("No pending invitation found for this user in this project")
    }

    let updatedProject;
    if (accept) {
        // Move from pendingUsers to users
        const updateOps = {
            $pull: { pendingUsers: userId },
            $addToSet: { users: userId }
        }
        if (role) {
            updateOps.$set = {
                [`roles.${userId.toString()}`]: role
            }
        }
        updatedProject = await projectModel.findByIdAndUpdate(projectId, updateOps, { new: true })
    } else {
        // Just remove from pendingUsers
        updatedProject = await projectModel.findByIdAndUpdate(projectId, {
            $pull: { pendingUsers: userId }
        }, { new: true })
    }

    return updatedProject;
}

export const getProjectById = async ({ projectId, userId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    const query = { _id: projectId }
    if (userId) {
        query.users = userId
    }

    const project = await projectModel.findOne(query).populate('users')
    if (!project) {
        const error = new Error("Project not found or unauthorized")
        error.statusCode = 404
        throw error
    }

    return project;
}

export const updateFileTree = async ({ projectId, fileTree, workspaceId, userId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!fileTree) {
        throw new Error("fileTree is required")
    }

    // Verify user membership before performing any write operations
    if (userId) {
        const isMember = await projectModel.findOne({ _id: projectId, users: userId });
        if (!isMember) {
            const error = new Error("Project not found or unauthorized");
            error.statusCode = 404;
            throw error;
        }
    }

    // Load existing project to get the old file tree
    const existingProject = await projectModel.findById(projectId);
    const oldFileTree = existingProject ? (existingProject.fileTree || {}) : {};

    let project;

    if (workspaceId) {
        // Try updating existing workspace subdocument in MongoDB
        const updateRes = await projectModel.updateOne(
            { _id: projectId, "workspaces._id": workspaceId },
            { $set: { "workspaces.$.fileTree": fileTree, "workspaces.$.updatedAt": new Date() } }
        );

        // If workspace was not found in array yet, add it
        if (updateRes.matchedCount === 0) {
            await projectModel.updateOne(
                { _id: projectId },
                {
                    $push: {
                        workspaces: {
                            _id: workspaceId,
                            name: 'Workspace',
                            fileTree,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            isPinned: false,
                            isArchived: false,
                        }
                    }
                }
            );
        }
        project = await projectModel.findById(projectId);
    } else {
        project = await projectModel.findOneAndUpdate({
            _id: projectId
        }, {
            $set: { fileTree }
        }, {
            new: true
        });
    }

    if (project && project.githubRepoName && project.githubSyncStatus !== 'disabled') {
        const projectUsers = project.users || [];
        const userWithGit = projectUsers.find(u => u.github && u.github.accessToken);
        
        if (userWithGit) {
            const accessToken = userWithGit.github.accessToken;
            const [owner, repo] = project.githubRepoName.split('/');
            
            // Set status to syncing in DB
            await projectModel.findByIdAndUpdate(projectId, { githubSyncStatus: 'syncing' });
            
            // Run background task
            syncTreeToGitHub(accessToken, owner, repo, oldFileTree, fileTree)
                .then(async () => {
                    await projectModel.findByIdAndUpdate(projectId, { githubSyncStatus: 'synced' });
                })
                .catch(async (err) => {
                    console.error('Background GitHub sync failed:', err);
                    await projectModel.findByIdAndUpdate(projectId, { githubSyncStatus: 'error' });
                });
        }
    }

    return project;
}

// Update project metadata (description and tags)
export const updateProjectMetadata = async ({ projectId, description, tags, userId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!userId) {
        throw new Error("userId is required")
    }

    // Verify user belongs to project
    const project = await projectModel.findOne({
        _id: projectId,
        users: userId
    })

    if (!project) {
        throw new Error("User not authorized to update this project")
    }

    const updateData = {}
    if (description !== undefined) updateData.description = description
    if (tags !== undefined) updateData.tags = tags

    const updatedProject = await projectModel.findOneAndUpdate(
        { _id: projectId },
        updateData,
        { new: true }
    ).populate('users')

    return updatedProject
}

// Toggle archive status
export const toggleArchiveProject = async ({ projectId, userId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!userId) {
        throw new Error("userId is required")
    }

    const project = await projectModel.findOne({
        _id: projectId,
        users: userId
    })

    if (!project) {
        throw new Error("User not authorized to archive this project")
    }

    const updatedProject = await projectModel.findOneAndUpdate(
        { _id: projectId },
        { isArchived: !project.isArchived },
        { new: true }
    ).populate('users')

    return updatedProject
}

// Toggle favorite status
export const toggleFavoriteProject = async ({ projectId, userId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!userId) {
        throw new Error("userId is required")
    }

    const project = await projectModel.findById(projectId)

    if (!project) {
        throw new Error("Project not found")
    }

    const isFavorited = project.favoritedBy.includes(userId)

    const updatedProject = await projectModel.findOneAndUpdate(
        { _id: projectId },
        isFavorited
            ? { $pull: { favoritedBy: userId } }
            : { $addToSet: { favoritedBy: userId } },
        { new: true }
    ).populate('users').populate('favoritedBy')

    return updatedProject
}

// Create task
export const createTask = async ({ projectId, userId, taskData }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!userId) {
        throw new Error("userId is required")
    }

    if (!taskData || !taskData.title) {
        throw new Error("Task title is required")
    }

    // Verify user belongs to project
    const project = await projectModel.findOne({
        _id: projectId,
        users: userId
    })

    if (!project) {
        throw new Error("User not authorized to add tasks to this project")
    }

    const newTask = {
        title: taskData.title,
        completed: taskData.completed || false,
        assignedTo: taskData.assignedTo || null,
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate || null,
        createdAt: new Date()
    }

    const updatedProject = await projectModel.findOneAndUpdate(
        { _id: projectId },
        { $push: { tasks: newTask } },
        { new: true }
    ).populate('users').populate('tasks.assignedTo')

    return updatedProject
}

// Update task
export const updateTask = async ({ projectId, taskId, updates, userId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!taskId) {
        throw new Error("taskId is required")
    }

    if (!userId) {
        throw new Error("userId is required")
    }

    // Verify user belongs to project
    const project = await projectModel.findOne({
        _id: projectId,
        users: userId
    })

    if (!project) {
        throw new Error("User not authorized to update tasks in this project")
    }

    const updateFields = {}
    if (updates.title !== undefined) updateFields['tasks.$.title'] = updates.title
    if (updates.completed !== undefined) updateFields['tasks.$.completed'] = updates.completed
    if (updates.assignedTo !== undefined) updateFields['tasks.$.assignedTo'] = updates.assignedTo
    if (updates.priority !== undefined) updateFields['tasks.$.priority'] = updates.priority
    if (updates.dueDate !== undefined) updateFields['tasks.$.dueDate'] = updates.dueDate

    const updatedProject = await projectModel.findOneAndUpdate(
        { _id: projectId, 'tasks._id': taskId },
        { $set: updateFields },
        { new: true }
    ).populate('users').populate('tasks.assignedTo')

    return updatedProject
}

// Delete task
export const deleteTask = async ({ projectId, taskId, userId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!taskId) {
        throw new Error("taskId is required")
    }

    if (!userId) {
        throw new Error("userId is required")
    }

    // Verify user belongs to project
    const project = await projectModel.findOne({
        _id: projectId,
        users: userId
    })

    if (!project) {
        throw new Error("User not authorized to delete tasks from this project")
    }

    const updatedProject = await projectModel.findOneAndUpdate(
        { _id: projectId },
        { $pull: { tasks: { _id: taskId } } },
        { new: true }
    ).populate('users').populate('tasks.assignedTo')

    return updatedProject
}

// Toggle task completion
export const toggleTaskCompletion = async ({ projectId, taskId, userId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!taskId) {
        throw new Error("taskId is required")
    }

    if (!userId) {
        throw new Error("userId is required")
    }

    // Verify user belongs to project
    const project = await projectModel.findOne({
        _id: projectId,
        users: userId
    })

    if (!project) {
        throw new Error("User not authorized to update tasks in this project")
    }

    // Find the task and toggle its completion status
    const task = project.tasks.id(taskId)
    if (!task) {
        throw new Error("Task not found")
    }

    const updatedProject = await projectModel.findOneAndUpdate(
        { _id: projectId, 'tasks._id': taskId },
        { $set: { 'tasks.$.completed': !task.completed } },
        { new: true }
    ).populate('users').populate('tasks.assignedTo')

    return updatedProject
}

// ── Invite Link ──────────────────────────────────────────────────────────────

/**
 * Generate (or regenerate) an invite token for a project.
 * Any existing member can do this — it invalidates the previous token.
 */
export const generateInviteToken = async ({ projectId, userId }) => {
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid projectId')
    }
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid userId')
    }

    // Verify the requesting user belongs to the project
    const project = await projectModel.findOne({ _id: projectId, users: userId })
    if (!project) {
        throw new Error('User not authorized for this project')
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await projectModel.findByIdAndUpdate(projectId, {
        inviteToken: token,
        inviteExpiresAt: expiresAt
    })

    return { token, expiresAt }
}

/**
 * Get safe public project info from an invite token (no auth required).
 * Only returns: name, description, memberCount, createdAt — nothing sensitive.
 */
export const getProjectByInviteToken = async ({ token }) => {
    if (!token) throw new Error('Token is required')

    const project = await projectModel.findOne({ inviteToken: token }).populate('users', 'email name')
    if (!project) throw new Error('Invalid invite link')

    if (!project.inviteExpiresAt || project.inviteExpiresAt < new Date()) {
        throw new Error('Invite link has expired')
    }

    return {
        _id: project._id,
        name: project.name,
        description: project.description,
        memberCount: project.users.length,
        members: project.users.map(u => ({ email: u.email, name: u.name })),
        createdAt: project.createdAt,
        expiresAt: project.inviteExpiresAt
    }
}

/**
 * Add the authenticated user to a project via invite token.
 */
export const joinProjectByToken = async ({ token, userId, role }) => {
    if (!token) throw new Error('Token is required')
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid userId')
    }

    const project = await projectModel.findOne({ inviteToken: token })
    if (!project) throw new Error('Invalid invite link')

    if (!project.inviteExpiresAt || project.inviteExpiresAt < new Date()) {
        throw new Error('Invite link has expired')
    }

    // Check if user is already a member
    const alreadyMember = project.users.some(u => u.toString() === userId.toString())
    if (alreadyMember) {
        return { alreadyMember: true, project }
    }

    const updateOps = {
        $addToSet: { users: userId }
    }
    if (role) {
        updateOps.$set = {
            [`roles.${userId.toString()}`]: role
        }
    }

    const updatedProject = await projectModel.findByIdAndUpdate(
        project._id,
        updateOps,
        { new: true }
    ).populate('users')

    return { alreadyMember: false, project: updatedProject }
}