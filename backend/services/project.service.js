import projectModel from '../models/project.model.js';
import mongoose from 'mongoose';

export const createProject = async ({
    name, userId, description, tags
}) => {
    if (!name) {
        throw new Error('Name is required')
    }
    if (!userId) {
        throw new Error('UserId is required')
    }

    let project;
    try {
        project = await projectModel.create({
            name,
            users: [userId],
            description: description || '',
            tags: tags || [],
            fileTree: {}
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

    console.log(project)

    if (!project) {
        throw new Error("User not belong to this project")
    }

    const updatedProject = await projectModel.findOneAndUpdate({
        _id: projectId
    }, {
        $addToSet: {
            users: {
                $each: users
            }
        }
    }, {
        new: true
    })

    return updatedProject



}

export const getProjectById = async ({ projectId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    // First, get the project and populate users
    const project = await projectModel.findOne({
        _id: projectId
    }).populate('users')

    if (!project) return project;

    // Now we need to populate message senders
    // We'll do this manually since sender can be either ObjectId or 'ai' string
    const projectObj = project.toObject();

    if (projectObj.messages && projectObj.messages.length > 0) {
        // Collect all unique sender IDs that aren't 'ai'
        const senderIds = [...new Set(
            projectObj.messages
                .map(msg => msg.sender)
                .filter(sender => sender !== 'ai' && mongoose.Types.ObjectId.isValid(sender))
        )];

        // Fetch all sender users in one query
        const senderUsers = await mongoose.model('user').find({
            _id: { $in: senderIds }
        }).select('_id email');

        // Create a map for quick lookup
        const senderMap = new Map(
            senderUsers.map(user => [user._id.toString(), user])
        );

        // Map messages with populated sender data
        projectObj.messages = projectObj.messages.map(msg => {
            // Handle AI messages
            if (msg.sender === 'ai') {
                return {
                    ...msg,
                    sender: {
                        _id: 'ai',
                        email: 'AI Assistant'
                    }
                }
            }

            // Handle user messages
            const senderId = msg.sender.toString();
            const senderUser = senderMap.get(senderId);

            if (senderUser) {
                return {
                    ...msg,
                    sender: {
                        _id: senderUser._id,
                        email: senderUser.email
                    }
                }
            }

            // Fallback for deleted or not found users
            return {
                ...msg,
                sender: {
                    _id: msg.sender,
                    email: 'Unknown User'
                }
            }
        })
    }

    return projectObj;
}

export const updateFileTree = async ({ projectId, fileTree }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!fileTree) {
        throw new Error("fileTree is required")
    }

    const project = await projectModel.findOneAndUpdate({
        _id: projectId
    }, {
        fileTree
    }, {
        new: true
    })

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

// Clear chat
export const clearChat = async ({ projectId, userId }) => {
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

    if (!project.users.includes(userId)) {
        throw new Error("User not authorized to clear chat in this project")
    }

    // Collect all files created by AI
    const fileKeysToDelete = [];
    project.messages.forEach(msg => {
        if (msg.sender === 'ai') {
            try {
                const messageObj = JSON.parse(msg.message);
                if (messageObj && messageObj.fileTree) {
                    Object.keys(messageObj.fileTree).forEach(key => {
                        fileKeysToDelete.push(key);
                    });
                }
            } catch (e) {
                // Ignore messages that aren't valid JSON or don't have fileTree
            }
        }
    });

    // Remove these files from the current fileTree
    const currentFileTree = project.fileTree || {};
    fileKeysToDelete.forEach(key => {
        if (currentFileTree[key]) {
            delete currentFileTree[key];
        }
    });

    // Update the project
    const updatedProject = await projectModel.findOneAndUpdate(
        { _id: projectId },
        {
            $set: {
                messages: [],
                fileTree: currentFileTree
            }
        },
        { new: true }
    ).populate('users')

    return updatedProject
}