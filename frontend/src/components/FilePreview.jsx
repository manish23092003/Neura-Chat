import React from 'react';
import { isImage, isVideo, isDocument, isAudio, formatFileSize, getFileIcon } from '../utils/fileUtils';

const FilePreview = ({ file, onDownload }) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const fileUrl = file.url.startsWith('http') ? file.url : `${baseUrl}${file.url}`;

    const getFileThemeClass = (mimetype) => {
        if (!mimetype) return 'theme-generic';
        if (mimetype === 'application/pdf') return 'theme-pdf';
        if (mimetype.includes('word') || mimetype.includes('document')) return 'theme-word';
        if (mimetype.includes('excel') || mimetype.includes('sheet')) return 'theme-excel';
        if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return 'theme-powerpoint';
        if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('compressed')) return 'theme-zip';
        if (mimetype.startsWith('text/')) return 'theme-text';
        return 'theme-generic';
    };

    const themeClass = getFileThemeClass(file.mimetype);

    // Image Preview
    if (isImage(file.mimetype)) {
        return (
            <div className="file-preview-card file-preview-image-card">
                <div className="image-wrapper">
                    <img
                        src={fileUrl}
                        alt={file.originalName}
                        className="file-preview-image"
                        loading="lazy"
                    />
                    <div className="image-overlay">
                        <button
                            onClick={() => onDownload(fileUrl, file.originalName)}
                            className="overlay-download-btn"
                            title="Download image"
                        >
                            <i className="ri-download-2-line"></i>
                        </button>
                    </div>
                </div>
                <div className="image-card-footer">
                    <span className="file-name" title={file.originalName}>{file.originalName}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
            </div>
        );
    }

    // Video Preview
    if (isVideo(file.mimetype)) {
        return (
            <div className="file-preview-card file-preview-video-card">
                <div className="video-wrapper">
                    <video
                        src={fileUrl}
                        controls
                        className="file-preview-video"
                        preload="metadata"
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
                <div className="video-card-footer">
                    <div className="video-card-info">
                        <span className="file-name" title={file.originalName}>{file.originalName}</span>
                        <span className="file-size">{formatFileSize(file.size)}</span>
                    </div>
                    <button
                        onClick={() => onDownload(fileUrl, file.originalName)}
                        className="footer-download-btn"
                        title="Download video"
                    >
                        <i className="ri-download-2-line"></i>
                    </button>
                </div>
            </div>
        );
    }

    // Audio Preview
    if (isAudio(file.mimetype)) {
        return (
            <div className="file-preview-card file-preview-audio-card">
                <div className="audio-wrapper">
                    <i className="ri-music-2-line audio-icon"></i>
                    <audio
                        src={fileUrl}
                        controls
                        className="audio-player"
                    >
                        Your browser does not support the audio tag.
                    </audio>
                </div>
                <div className="audio-card-footer">
                    <div className="audio-card-info">
                        <span className="file-name" title={file.originalName}>{file.originalName}</span>
                        <span className="file-size">{formatFileSize(file.size)}</span>
                    </div>
                    <button
                        onClick={() => onDownload(fileUrl, file.originalName)}
                        className="footer-download-btn"
                        title="Download audio"
                    >
                        <i className="ri-download-2-line"></i>
                    </button>
                </div>
            </div>
        );
    }

    // Document/Other Files Preview
    return (
        <div className={`file-preview-card ${themeClass}`}>
            <div className="file-preview-left">
                <div className="file-icon-box">
                    <i className={getFileIcon(file.mimetype)}></i>
                </div>
                <div className="file-details">
                    <span className="file-name" title={file.originalName}>{file.originalName}</span>
                    <div className="file-meta">
                        <span className="file-size">{formatFileSize(file.size)}</span>
                        <span className="file-type-badge">{file.mimetype?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                    </div>
                </div>
            </div>
            <button
                onClick={() => onDownload(fileUrl, file.originalName)}
                className="file-download-action-btn"
                title="Download file"
                aria-label="Download file"
            >
                <i className="ri-download-2-line"></i>
            </button>
        </div>
    );
};

export default FilePreview;
