import mongoose from 'mongoose';

// Convert hierarchical file tree to flat path-content map
export const flattenFileTree = (tree, prefix = '') => {
    let files = {};
    if (!tree || typeof tree !== 'object') return files;

    for (const [key, value] of Object.entries(tree)) {
        const currentPath = prefix ? `${prefix}/${key}` : key;
        if (value.file) {
            files[currentPath] = value.file.contents || '';
        } else if (value.directory) {
            const nested = flattenFileTree(value.directory, currentPath);
            files = { ...files, ...nested };
        }
    }
    return files;
};

// Create a new GitHub Repository
export const createGitHubRepo = async (accessToken, repoName, isPrivate = true) => {
    try {
        const response = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'NeuraChat-App'
            },
            body: JSON.stringify({
                name: repoName.replace(/\s+/g, '-').toLowerCase(),
                description: 'Created automatically by NeuraChat AI Platform',
                private: isPrivate,
                auto_init: true // creates a README.md initially
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to create GitHub repository');
        }

        const data = await response.json();
        return {
            name: data.name,
            fullName: data.full_name,
            url: data.html_url,
            owner: data.owner.login
        };
    } catch (error) {
        console.error('Error creating GitHub repository:', error);
        throw error;
    }
};

// Push or update a single file on GitHub
export const pushFileToGitHub = async (accessToken, owner, repo, filePath, content, commitMessage = 'Update file') => {
    try {
        // Step 1: Check if file exists to get its SHA
        let sha = null;
        const checkResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'NeuraChat-App'
            }
        });

        if (checkResponse.ok) {
            const fileData = await checkResponse.json();
            sha = fileData.sha;
        }

        // Step 2: Push/Create file
        const pushResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'NeuraChat-App'
            },
            body: JSON.stringify({
                message: commitMessage,
                content: Buffer.from(content).toString('base64'),
                sha: sha || undefined
            })
        });

        if (!pushResponse.ok) {
            const errData = await pushResponse.json();
            throw new Error(errData.message || `Failed to push ${filePath}`);
        }
        return true;
    } catch (error) {
        console.error(`Error pushing file ${filePath} to GitHub:`, error);
        return false;
    }
};

// Delete a single file on GitHub
export const deleteFileFromGitHub = async (accessToken, owner, repo, filePath, commitMessage = 'Delete file') => {
    try {
        // Step 1: Check if file exists to get its SHA
        const checkResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'NeuraChat-App'
            }
        });

        if (!checkResponse.ok) {
            // File doesn't exist, nothing to delete
            return true;
        }

        const fileData = await checkResponse.json();
        const sha = fileData.sha;

        // Step 2: Delete file
        const deleteResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'NeuraChat-App'
            },
            body: JSON.stringify({
                message: commitMessage,
                sha: sha
            })
        });

        if (!deleteResponse.ok) {
            const errData = await deleteResponse.json();
            throw new Error(errData.message || `Failed to delete ${filePath}`);
        }
        return true;
    } catch (error) {
        console.error(`Error deleting file ${filePath} from GitHub:`, error);
        return false;
    }
};

// Sync whole file tree changes in background
export const syncTreeToGitHub = async (accessToken, owner, repo, oldTree, newTree) => {
    const oldFlat = flattenFileTree(oldTree);
    const newFlat = flattenFileTree(newTree);

    // Find added or modified files
    for (const [filePath, content] of Object.entries(newFlat)) {
        if (oldFlat[filePath] !== content) {
            const success = await pushFileToGitHub(accessToken, owner, repo, filePath, content, `Sync: Update ${filePath}`);
            if (!success) {
                console.warn(`Failed to sync update for file ${filePath}`);
            }
        }
    }

    // Find deleted files
    for (const filePath of Object.keys(oldFlat)) {
        if (newFlat[filePath] === undefined) {
            const success = await deleteFileFromGitHub(accessToken, owner, repo, filePath, `Sync: Delete ${filePath}`);
            if (!success) {
                console.warn(`Failed to sync deletion for file ${filePath}`);
            }
        }
    }
};
