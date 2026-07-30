import { Router } from 'express';
import upload from '../config/multer.config.js';
import path from 'path';
import { fileURLToPath } from 'url';
import FileModel from '../models/file.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Upload single or multiple files
router.post('/upload', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Prepare file metadata and save files to database
        const filesData = [];
        
        for (const file of req.files) {
            // Generate unique filename: timestamp-randomstring-originalname
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const nameWithoutExt = path.basename(file.originalname, ext);
            const filename = nameWithoutExt + '-' + uniqueSuffix + ext;

            // Save binary data and metadata to MongoDB
            await FileModel.create({
                filename,
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                data: file.buffer
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
router.get('/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        
        // Find file in MongoDB
        const file = await FileModel.findOne({ filename });

        // Check if file exists
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Set headers for serving
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Content-Type', file.mimetype);

        // Send file binary data from buffer
        res.send(file.data);
    } catch (error) {
        console.error('File serving error:', error);
        res.status(500).json({ error: 'Failed to serve file' });
    }
});

export default router;
