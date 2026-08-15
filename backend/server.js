import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto';
import projectModel from './models/project.model.js';
import messageModel from './models/message.model.js';
import FileModel from './models/file.model.js';
import { generateResult, extractFileContent } from './services/ai.service.js';

const port = process.env.PORT || 3000;

const server = http.createServer(app);
const allowedOrigins = [
    'https://neura-chat-omega.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/$/, '')] : [])
];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    // Enable compression for socket payloads
    perMessageDeflate: {
        zlibDeflateOptions: { level: 6 },
    },
});

// ── Per-project AI request queue ──────────────────────────────────────────────
// Prevents parallel AI calls for the same project. Each project ID maps to the
// in-flight Promise (or null when idle).
const aiQueue = new Map(); // projectId → Promise | null

// ── Per-user rate limiting (AI requests) ─────────────────────────────────────
// Tracks request timestamps per user to enforce max 10 AI requests/minute.
const userRateLimits = new Map(); // userId → number[]

const AI_RATE_LIMIT = 10;          // max requests
const AI_RATE_WINDOW_MS = 60_000;  // per 60 seconds

function isRateLimited(userId) {
    const now = Date.now();
    const timestamps = (userRateLimits.get(userId) || []).filter(
        (ts) => now - ts < AI_RATE_WINDOW_MS
    );
    if (timestamps.length >= AI_RATE_LIMIT) {
        userRateLimits.set(userId, timestamps);
        return true;
    }
    timestamps.push(now);
    userRateLimits.set(userId, timestamps);
    return false;
}

// Helper to sanitize AI generated file trees and reject directory traversal
function sanitizeFileTree(tree) {
    if (!tree || typeof tree !== 'object') return {};
    const sanitized = {};
    for (const key of Object.keys(tree)) {
        if (!key || typeof key !== 'string') continue;
        // Block path traversal and absolute paths
        if (key.includes('..') || key.startsWith('/') || key.startsWith('\\') || key.includes(':')) {
            console.warn(`[Security Alert] Blocked suspicious fileTree key: "${key}"`);
            continue;
        }
        const node = tree[key];
        if (node && node.file && typeof node.file.contents === 'string') {
            sanitized[key] = {
                file: {
                    contents: node.file.contents
                }
            };
        } else if (node && (node.directory || typeof node === 'object')) {
            const subTree = node.directory || node;
            sanitized[key] = {
                directory: sanitizeFileTree(subTree)
            };
        }
    }
    return sanitized;
}

// ── Socket authentication middleware ──────────────────────────────────────────
io.use(async (socket, next) => {
    try {
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid projectId'));
        }

        socket.project = await projectModel.findById(projectId);
        if (!socket.project) return next(new Error('Project not found'));
        if (!token)          return next(new Error('Authentication error: Missing token'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.email) return next(new Error('Authentication error: Invalid token'));

        // Look up the database user and verify project membership
        const userDoc = await mongoose.model('user').findOne({ email: decoded.email });
        if (!userDoc) {
            return next(new Error('Authentication error: User account not found'));
        }

        const isMember = socket.project.users.some(u => u.toString() === userDoc._id.toString());
        if (!isMember) {
            console.warn(`[Security Alert] Unauthorized socket access attempt: User ${userDoc.email} -> Project ${projectId}`);
            return next(new Error('Forbidden: You are not an authorized member of this project'));
        }

        socket.user = {
            _id: userDoc._id.toString(),
            email: userDoc.email,
            name: userDoc.name || ''
        };
        next();
    } catch (error) {
        next(error);
    }
});

// Helper to recursively traverse and format the workspace files and contents as text
function getWorkspaceContextText(tree, currentPath = '') {
    let contextText = '';
    if (!tree || typeof tree !== 'object') return contextText;
    for (const key of Object.keys(tree)) {
        const node = tree[key];
        const newPath = currentPath ? `${currentPath}/${key}` : key;
        if (node && node.file) {
            contextText += `\n--- File: ${newPath} ---\n${node.file.contents || ''}\n`;
        } else if (node) {
            const subTree = node.directory || node;
            contextText += getWorkspaceContextText(subTree, newPath);
        }
    }
    return contextText;
}

// Enhance user prompt with current project's workspace files
async function enhancePromptWithWorkspace(projectId, workspaceId, prompt, clientFileTree = null) {
    try {
        let treeToUse = clientFileTree;
        if (workspaceId) {
            // Strictly fetch fileTree belonging ONLY to this specific workspaceId
            const dbProject = await projectModel.findById(projectId);
            if (dbProject && dbProject.workspaces && dbProject.workspaces.length > 0) {
                const wsDoc = dbProject.workspaces.find(w => w._id === workspaceId);
                if (wsDoc && wsDoc.fileTree && Object.keys(wsDoc.fileTree).length > 0) {
                    treeToUse = wsDoc.fileTree;
                } else if (!clientFileTree) {
                    treeToUse = {};
                }
            }
        } else if (!treeToUse || Object.keys(treeToUse).length === 0) {
            const dbProject = await projectModel.findById(projectId);
            if (dbProject) {
                treeToUse = dbProject.fileTree;
            }
        }

        if (treeToUse && Object.keys(treeToUse).length > 0) {
            const workspaceFilesText = getWorkspaceContextText(treeToUse);
            return `Current Workspace Files:\n${workspaceFilesText}\n\nUser request: ${prompt}\n\nTask: Fulfill the user request and output the updated/new workspace files in the standard JSON format.`;
        }
    } catch (err) {
        console.error('[AI Context] Failed to load project fileTree:', err.message);
    }
    return prompt;
}

// ── Connection handler ────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    if (!socket.project) {
        return socket.disconnect();
    }

    socket.roomId = socket.project._id.toString();
    socket.join(socket.roomId);

    // ── Project message ─────────────────────────────────────────────────────
    socket.on('project-message', async (data) => {
        const messageText = data.message || '';
        const workspaceId = data.workspaceId || '';
        const workspaceFileTree = data.workspaceFileTree || null;

        // Persist user message
        try {
            await messageModel.create({
                _id: data._id,
                message: data.message,
                sender: data.sender,
                project: socket.roomId,
                timestamp: data.timestamp || new Date(),
            });
        } catch (e) {
            console.error('[Socket] Failed to save message:', e.message);
        }

        // Broadcast to other clients in the room
        socket.broadcast.to(socket.roomId).emit('project-message', data);

        // ── AI trigger ────────────────────────────────────────────────────
        if (!messageText.includes('@ai')) return;

        // Rate limit check
        const userId = socket.user?._id?.toString() || socket.user?.id;
        if (isRateLimited(userId)) {
            socket.emit('project-message', {
                _id: crypto.randomUUID(),
                message: JSON.stringify({ text: '⚠️ Rate limit reached. Please wait before sending more AI requests (max 10/minute).' }),
                sender: { _id: 'ai', email: 'AI' },
                workspaceId,
                timestamp: new Date().toISOString(),
                reactions: [],
            });
            return;
        }

        // Queue AI request for this project (prevents parallel requests)
        const currentQueue = aiQueue.get(socket.roomId) ?? Promise.resolve();
        const nextQueue = currentQueue.then(async () => {
            const prompt = messageText.replace('@ai', '').trim();

            try {
                let fileContext = null;
                const fileUrl = data.fileUrl || data.files?.[0]?.url;
                if (fileUrl) {
                    const filename = fileUrl.split('/').pop();
                    const fileRecord = await FileModel.findOne({ filename });
                    if (fileRecord) {
                        fileContext = await extractFileContent(
                            fileRecord.data,
                            fileRecord.originalName,
                            fileRecord.mimetype
                        );
                    }
                }

                const enhancedPrompt = await enhancePromptWithWorkspace(socket.roomId, workspaceId, prompt, workspaceFileTree);
                const result = await generateResult(enhancedPrompt, fileContext, workspaceId);

                // Auto-persist AI generated fileTree to MongoDB workspace subdocument
                try {
                    let cleaned = (result || '').trim();
                    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
                    else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
                    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
                    const parsed = JSON.parse(cleaned.trim());
                    if (parsed.fileTree && workspaceId) {
                        const safeTree = sanitizeFileTree(parsed.fileTree);
                        const updateRes = await projectModel.updateOne(
                            { _id: socket.roomId, "workspaces._id": workspaceId },
                            { $set: { "workspaces.$.fileTree": safeTree, "workspaces.$.updatedAt": new Date() } }
                        );
                        if (updateRes.matchedCount === 0) {
                            await projectModel.updateOne(
                                { _id: socket.roomId },
                                {
                                    $push: {
                                        workspaces: {
                                            _id: workspaceId,
                                            name: 'Workspace',
                                            fileTree: safeTree,
                                            createdAt: new Date(),
                                            updatedAt: new Date(),
                                            isPinned: false,
                                            isArchived: false,
                                        }
                                    }
                                }
                            );
                        }
                    }
                } catch (_) { /* non-JSON output */ }

                const aiMsg = {
                    _id: crypto.randomUUID(),
                    message: result,
                    sender: { _id: 'ai', email: 'AI' },
                    workspaceId,
                    timestamp: new Date().toISOString(),
                    reactions: [],
                };

                try {
                    await messageModel.create({
                        _id: aiMsg._id,
                        message: aiMsg.message,
                        sender: aiMsg.sender,
                        project: socket.roomId,
                        timestamp: aiMsg.timestamp,
                    });
                } catch (e) {
                    console.error('[Socket] Failed to save AI message:', e.message);
                }

                io.to(socket.roomId).emit('project-message', aiMsg);
            } catch (err) {
                io.to(socket.roomId).emit('project-message', {
                    _id: crypto.randomUUID(),
                    message: JSON.stringify({ text: `AI request failed: ${err.message}` }),
                    sender: { _id: 'ai', email: 'AI' },
                    workspaceId,
                    timestamp: new Date().toISOString(),
                    reactions: [],
                });
            }
        });

        aiQueue.set(socket.roomId, nextQueue);
        // Clean up queue entry when done
        nextQueue.finally(() => {
            if (aiQueue.get(socket.roomId) === nextQueue) {
                aiQueue.delete(socket.roomId);
            }
        });
    });

    // ── File message ────────────────────────────────────────────────────────
    socket.on('project-file-message', async (data) => {
        const workspaceId = data.workspaceId || '';
        const workspaceFileTree = data.workspaceFileTree || null;

        // Persist file message
        try {
            await messageModel.create({
                _id: data._id,
                message: data.message,
                sender: data.sender,
                project: socket.roomId,
                files: data.files,
                timestamp: data.timestamp || new Date(),
            });
        } catch (e) {
            console.error('[Socket] Failed to save file message:', e.message);
        }

        socket.broadcast.to(socket.roomId).emit('project-file-message', data);

        // AI trigger in file messages
        if (!data.message?.includes('@ai')) return;

        const userId = socket.user?._id?.toString() || socket.user?.id;
        if (isRateLimited(userId)) return;

        const currentQueue = aiQueue.get(socket.roomId) ?? Promise.resolve();
        const nextQueue = currentQueue.then(async () => {
            const prompt = data.message.replace('@ai', '').trim();
            try {
                let fileContext = null;
                const fileUrl = data.fileUrl || data.files?.[0]?.url;
                if (fileUrl) {
                    const filename = fileUrl.split('/').pop();
                    const fileRecord = await FileModel.findOne({ filename });
                    if (fileRecord) {
                        fileContext = await extractFileContent(
                            fileRecord.data,
                            fileRecord.originalName,
                            fileRecord.mimetype
                        );
                    }
                }

                const enhancedPrompt = await enhancePromptWithWorkspace(socket.roomId, workspaceId, prompt, workspaceFileTree);
                const result = await generateResult(enhancedPrompt, fileContext, workspaceId);
                const aiMsg = {
                    _id: crypto.randomUUID(),
                    message: result,
                    sender: { _id: 'ai', email: 'AI' },
                    workspaceId,
                    timestamp: new Date().toISOString(),
                    reactions: [],
                };

                try {
                    await messageModel.create({
                        _id: aiMsg._id,
                        message: aiMsg.message,
                        sender: aiMsg.sender,
                        project: socket.roomId,
                        timestamp: aiMsg.timestamp,
                    });
                } catch (e) {
                    console.error('[Socket] Failed to save AI file message:', e.message);
                }

                io.to(socket.roomId).emit('project-message', aiMsg);
            } catch (err) {
                io.to(socket.roomId).emit('project-message', {
                    _id: crypto.randomUUID(),
                    message: JSON.stringify({ text: `AI file analysis failed: ${err.message}` }),
                    sender: { _id: 'ai', email: 'AI' },
                    workspaceId,
                    timestamp: new Date().toISOString(),
                    reactions: [],
                });
            }
        });

        aiQueue.set(socket.roomId, nextQueue);
        nextQueue.finally(() => {
            if (aiQueue.get(socket.roomId) === nextQueue) aiQueue.delete(socket.roomId);
        });
    });

    // ── Reactions ───────────────────────────────────────────────────────────
    socket.on('message-reaction', async (data) => {
        try {
            if (data.messageId) {
                await messageModel.findByIdAndUpdate(data.messageId, {
                    $set: { reactions: data.reactions },
                });
            }
        } catch (e) {
            console.error('[Socket] Failed to save reaction:', e.message);
        }
        socket.broadcast.to(socket.roomId).emit('message-reaction', data);
    });

    // ── Typing indicators ───────────────────────────────────────────────────
    socket.on('user-typing', (data) => {
        socket.broadcast.to(socket.roomId).emit(
            data.typing ? 'user-typing-start' : 'user-typing-stop',
            data
        );
    });

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
        socket.leave(socket.roomId);
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});