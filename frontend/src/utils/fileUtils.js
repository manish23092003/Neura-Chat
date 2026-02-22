/**
 * Format file size from bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file icon class based on MIME type
 * @param {string} mimetype - File MIME type
 * @returns {string} RemixIcon class name
 */
export const getFileIcon = (mimetype) => {
    if (!mimetype) return 'ri-file-line';

    if (mimetype.startsWith('image/')) return 'ri-image-line';
    if (mimetype.startsWith('video/')) return 'ri-video-line';
    if (mimetype.startsWith('audio/')) return 'ri-music-line';

    if (mimetype === 'application/pdf') return 'ri-file-pdf-line';
    if (mimetype.includes('word') || mimetype.includes('document')) return 'ri-file-word-line';
    if (mimetype.includes('excel') || mimetype.includes('sheet')) return 'ri-file-excel-line';
    if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return 'ri-file-ppt-line';
    if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('compressed')) return 'ri-file-zip-line';
    if (mimetype.startsWith('text/')) return 'ri-file-text-line';

    return 'ri-file-line';
};

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateFile = (file) => {
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File size exceeds 50MB limit. File size: ${formatFileSize(file.size)}`
        };
    }

    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/csv',
        'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed',
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'
    ];

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `File type "${file.type}" is not supported. Only images, videos, documents, and audio files are allowed.`
        };
    }

    return { valid: true, error: null };
};

/**
 * Check if file is an image
 * @param {string} mimetype - File MIME type
 * @returns {boolean}
 */
export const isImage = (mimetype) => {
    return mimetype?.startsWith('image/');
};

/**
 * Check if file is a video
 * @param {string} mimetype - File MIME type
 * @returns {boolean}
 */
export const isVideo = (mimetype) => {
    return mimetype?.startsWith('video/');
};

/**
 * Check if file is a document
 * @param {string} mimetype - File MIME type
 * @returns {boolean}
 */
export const isDocument = (mimetype) => {
    const documentTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv'
    ];
    return documentTypes.includes(mimetype);
};

/**
 * Check if file is audio
 * @param {string} mimetype - File MIME type
 * @returns {boolean}
 */
export const isAudio = (mimetype) => {
    return mimetype?.startsWith('audio/');
};

/**
 * Generate thumbnail URL for file
 * @param {Object} file - File object with url and mimetype
 * @returns {string} Thumbnail URL
 */
export const getThumbnailUrl = (file) => {
    if (isImage(file.mimetype)) {
        return file.url;
    }
    return null;
};

/**
 * Transform flat file object to WebContainer nested tree structure
 * @param {Object} fileTree - Flat object with paths as keys
 * @returns {Object} Nested tree object
 */
export const transformFileTree = (fileTree) => {
    const tree = {};

    Object.keys(fileTree).forEach(path => {
        const parts = path.split('/');
        let current = tree;

        parts.forEach((part, index) => {
            if (index === parts.length - 1) {
                // It's a file
                current[part] = {
                    file: {
                        contents: fileTree[path].file.contents
                    }
                };
            } else {
                // It's a directory
                if (!current[part]) {
                    current[part] = {
                        directory: {}
                    };
                }
                current = current[part].directory;
            }
        });
    });

    return tree;
}
