import { Router } from 'express';
import upload from '../config/multer.config.js';
import path from 'path';
import crypto from 'crypto';
import FileModel from '../models/file.model.js';
import * as authMiddleWare from '../middleware/auth.middleware.js';
import userModel from '../models/user.model.js';

const router = Router();

// Upload single or multiple files (Authenticated)
router.post('/upload', authMiddleWare.authUser, upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const loggedInUser = await userModel.findOne({ email: req.user.email });
        const uploaderId = loggedInUser ? loggedInUser._id : null;

        // Prepare file metadata and save files to database
        const filesData = [];
        
        for (const file of req.files) {
            // Generate safe unique filename: randomUUID + sanitized original extension
            const rawExt = path.extname(file.originalname).toLowerCase().slice(0, 10);
            const ext = /^\.[a-z0-9]+$/.test(rawExt) ? rawExt : '';
            const safeBaseName = path.basename(file.originalname, ext).replace(/[^\w\.\-\_]/g, '_').slice(0, 50);
            const uniqueId = crypto.randomUUID().slice(0, 8);
            const filename = `${safeBaseName}-${uniqueId}${ext}`;

            // Save binary data and metadata to MongoDB
            await FileModel.create({
                filename,
                originalName: file.originalname.slice(0, 100),
                mimetype: file.mimetype,
                size: file.size,
                data: file.buffer,
                uploadedBy: uploaderId
            });

            filesData.push({
                filename,
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                url: `/files/${filename}`,
                uploadedAt: new Date().toISOString()
            });
        }

        return res.status(200).json({
            message: 'Files uploaded successfully',
            files: filesData
        });
    } catch (error) {
        console.error('[File Route Error] Upload error:', error.message);
        return res.status(500).json({ error: 'Failed to upload files' });
    }
});

// Serve uploaded files
router.get('/:filename', async (req, res) => {
    try {
        const rawFilename = req.params.filename;

        // Reject directory traversal attempts
        if (!rawFilename || typeof rawFilename !== 'string' || rawFilename.includes('..') || rawFilename.includes('/') || rawFilename.includes('\\')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }
        
        // Find file in MongoDB
        const file = await FileModel.findOne({ filename: rawFilename });

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Set safe headers for serving
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // Send file binary data from buffer
        return res.send(file.data);
    } catch (error) {
        console.error('[File Route Error] File serving error:', error.message);
        return res.status(500).json({ error: 'Failed to serve file' });
    }
});

export default router;
