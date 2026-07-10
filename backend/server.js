import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import projectModel from './models/project.model.js';
import messageModel from './models/message.model.js';
import { generateResult, extractFileContent } from './services/ai.service.js';

const port = process.env.PORT || 3000;



const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});


io.use(async (socket, next) => {

    try {

        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid projectId'));
        }


        socket.project = await projectModel.findById(projectId);

        if (!socket.project) {
            return next(new Error('Project not found'));
        }

        if (!token) {
            return next(new Error('Authentication error'))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return next(new Error('Authentication error'))
        }


        socket.user = decoded;
        next();

    } catch (error) {
        console.error('Socket middleware error:', error.message);
        next(error)
    }
})


io.on('connection', socket => {
    if (!socket.project) {
        console.log('Project not found for socket, disconnecting');
        return socket.disconnect();
    }
    
    socket.roomId = socket.project._id.toString()
    console.log('a user connected to project:', socket.roomId);



    socket.join(socket.roomId);

    socket.on('project-message', async data => {

        const message = data.message;
        const aiIsPresentInMessage = message.includes('@ai');

        // Save incoming user message to database
        try {
            await messageModel.create({
                _id: data._id, // use client generated UUID
                message: data.message,
                sender: data.sender,
                project: socket.roomId,
                timestamp: data.timestamp || new Date()
            });
        } catch(e) {
            console.error('Failed to save message to DB', e);
        }

        socket.broadcast.to(socket.roomId).emit('project-message', data)

        if (aiIsPresentInMessage) {
            const prompt = message.replace('@ai', '');

            try {
                // Check if there's a file attached to analyze
                let fileContext = null
                if (data.fileUrl) {
                    // Extract filename from URL (format: /files/filename)
                    const filename = data.fileUrl.split('/').pop()
                    const filePath = path.join(process.cwd(), 'uploads', filename)
                    fileContext = await extractFileContent(filePath)
                }

                const result = await generateResult(prompt, fileContext);
                const aiMessageData = {
                    _id: crypto.randomUUID(),
                    message: result,
                    sender: {
                        _id: 'ai',
                        email: 'AI'
                    },
                    timestamp: new Date().toISOString(),
                    reactions: []
                };

                try {
                    await messageModel.create({
                        _id: aiMessageData._id,
                        message: aiMessageData.message,
                        sender: aiMessageData.sender,
                        project: socket.roomId,
                        timestamp: aiMessageData.timestamp
                    });
                } catch(e) {
                    console.error('Failed to save AI message', e);
                }

                io.to(socket.roomId).emit('project-message', aiMessageData)
            } catch (err) {
                io.to(socket.roomId).emit('project-message', {
                    message: "AI request failed. Please try again later. (Error: " + err.message + ")",
                    sender: {
                        _id: 'ai',
                        email: 'AI'
                    }
                })
            }
            return
        }


    })

    // Handle file messages
    socket.on('project-file-message', async data => {
        console.log('File message received:', data);

        // Save incoming file message to database
        try {
            await messageModel.create({
                _id: data._id,
                message: data.message,
                sender: data.sender,
                project: socket.roomId,
                files: data.files,
                timestamp: data.timestamp || new Date()
            });
        } catch(e) {
            console.error('Failed to save file message to DB', e);
        }

        socket.broadcast.to(socket.roomId).emit('project-file-message', data);

        // Check if AI is mentioned in the file message
        if (data.message && data.message.includes('@ai')) {
            const prompt = data.message.replace('@ai', '');
            console.log('AI mentioned in file message. Prompt:', prompt);

            try {
                // Extract file content for AI analysis
                let fileContext = null
                if (data.fileUrl) {
                    console.log('File URL found:', data.fileUrl);
                    const filename = data.fileUrl.split('/').pop()
                    const filePath = path.join(process.cwd(), 'uploads', filename)
                    console.log('Attempting to read file from:', filePath);

                    // Check if file exists
                    if (!fs.existsSync(filePath)) {
                        console.error('File not found at path:', filePath);
                        throw new Error(`File not found: ${filename}`)
                    }

                    fileContext = await extractFileContent(filePath)
                    console.log('File context extracted:', fileContext ? 'Success' : 'Failed', fileContext?.type);
                } else {
                    console.log('No fileUrl in data. Data keys:', Object.keys(data));
                }

                const result = await generateResult(prompt, fileContext);
                const aiMessageData = {
                    _id: crypto.randomUUID(),
                    message: result,
                    sender: {
                        _id: 'ai',
                        email: 'AI'
                    },
                    timestamp: new Date().toISOString(),
                    reactions: []
                };

                try {
                    await messageModel.create({
                        _id: aiMessageData._id,
                        message: aiMessageData.message,
                        sender: aiMessageData.sender,
                        project: socket.roomId,
                        timestamp: aiMessageData.timestamp
                    });
                } catch(e) {
                    console.error('Failed to save AI file analysis message', e);
                }

                io.to(socket.roomId).emit('project-message', aiMessageData)
            } catch (err) {
                console.error('Error processing file for AI:', err);
                io.to(socket.roomId).emit('project-message', {
                    message: "AI request failed to analyze file. (Error: " + err.message + ")",
                    sender: {
                        _id: 'ai',
                        email: 'AI'
                    }
                })
            }
        }
    })

    // Handle message reactions
    socket.on('message-reaction', async data => {
        try {
            if (data.messageId) {
                await messageModel.findByIdAndUpdate(data.messageId, {
                    $set: { reactions: data.reactions }
                });
            }
        } catch(e) {
            console.error('Failed to save reaction', e);
        }
        socket.broadcast.to(socket.roomId).emit('message-reaction', data)
    })

    // Handle typing indicators
    socket.on('user-typing', data => {
        if (data.typing) {
            socket.broadcast.to(socket.roomId).emit('user-typing-start', data)
        } else {
            socket.broadcast.to(socket.roomId).emit('user-typing-stop', data)
        }
    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
        socket.leave(socket.roomId)
    });
});




server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})