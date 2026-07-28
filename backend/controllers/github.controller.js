import userModel from '../models/user.model.js';
import jwt from 'jsonwebtoken';

// Exchange OAuth code for GitHub access token
export const githubCallback = async (req, res) => {
    const { code, state } = req.query; // state holds the user JWT
    if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?error=No_code_provided`);
    }

    try {
        // Step 1: Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code
            })
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?error=Failed_to_retrieve_access_token`);
        }

        // Step 2: Fetch user profile from GitHub
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'NeuraChat-App'
            }
        });

        const githubUser = await userResponse.json();

        // Step 3: Decode state JWT to identify logged-in user
        const decoded = jwt.verify(state, process.env.JWT_SECRET);
        if (!decoded || !decoded.email) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?error=Invalid_state_session`);
        }

        // Step 4: Save credentials to User model
        await userModel.findOneAndUpdate(
            { email: decoded.email },
            {
                github: {
                    accessToken,
                    username: githubUser.login,
                    id: githubUser.id.toString()
                }
            }
        );

        // Redirect back to frontend profile
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?success=github_connected`);
    } catch (error) {
        console.error('GitHub OAuth error:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?error=Auth_failed`);
    }
};

// Manually link GitHub account using a Personal Access Token (PAT)
export const linkPersonalToken = async (req, res) => {
    const { token } = req.body;
    if (!token || !token.trim()) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token.trim()}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'NeuraChat-App'
            }
        });

        if (!response.ok) {
            return res.status(401).json({ error: 'Invalid or expired GitHub token' });
        }

        const githubUser = await response.json();

        // Find and update current user
        const loggedInUser = await userModel.findOneAndUpdate(
            { email: req.user.email },
            {
                github: {
                    accessToken: token.trim(),
                    username: githubUser.login,
                    id: githubUser.id.toString()
                }
            },
            { new: true }
        );

        res.status(200).json({
            message: 'GitHub account connected successfully!',
            github: {
                username: githubUser.login
            }
        });
    } catch (error) {
        console.error('Error linking personal token:', error);
        res.status(500).json({ error: 'Internal server error while verifying token' });
    }
};

// Disconnect GitHub account
export const disconnectGithub = async (req, res) => {
    try {
        await userModel.findOneAndUpdate(
            { email: req.user.email },
            {
                github: {
                    accessToken: null,
                    username: null,
                    id: null
                }
            }
        );
        res.status(200).json({ message: 'GitHub account disconnected successfully.' });
    } catch (error) {
        console.error('Disconnect GitHub error:', error);
        res.status(500).json({ error: 'Failed to disconnect GitHub account' });
    }
};
