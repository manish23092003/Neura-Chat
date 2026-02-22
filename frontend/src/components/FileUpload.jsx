import React, { useState, useRef } from 'react';
import { validateFile, formatFileSize, getFileIcon } from '../utils/fileUtils';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const FileUpload = ({ onFilesSelected, maxFiles = 10 }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (files) => {
        const fileArray = Array.from(files);
        const validFiles = [];
        const errors = [];

        fileArray.forEach(file => {
            const validation = validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        });

        if (errors.length > 0) {
            errors.forEach(error => toast.error(error, { duration: 4000 }));
        }

        if (validFiles.length > 0) {
            if (selectedFiles.length + validFiles.length > maxFiles) {
                toast.error(`Maximum ${maxFiles} files allowed`);
                return;
            }
            setSelectedFiles(prev => [...prev, ...validFiles]);
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        handleFileSelect(files);
    };

    const handleInputChange = (e) => {
        const files = e.target.files;
        handleFileSelect(files);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = () => {
        if (selectedFiles.length === 0) {
            toast.error('Please select files to upload');
            return;
        }
        onFilesSelected(selectedFiles);
        setSelectedFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCancel = () => {
        setSelectedFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="file-upload-container">
            <div
                className={`file-upload-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleInputChange}
                    className="file-upload-input"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                />
                <div className="file-upload-content">
                    <i className="ri-upload-cloud-line file-upload-icon"></i>
                    <h3 className="file-upload-title">
                        {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                    </h3>
                    <p className="file-upload-subtitle">or click to browse</p>
                    <p className="file-upload-info">
                        Max {maxFiles} files • 50MB per file
                    </p>
                </div>
            </div>

            <AnimatePresence>
                {selectedFiles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="file-upload-preview-list"
                    >
                        <div className="file-upload-preview-header">
                            <h4>Selected Files ({selectedFiles.length})</h4>
                        </div>
                        <div className="file-upload-preview-items">
                            {selectedFiles.map((file, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="file-upload-preview-item"
                                >
                                    <i className={`${getFileIcon(file.type)} file-preview-icon`}></i>
                                    <div className="file-preview-details">
                                        <span className="file-preview-name">{file.name}</span>
                                        <span className="file-preview-size">{formatFileSize(file.size)}</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(index);
                                        }}
                                        className="file-preview-remove"
                                        title="Remove"
                                    >
                                        <i className="ri-close-line"></i>
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                        <div className="file-upload-actions">
                            <button onClick={handleCancel} className="file-upload-cancel">
                                Cancel
                            </button>
                            <button onClick={handleUpload} className="file-upload-submit">
                                <i className="ri-send-plane-fill"></i>
                                Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FileUpload;
