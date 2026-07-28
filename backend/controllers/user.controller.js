import userModel from '../models/user.model.js';
import * as userService from '../services/user.service.js';
import { validationResult } from 'express-validator';
import redisClient from '../services/redis.service.js';
import crypto from 'crypto';


export const createUserController = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const user = await userService.createUser(req.body);

        const token = await user.generateJWT();

        delete user._doc.password;

        res.status(201).json({ user, token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const loginController = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { email, password } = req.body;

        const user = await userModel.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                errors: 'Invalid credentials'
            })
        }

        const isMatch = await user.isValidPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                errors: 'Invalid credentials'
            })
        }

        const token = await user.generateJWT();

        delete user._doc.password;

        res.status(200).json({ user, token });


    } catch (err) {

        console.log(err);

        res.status(400).json({ message: err.message });
    }
}

export const profileController = async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email });
        res.status(200).json({
            user
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

export const logoutController = async (req, res) => {
    try {

        const token = req.cookies.token || req.headers.authorization.split(' ')[1];

        redisClient.set(token, 'logout', 'EX', 60 * 60 * 24);

        res.status(200).json({
            message: 'Logged out successfully'
        });


    } catch (err) {
        console.log(err);
        res.status(400).json({ message: err.message });
    }
}

export const getAllUsersController = async (req, res) => {
    try {

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        })

        const allUsers = await userService.getAllUsers({ userId: loggedInUser._id });

        return res.status(200).json({
            users: allUsers
        })

    } catch (err) {

        console.log(err)

        res.status(400).json({ error: err.message })

    }
}

// Forgot password controllers removed as per user request

export const updateProfileController = async (req, res) => {
    try {
        const { name, bio, avatar } = req.body

        const updatedUser = await userModel.findOneAndUpdate(
            { email: req.user.email },
            { name, bio, avatar },
            { new: true, runValidators: true }
        )

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' })
        }

        res.status(200).json({ user: updatedUser, message: 'Profile updated successfully' })
    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }
}

export const changePasswordController = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both current password and new password are required' });
        }
        
        const user = await userModel.findOne({ email: req.user.email }).select('+password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const isMatch = await user.isValidPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }
        
        const hashedPassword = await userModel.hashPassword(newPassword);
        user.password = hashedPassword;
        await user.save();
        
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
}

export const deleteAccountController = async (req, res) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
        
        const deletedUser = await userModel.findOneAndDelete({ email: req.user.email });
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (token) {
            redisClient.set(token, 'logout', 'EX', 60 * 60 * 24);
        }
        
        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
}
