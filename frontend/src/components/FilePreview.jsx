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
        <div className="flex items-center gap-4 p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl transition-all group/file cursor-pointer max-w-sm">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-slate-700/50 text-2xl group-hover/file:bg-purple-500/10 group-hover/file:text-purple-400 transition-colors`}>
                <i className={getFileIcon(file.mimetype)}></i>
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-slate-200 truncate" title={file.originalName}>
                    {file.originalName}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{formatFileSize(file.size)}</span>
                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                    <span className="uppercase">{file.mimetype?.split('/')[1] || 'FILE'}</span>
                </div>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDownload(fileUrl, file.originalName);
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors opacity-0 group-hover/file:opacity-100"
                title="Download"
            >
                <i className="ri-download-cloud-line text-lg"></i>
            </button>
        </div>
    );
};

export default FilePreview;
