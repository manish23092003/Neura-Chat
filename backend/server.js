import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import path from 'path';
import projectModel from './models/project.model.js';
import { generateResult, extractFileContent } from './services/ai.service.js';
import connect from './db/db.js';

connect();

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
        next(error)
    }

})


io.on('connection', socket => {
    socket.roomId = socket.project._id.toString()


    console.log('a user connected');



    socket.join(socket.roomId);

    socket.on('project-message', async data => {

        const message = data.message;

        const aiIsPresentInMessage = message.includes('@ai');
        socket.broadcast.to(socket.roomId).emit('project-message', data)

        try {
            await projectModel.findByIdAndUpdate(socket.roomId, {
                $push: {
                    messages: {
                        sender: data.sender._id, // Save ObjectId for proper population
                        message: data.message,
                        timestamp: data.timestamp
                    }
                }
            })
        } catch (err) {
            console.log("Error saving message:", err)
        }

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
                const aiMessage = {
                    message: result,
                    sender: {
                        _id: 'ai',
                        email: 'AI'
                    },
                    timestamp: new Date().toISOString()
                }

                io.to(socket.roomId).emit('project-message', aiMessage)

                await projectModel.findByIdAndUpdate(socket.roomId, {
                    $push: {
                        messages: {
                            sender: 'ai',
                            message: result,
                            timestamp: aiMessage.timestamp
                        }
                    }
                })
            } catch (err) {
                console.error("Critical AI Error:", err);
                const errorMessage = "AI request failed. Please try again later. (Error: " + err.message + ")";
                io.to(socket.roomId).emit('project-message', {
                    message: errorMessage,
                    sender: {
                        _id: 'ai',
                        email: 'AI'
                    }
                })
                try {
                    await projectModel.findByIdAndUpdate(socket.roomId, {
                        $push: {
                            messages: {
                                sender: 'ai',
                                message: errorMessage,
                                timestamp: new Date().toISOString()
                            }
                        }
                    })
                } catch (saveErr) {
                    console.error("Failed to save AI error message:", saveErr);
                }
            }
            return
        }


    })

    // Handle file messages
    socket.on('project-file-message', async data => {
        console.log('File message received:', data);
        socket.broadcast.to(socket.roomId).emit('project-file-message', data);

        try {
            await projectModel.findByIdAndUpdate(socket.roomId, {
                $push: {
                    messages: {
                        sender: data.sender._id || data.sender,
                        message: data.message,
                        files: data.files,
                        timestamp: data.timestamp
                    }
                }
            })
        } catch (err) {
            console.log("Error saving file message:", err)
        }

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
                const aiMessage = {
                    message: result,
                    sender: {
                        _id: 'ai',
                        email: 'AI'
                    },
                    timestamp: new Date().toISOString()
                }

                io.to(socket.roomId).emit('project-message', aiMessage)

                await projectModel.findByIdAndUpdate(socket.roomId, {
                    $push: {
                        messages: {
                            sender: 'ai',
                            message: result,
                            timestamp: aiMessage.timestamp
                        }
                    }
                })
            } catch (err) {
                console.error('Error processing file for AI:', err);
                const errorMessage = "AI request failed to analyze file. (Error: " + err.message + ")";
                io.to(socket.roomId).emit('project-message', {
                    message: errorMessage,
                    sender: {
                        _id: 'ai',
                        email: 'AI'
                    }
                })
                try {
                    await projectModel.findByIdAndUpdate(socket.roomId, {
                        $push: {
                            messages: {
                                sender: 'ai',
                                message: errorMessage,
                                timestamp: new Date().toISOString()
                            }
                        }
                    })
                } catch (saveErr) {
                    console.error("Failed to save AI File error message:", saveErr);
                }
            }
        }
    })

    // Handle message reactions
    socket.on('message-reaction', data => {
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

    socket.on('project-chat-cleared', data => {
        socket.broadcast.to(socket.roomId).emit('project-chat-cleared', data)
    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
        socket.leave(socket.roomId)
    });
});




server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})