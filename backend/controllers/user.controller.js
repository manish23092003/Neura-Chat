import userModel from '../models/user.model.js';
import * as userService from '../services/user.service.js';
import { validationResult } from 'express-validator';
import redisClient from '../services/redis.service.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const createUserController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await userService.createUser(req.body);
        const token = user.generateJWT();

        res.cookie('token', token, COOKIE_OPTIONS);

        const userObj = user.toObject ? user.toObject() : { ...user._doc };
        delete userObj.password;

        return res.status(201).json({ user: userObj, token });
    } catch (error) {
        return res.status(400).json({ message: error.message || 'Registration failed' });
    }
};

export const loginController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ errors: 'Email and password are required' });
        }

        const user = await userModel.findOne({ email: email.toLowerCase().trim() }).select('+password');
        if (!user) {
            return res.status(401).json({ errors: 'Invalid credentials' });
        }

        const isMatch = await user.isValidPassword(password);
        if (!isMatch) {
            return res.status(401).json({ errors: 'Invalid credentials' });
        }

        const token = user.generateJWT();
        res.cookie('token', token, COOKIE_OPTIONS);

        const userObj = user.toObject ? user.toObject() : { ...user._doc };
        delete userObj.password;

        return res.status(200).json({ user: userObj, token });
    } catch (err) {
        console.error('[Auth Error] Login error:', err.message);
        return res.status(500).json({ message: 'Authentication error occurred' });
    }
};

export const profileController = async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({ user });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch user profile' });
    }
};

export const logoutController = async (req, res) => {
    try {
        const authHeader = req.headers?.authorization;
        const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        const token = req.cookies?.token || bearerToken;

        if (token && redisClient && typeof redisClient.set === 'function') {
            try {
                await redisClient.set(token, 'logout', 'EX', 60 * 60 * 24);
            } catch (redisErr) {
                console.warn('[Logout] Redis token revocation failed:', redisErr.message);
            }
        }

        res.cookie('token', '', { ...COOKIE_OPTIONS, expires: new Date(0), maxAge: 0 });
        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('[Auth Error] Logout error:', err.message);
        return res.status(500).json({ message: 'Failed to complete logout' });
    }
};

export const getAllUsersController = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        if (!loggedInUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const allUsers = await userService.getAllUsers({ userId: loggedInUser._id });
        return res.status(200).json({ users: allUsers });
    } catch (err) {
        console.error('[User Controller] Error in getAllUsers:', err.message);
        return res.status(500).json({ error: 'Failed to retrieve users' });
    }
};

export const updateProfileController = async (req, res) => {
    try {
        const { name, bio, avatar } = req.body;

        const sanitizedUpdate = {};
        if (typeof name === 'string') sanitizedUpdate.name = name.slice(0, 50).trim();
        if (typeof bio === 'string') sanitizedUpdate.bio = bio.slice(0, 200).trim();
        if (typeof avatar === 'string') sanitizedUpdate.avatar = avatar.slice(0, 500);

        const updatedUser = await userModel.findOneAndUpdate(
            { email: req.user.email },
            sanitizedUpdate,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ user: updatedUser, message: 'Profile updated successfully' });
    } catch (err) {
        console.error('[User Controller] Profile update error:', err.message);
        return res.status(400).json({ error: 'Failed to update profile' });
    }
};

export const changePasswordController = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both current password and new password are required' });
        }

        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters long' });
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
        
        return res.status(200).json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('[User Controller] Change password error:', err.message);
        return res.status(500).json({ error: 'Failed to update password' });
    }
};

export const deleteAccountController = async (req, res) => {
    try {
        const authHeader = req.headers?.authorization;
        const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        const token = req.cookies?.token || bearerToken;
        
        const deletedUser = await userModel.findOneAndDelete({ email: req.user.email });
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (token && redisClient && typeof redisClient.set === 'function') {
            try {
                await redisClient.set(token, 'logout', 'EX', 60 * 60 * 24);
            } catch (redisErr) {
                console.warn('[Delete Account] Redis token revocation failed:', redisErr.message);
            }
        }
        
        res.cookie('token', '', { ...COOKIE_OPTIONS, expires: new Date(0), maxAge: 0 });
        return res.status(200).json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error('[User Controller] Delete account error:', err.message);
        return res.status(500).json({ error: 'Failed to delete account' });
    }
};

export const googleAuthController = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential || typeof credential !== 'string') {
            return res.status(400).json({ message: 'Valid Google credential token is required' });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(500).json({ message: 'Google authentication is not configured on the server' });
        }

        // Step 1: Verify the Google ID token server-side
        let ticket;
        try {
            ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
        } catch (verifyErr) {
            return res.status(401).json({ message: 'Invalid or expired Google credential' });
        }

        const payload = ticket.getPayload();

        // Step 2: Validate required claims
        if (!payload || !payload.email) {
            return res.status(401).json({ message: 'Google account does not have an email address' });
        }

        if (!payload.email_verified) {
            return res.status(401).json({ message: 'Google email is not verified' });
        }

        // Step 3: Extract only verified claims
        const googleId = payload.sub;
        const googleEmail = payload.email.toLowerCase().trim();
        const googleName = (payload.name || '').slice(0, 50);
        const googlePicture = (payload.picture || '').slice(0, 500);

        // Step 4: Find existing user
        let user = await userModel.findOne({ 'google.id': googleId });

        if (!user) {
            user = await userModel.findOne({ email: googleEmail });
        }

        if (user) {
            // Step 5: Existing user — securely link/update Google identity
            user.google = {
                id: googleId,
                email: googleEmail,
                name: googleName,
                avatar: googlePicture,
            };

            if (!user.avatar) user.avatar = googlePicture;
            if (!user.name) user.name = googleName;

            await user.save();
        } else {
            // Step 6: New user — create with Google identity
            try {
                user = await userModel.create({
                    email: googleEmail,
                    name: googleName,
                    avatar: googlePicture,
                    google: {
                        id: googleId,
                        email: googleEmail,
                        name: googleName,
                        avatar: googlePicture,
                    },
                });
            } catch (createErr) {
                if (createErr.code === 11000) {
                    user = await userModel.findOne({ email: googleEmail });
                    if (!user) {
                        return res.status(500).json({ message: 'Account creation failed. Please try again.' });
                    }
                } else {
                    throw createErr;
                }
            }
        }

        const token = user.generateJWT();
        res.cookie('token', token, COOKIE_OPTIONS);

        const userObj = user.toObject ? user.toObject() : { ...user._doc };
        delete userObj.password;

        return res.status(200).json({ user: userObj, token });
    } catch (err) {
        console.error('[Google Auth Error]:', err.message);
        return res.status(500).json({ message: 'Google authentication failed. Please try again.' });
    }
};
