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
const io = new Server(server, {
    cors: {
        // Restrict to the frontend origin in production; fall back to wildcard in dev
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
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
        if (!token)          return next(new Error('Authentication error'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded)        return next(new Error('Authentication error'));

        socket.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
});

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

                const result = await generateResult(prompt, fileContext);
                const aiMsg = {
                    _id: crypto.randomUUID(),
                    message: result,
                    sender: { _id: 'ai', email: 'AI' },
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

                const result = await generateResult(prompt, fileContext);
                const aiMsg = {
                    _id: crypto.randomUUID(),
                    message: result,
                    sender: { _id: 'ai', email: 'AI' },
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