import projectModel from '../models/project.model.js';
import * as projectService from '../services/project.service.js';
import userModel from '../models/user.model.js';
import { validationResult } from 'express-validator';


export const createProject = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { name, description, tags } = req.body;
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        const userId = loggedInUser._id;

        const newProject = await projectService.createProject({
            name,
            userId,
            description,
            tags
        });

        res.status(201).json(newProject);

    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
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
        res.status(400).send(err.message)
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

// Clear chat
export const clearChat = async (req, res) => {
    try {
        const { projectId } = req.params;
        const loggedInUser = await userModel.findOne({ email: req.user.email });

        const project = await projectService.clearChat({
            projectId,
            userId: loggedInUser._id
        });

        return res.status(200).json({ project });

    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
}