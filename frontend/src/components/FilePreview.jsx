import React from 'react';
import { isImage, isVideo, isDocument, isAudio, formatFileSize, getFileIcon } from '../utils/fileUtils';

const FilePreview = ({ file, onDownload }) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const fileUrl = file.url.startsWith('http') ? file.url : `${baseUrl}${file.url}`;

    // Image Preview
    if (isImage(file.mimetype)) {
        return (
            <div className="file-preview-container">
                <div className="file-preview-image-wrapper">
                    <img
                        src={fileUrl}
                        alt={file.originalName}
                        className="file-preview-image"
                        loading="lazy"
                    />
                </div>
                <div className="file-preview-info">
                    <div className="file-preview-name">
                        <i className="ri-image-line"></i>
                        <span>{file.originalName}</span>
                    </div>
                    <div className="file-preview-meta">
                        <span className="file-size">{formatFileSize(file.size)}</span>
                        <button
                            onClick={() => onDownload(fileUrl, file.originalName)}
                            className="file-download-btn"
                            title="Download"
                        >
                            <i className="ri-download-line"></i>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Video Preview
    if (isVideo(file.mimetype)) {
        return (
            <div className="file-preview-container">
                <div className="file-preview-video-wrapper">
                    <video
                        src={fileUrl}
                        controls
                        className="file-preview-video"
                        preload="metadata"
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
                <div className="file-preview-info">
                    <div className="file-preview-name">
                        <i className="ri-video-line"></i>
                        <span>{file.originalName}</span>
                    </div>
                    <div className="file-preview-meta">
                        <span className="file-size">{formatFileSize(file.size)}</span>
                        <button
                            onClick={() => onDownload(fileUrl, file.originalName)}
                            className="file-download-btn"
                            title="Download"
                        >
                            <i className="ri-download-line"></i>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Audio Preview
    if (isAudio(file.mimetype)) {
        return (
            <div className="file-preview-container file-preview-audio">
                <div className="file-preview-audio-wrapper">
                    <i className="ri-music-line file-audio-icon"></i>
                    <audio
                        src={fileUrl}
                        controls
                        className="file-preview-audio-player"
                    >
                        Your browser does not support the audio tag.
                    </audio>
                </div>
                <div className="file-preview-info">
                    <div className="file-preview-name">
                        <i className="ri-music-line"></i>
                        <span>{file.originalName}</span>
                    </div>
                    <div className="file-preview-meta">
                        <span className="file-size">{formatFileSize(file.size)}</span>
                        <button
                            onClick={() => onDownload(fileUrl, file.originalName)}
                            className="file-download-btn"
                            title="Download"
                        >
                            <i className="ri-download-line"></i>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Document/Other Files Preview
    return (
        <div className="file-preview-container file-preview-document">
            <div className="file-preview-document-wrapper">
                <i className={`${getFileIcon(file.mimetype)} file-document-icon`}></i>
                <div className="file-document-info">
                    <div className="file-preview-name">
                        <span className="file-name-text">{file.originalName}</span>
                    </div>
                    <div className="file-preview-meta">
                        <span className="file-size">{formatFileSize(file.size)}</span>
                        <span className="file-type">{file.mimetype?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                    </div>
                </div>
                <button
                    onClick={() => onDownload(fileUrl, file.originalName)}
                    className="file-download-btn-large"
                    title="Download"
                >
                    <i className="ri-download-cloud-line"></i>
                    <span>Download</span>
                </button>
            </div>
        </div>
    );
};

export default FilePreview;
