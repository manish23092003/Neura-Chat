import { Router } from 'express';
import upload from '../config/multer.config.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Upload single or multiple files
router.post('/upload', upload.array('files', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Prepare file metadata
        const filesData = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            url: `/files/${file.filename}`,
            uploadedAt: new Date().toISOString()
        }));

        res.status(200).json({
            message: 'Files uploaded successfully',
            files: filesData
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'Failed to upload files' });
    }
});

// Serve uploaded files
router.get('/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(__dirname, '../uploads/', filename);

        // Check if file exists
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Set headers for download
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        // Send file
        res.sendFile(filepath);
    } catch (error) {
        console.error('File serving error:', error);
        res.status(500).json({ error: 'Failed to serve file' });
    }
});

export default router;
