import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js'
import { getLifoSandbox, destroyLifoSandbox, runLifoProject } from '../config/lifoRuntime'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import EmptyState from '../components/ui/EmptyState'
import FilePreview from '../components/FilePreview'
import FileUpload from '../components/FileUpload'
import TaskList from '../components/TaskList'
import RobotSkeleton from '../components/RobotSkeleton'
import AiThinkingAnimation from '../components/AiThinkingAnimation'
import JSZip from 'jszip'

function SyntaxHighlightedCode(props) {
    const ref = useRef(null)
    const [showCopy, setShowCopy] = useState(false)
    const [copied, setCopied] = useState(false)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)
            ref.current.removeAttribute('data-highlighted')
        }
    }, [props.className, props.children])

    const handleCopy = () => {
        const code = ref.current?.innerText || props.children
        navigator.clipboard.writeText(code).then(() => {
            toast.success('Code copied to clipboard!')
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }).catch(() => {
            toast.error('Failed to copy code')
        })
    }

    return (
        <div
            className="relative group inline-block w-full"
            onMouseEnter={() => setShowCopy(true)}
            onMouseLeave={() => setShowCopy(false)}
        >
            <code {...props} ref={ref} />
            {showCopy && (
                <button
                    onClick={handleCopy}
                    className="absolute top-1 right-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-[var(--nc-text-primary)] text-xs rounded flex items-center gap-1 transition-all z-50 shadow-lg"
                    title="Copy code"
                >
                    <i className={copied ? "ri-check-line" : "ri-file-copy-line"}></i>
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            )}
        </div>
    )
}

const Project = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user } = useContext(UserContext)
    const messageBox = useRef(null)

    const initialProject = location?.state?.project || null;

    useEffect(() => {
        if (!initialProject) {
            toast.error('Project details not found. Redirecting to home...');
            navigate('/home');
        }
    }, [initialProject, navigate]);

    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState(new Set())
    const [project, setProject] = useState(initialProject || { name: 'Loading...', users: [], fileTree: {} })
    const [message, setMessage] = useState('')
    const [users, setUsers] = useState([])
    const [messages, setMessages] = useState([])
    const [fileTree, setFileTree] = useState(initialProject?.fileTree || {})
    const [currentFile, setCurrentFile] = useState(null)
    const [openFiles, setOpenFiles] = useState([])
    const [lifoSandbox, setLifoSandbox] = useState(null)
    const [iframeUrl, setIframeUrl] = useState(null)
    const [previewsList, setPreviewsList] = useState([])
    const [previewWidth, setPreviewWidth] = useState(375)
    const [previewPanelWidth, setPreviewPanelWidth] = useState(420)
    const [isDragging, setIsDragging] = useState(false)
    const [previewDevice, setPreviewDevice] = useState('mobile') // 'mobile', 'tablet', 'laptop', 'responsive'
    const [previewZoom, setPreviewZoom] = useState('fit') // 'fit', 0.5, 0.75, 1.0, 1.25
    const [previewOrientation, setPreviewOrientation] = useState('portrait') // 'portrait', 'landscape'
    const [runtimeStatus, setRuntimeStatus] = useState('Idle') // Idle, Initializing, Installing Dependencies, Starting Application, Running, Failed
    const [isRunning, setIsRunning] = useState(false)
    const [fileSearchQuery, setFileSearchQuery] = useState('')
    const [showReactionPicker, setShowReactionPicker] = useState(null)
    const [typingUsers, setTypingUsers] = useState([])
    const typingTimeoutRef = useRef(null)
    const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false)
    const [uploadingFiles, setUploadingFiles] = useState(false)
    const [activeTab, setActiveTab] = useState('chat') // 'chat', 'tasks', 'files'
    const [terminalOutput, setTerminalOutput] = useState('')
    const [isGeneratingInvite, setIsGeneratingInvite] = useState(false)
    const [inviteCopied, setInviteCopied] = useState(false)
    const [expandedFolders, setExpandedFolders] = useState({})
    const [isAiThinking, setIsAiThinking] = useState(false)

    const fileTreeRef = useRef(fileTree)
    useEffect(() => {
        fileTreeRef.current = fileTree
    }, [fileTree])

    // Drag to resize live preview panel
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const newWidth = window.innerWidth - e.clientX;
            const maxWidth = window.innerWidth * 0.75;
            if (newWidth >= 320 && newWidth <= maxWidth) {
                setPreviewPanelWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    // Clean up Lifo sandbox when unmounting or switching projects
    useEffect(() => {
        return () => {
            destroyLifoSandbox();
        };
    }, []);

    useEffect(() => {
        if (isAiThinking) {
            setTimeout(() => {
                if (messageBox.current) {
                    messageBox.current.scrollTop = messageBox.current.scrollHeight
                }
            }, 100)
        }
    }, [isAiThinking])




    const getFileByPathString = (tree, pathStr) => {
        if (!pathStr || !tree) return null;
        const parts = pathStr.split('/');
        let current = tree;
        for (const segment of parts) {
            if (!current) return null;
            if (current.directory) {
                current = current.directory[segment];
            } else {
                current = current[segment];
            }
        }
        return current && current.file ? current : null;
    };

    const normalizeFileTree = (tree) => {
        if (!tree || typeof tree !== 'object') return tree;
        const normalized = {};
        for (const key of Object.keys(tree)) {
            const node = tree[key];
            if (!node || typeof node !== 'object') continue;

            if (node.file) {
                normalized[key] = { file: node.file };
            } else if (node.type === 'directory' || node.children || node.directory) {
                const children = node.children || node.directory || {};
                normalized[key] = {
                    directory: normalizeFileTree(children)
                };
            } else {
                normalized[key] = {
                    directory: normalizeFileTree(node)
                };
            }
        }
        return normalized;
    };

    const updateFileInTreeByPathString = (tree, pathStr, contents) => {
        if (!pathStr) return tree;
        const parts = pathStr.split('/');
        const newTree = JSON.parse(JSON.stringify(tree));
        let current = newTree;
        for (let i = 0; i < parts.length; i++) {
            const segment = parts[i];
            if (i === parts.length - 1) {
                if (current.directory) {
                    current.directory[segment] = { file: { contents } };
                } else {
                    current[segment] = { file: { contents } };
                }
            } else {
                if (current.directory) {
                    if (!current.directory[segment]) {
                        current.directory[segment] = { directory: {} };
                    }
                    current = current.directory[segment];
                } else {
                    if (!current[segment]) {
                        current[segment] = { directory: {} };
                    }
                    current = current[segment];
                }
            }
        }
        return newTree;
    };

    const getAllFilesFromTree = (node, path = '', acc = []) => {
        if (!node) return acc;
        Object.keys(node).forEach(key => {
            const childNode = node[key];
            const currentPath = path ? `${path}/${key}` : key;
            const isDir = !!(childNode.directory || (!childNode.file && typeof childNode === 'object'));
            const nextNode = childNode.directory || (isDir ? childNode : null);
            if (isDir) {
                if (nextNode) getAllFilesFromTree(nextNode, currentPath, acc);
            } else {
                acc.push(currentPath);
            }
        });
        return acc;
    };

    const toggleFolder = (pathStr) => {
        setExpandedFolders(prev => ({
            ...prev,
            [pathStr]: !prev[pathStr]
        }))
    }

    const renderFileTree = (node, path = '', level = 0) => {
        if (!node) return null;
        const keys = Object.keys(node);
        const sortedKeys = [...keys].sort((a, b) => {
            const aNode = node[a];
            const bNode = node[b];
            const aIsDir = !!(aNode.directory || (!aNode.file && typeof aNode === 'object'));
            const bIsDir = !!(bNode.directory || (!bNode.file && typeof bNode === 'object'));
            if (aIsDir && !bIsDir) return -1;
            if (!aIsDir && bIsDir) return 1;
            return a.localeCompare(b);
        });

        return sortedKeys.map((key) => {
            const childNode = node[key];
            const currentPath = path ? `${path}/${key}` : key;
            const isDir = !!(childNode.directory || (!childNode.file && typeof childNode === 'object'));
            const nextNode = childNode.directory || (isDir ? childNode : null);

            if (isDir) {
                const isExpanded = !!expandedFolders[currentPath];
                return (
                    <div key={currentPath}>
                        <button
                            onClick={() => toggleFolder(currentPath)}
                            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-[6px] text-left transition-all text-[13px] font-[600]"
                            style={{
                                color: 'var(--nc-text-secondary)',
                                paddingLeft: `${8 + level * 10}px`
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                e.currentTarget.style.color = 'var(--nc-text-primary)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--nc-text-secondary)';
                            }}
                        >
                            <i className={isExpanded ? "ri-arrow-down-s-line text-[14px]" : "ri-arrow-right-s-line text-[14px]"} style={{ color: 'var(--nc-text-muted)' }} />
                            <i className={isExpanded ? "ri-folder-open-fill text-[15px]" : "ri-folder-fill text-[15px]"} style={{ color: '#FCD34D' }} />
                            <span className="truncate">{key}</span>
                        </button>
                        {isExpanded && nextNode && (
                            <div className="mt-0.5">
                                {renderFileTree(nextNode, currentPath, level + 1)}
                            </div>
                        )}
                    </div>
                );
            } else {
                const isActive = currentFile === currentPath;
                return (
                    <button
                        key={currentPath}
                        onClick={() => {
                            setCurrentFile(currentPath);
                            setOpenFiles(prev => [...new Set([...prev, currentPath])]);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-left transition-all text-[13px] font-[500]"
                        style={{
                            paddingLeft: `${24 + level * 10}px`,
                            background: isActive ? 'var(--nc-primary-muted)' : 'transparent',
                            color: isActive ? 'var(--nc-primary)' : 'var(--nc-text-secondary)',
                            border: `1px solid ${isActive ? 'var(--nc-primary-border)' : 'transparent'}`,
                        }}
                        onMouseEnter={e => {
                            if (!isActive) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                e.currentTarget.style.color = 'var(--nc-text-primary)';
                            }
                        }}
                        onMouseLeave={e => {
                            if (!isActive) {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--nc-text-secondary)';
                            }
                        }}
                    >
                        <i className="ri-file-code-line text-[14px] flex-shrink-0" style={{ color: isActive ? 'var(--nc-primary)' : 'var(--nc-text-muted)' }} />
                        <span className="truncate">{key}</span>
                    </button>
                );
            }
        });
    };

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId)
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id)
            } else {
                newSelectedUserId.add(id)
            }
            return newSelectedUserId
        })
    }

    function addCollaborators() {
        axios.put("/projects/add-user", {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            toast.success('Invitations sent successfully!')
            setIsModalOpen(false)
            setSelectedUserId(new Set())
            // Refresh project data
            axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {
                setProject(res.data.project)
            })
        }).catch(err => {
            console.log(err)
            toast.error('Failed to send invitations')
        })
    }

    const handleCopyInviteLink = async () => {
        setIsGeneratingInvite(true)
        try {
            const res = await axios.post(`/projects/${project._id}/invite/generate`)
            const { inviteUrl } = res.data
            await navigator.clipboard.writeText(inviteUrl)
            setInviteCopied(true)
            toast.success('Invite link copied! Valid for 7 days 🔗')
            setTimeout(() => setInviteCopied(false), 3000)
        } catch (err) {
            console.error(err)
            toast.error('Failed to generate invite link')
        } finally {
            setIsGeneratingInvite(false)
        }
    }

    const send = () => {
        if (!message.trim()) return

        const messageData = {
            _id: crypto.randomUUID(), // add unique ID
            message,
            sender: user,
            timestamp: new Date().toISOString(),
            reactions: [] // Initialize empty reactions array
        }

        const prompt = message.trim()
        if (prompt.includes('@ai')) {
            setIsAiThinking(true)
        }

        sendMessage('project-message', messageData)
        // Add message locally so sender can see it immediately
        setMessages(prevMessages => [...prevMessages, messageData])
        setMessage("")

        // Scroll to bottom after sending
        setTimeout(() => {
            if (messageBox.current) {
                messageBox.current.scrollTop = messageBox.current.scrollHeight
            }
        }, 100)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send()
        }
    }

    const handleReaction = (messageId, emoji) => {
        setMessages(prevMessages => {
            const newMessages = [...prevMessages]
            const messageIndex = newMessages.findIndex(m => m._id === messageId);
            if (messageIndex === -1) return newMessages;

            const message = newMessages[messageIndex]

            // Initialize reactions array if it doesn't exist
            if (!message.reactions) {
                message.reactions = []
            }

            // Find if this emoji already exists
            const existingReaction = message.reactions.find(r => r.emoji === emoji)

            if (existingReaction) {
                // Check if user already reacted with this emoji
                const userIndex = existingReaction.users.findIndex(u => (u._id || u) === user._id)
                if (userIndex > -1) {
                    // Remove user's reaction
                    existingReaction.users.splice(userIndex, 1)
                    // Remove emoji if no users left
                    if (existingReaction.users.length === 0) {
                        message.reactions = message.reactions.filter(r => r.emoji !== emoji)
                    }
                } else {
                    // Add user's reaction
                    existingReaction.users.push(user)
                }
            } else {
                // Add new reaction
                message.reactions.push({
                    emoji,
                    users: [user]
                })
            }

            // Emit reaction update via socket
            sendMessage('message-reaction', {
                messageId,
                emoji,
                user,
                reactions: message.reactions
            })

            return newMessages
        })
        setShowReactionPicker(null)
    }

    const availableReactions = ['👍', '❤️', '😊', '🎉', '🚀', '👏']

    const handleFileUpload = async (files) => {
        setUploadingFiles(true)
        const formData = new FormData()

        files.forEach(file => {
            formData.append('files', file)
        })

        try {
            const response = await axios.post('/files/upload', formData)

            const uploadedFiles = response.data.files

            // Send file message via socket
            const fileMessage = {
                _id: crypto.randomUUID(), // add unique ID
                message: message.trim() || `Shared ${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}`,
                sender: user,
                timestamp: new Date().toISOString(),
                files: uploadedFiles,
                reactions: []
            }

            sendMessage('project-file-message', fileMessage)
            setMessages(prevMessages => [...prevMessages, fileMessage])
            setMessage('')
            setIsFileUploadModalOpen(false)
            toast.success('Files uploaded successfully!')

            // Scroll to bottom
            setTimeout(() => {
                if (messageBox.current) {
                    messageBox.current.scrollTop = messageBox.current.scrollHeight
                }
            }, 100)
        } catch (error) {
            console.error('File upload error:', error)
            toast.error('Failed to upload files')
        } finally {
            setUploadingFiles(false)
        }
    }

    const handleFileDownload = async (fileUrl, fileName) => {
        try {
            // Use the same base URL as axios (from environment variable)
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${baseUrl}${fileUrl}`;

            // Fetch the file
            const response = await fetch(fullUrl);
            if (!response.ok) {
                throw new Error('Failed to download file');
            }

            // Get the blob
            const blob = await response.blob();

            // Create object URL and download
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            window.URL.revokeObjectURL(blobUrl);
            toast.success('File downloaded successfully!');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download file');
        }
    }

    const handleTyping = () => {
        // Emit typing start event
        sendMessage('user-typing', { user, typing: true })

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        // Set timeout to emit stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            sendMessage('user-typing', { user, typing: false })
        }, 2000)
    }

    // Task Management Handlers
    const handleCreateTask = async (taskData) => {
        try {
            const response = await axios.post(`/projects/${project._id}/tasks`, taskData)
            setProject(response.data.project)
            toast.success('Task created successfully!')
        } catch (error) {
            console.error('Create task error:', error)
            toast.error('Failed to create task')
        }
    }

    const handleUpdateTask = async (taskId, updates) => {
        try {
            const response = await axios.put(`/projects/${project._id}/tasks/${taskId}`, updates)
            setProject(response.data.project)
            toast.success('Task updated successfully!')
        } catch (error) {
            console.error('Update task error:', error)
            toast.error('Failed to update task')
        }
    }

    const handleDeleteTask = async (taskId) => {
        try {
            const response = await axios.delete(`/projects/${project._id}/tasks/${taskId}`)
            setProject(response.data.project)
            toast.success('Task deleted successfully!')
        } catch (error) {
            console.error('Delete task error:', error)
            toast.error('Failed to delete task')
        }
    }

    const handleToggleTask = async (taskId) => {
        try {
            const response = await axios.put(`/projects/${project._id}/tasks/${taskId}/toggle`)
            setProject(response.data.project)
        } catch (error) {
            console.error('Toggle task error:', error)
            toast.error('Failed to toggle task')
        }
    }

    const handleCreateFile = () => {
        const fileName = prompt('Enter file name (e.g. index.js or routes/user.js):')
        if (!fileName) return
        const trimmed = fileName.trim()
        if (!trimmed) return
        if (getFileByPathString(fileTree, trimmed)) {
            toast.error('File already exists!')
            return
        }
        const updatedFileTree = updateFileInTreeByPathString(fileTree, trimmed, '')
        setFileTree(updatedFileTree)
        saveFileTree(updatedFileTree)
        setCurrentFile(trimmed)
        setOpenFiles([...new Set([...openFiles, trimmed])])
        toast.success(`Created file ${trimmed}`)
    }

    function parseAiMessage(messageStr) {
        if (!messageStr || typeof messageStr !== 'string') {
            return { text: messageStr || '' }
        }

        let cleaned = messageStr.trim()
        
        // Remove markdown code block wraps if present
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.substring(7)
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.substring(3)
        }
        if (cleaned.endsWith('```')) {
            cleaned = cleaned.substring(0, cleaned.length - 3)
        }
        cleaned = cleaned.trim()

        try {
            return JSON.parse(cleaned)
        } catch (e) {
            console.warn('Initial AI message JSON parse failed. Attempting syntax repair...', e)
            try {
                // Repair common LLM syntax escaping errors (e.g., escaped quotes inside package.json with spaces \ ")
                let repaired = cleaned.replace(/\\+\s+"/g, '\\"')
                return JSON.parse(repaired)
            } catch (e2) {
                console.error('Failed to parse AI message after repair:', e2)
                return { text: messageStr }
            }
        }
    }

    function mergeFileTrees(existing, incoming) {
        if (!existing || typeof existing !== 'object') return incoming || {};
        if (!incoming || typeof incoming !== 'object') return existing;

        const merged = { ...existing };

        for (const key of Object.keys(incoming)) {
            const incomingNode = incoming[key];
            const existingNode = existing[key];

            if (!existingNode) {
                merged[key] = incomingNode;
            } else if (incomingNode.file && existingNode.file) {
                merged[key] = incomingNode;
            } else if (incomingNode.directory && existingNode.directory) {
                merged[key] = {
                    directory: mergeFileTrees(existingNode.directory, incomingNode.directory)
                };
            } else {
                merged[key] = incomingNode;
            }
        }

        return merged;
    }

    const downloadProjectAsZip = () => {
        const zip = new JSZip();

        // Helper to recursively add files and directories to the zip object
        const addFolderToZip = (zipObj, folderNode) => {
            if (!folderNode || typeof folderNode !== 'object') return;

            Object.keys(folderNode).forEach(key => {
                const node = folderNode[key];
                if (!node || typeof node !== 'object') return;

                if (node.file) {
                    zipObj.file(key, node.file.contents || '');
                } else if (node.directory) {
                    const folder = zipObj.folder(key);
                    addFolderToZip(folder, node.directory);
                } else {
                    const folder = zipObj.folder(key);
                    addFolderToZip(folder, node);
                }
            });
        };

        addFolderToZip(zip, fileTree);

        zip.generateAsync({ type: 'blob' }).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${project.name || 'project'}-workspace.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Workspace downloaded successfully!');
        }).catch(err => {
            console.error('Failed to generate zip file:', err);
            toast.error('Failed to download project workspace');
        });
    };

    function WriteAiMessage(message) {
        const messageObject = parseAiMessage(message)
        return (
            <div className='overflow-auto rounded-lg p-3 border' style={{ background: 'var(--nc-bg)', borderColor: 'var(--nc-border)' }}>
                <Markdown
                    children={messageObject.text || ''}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>
        )
    }

    useEffect(() => {
        if (!project?._id) return;
        const socket = initializeSocket(project._id)

        const messageHandler = (data) => {
            console.log(data)

            // Ensure timestamp exists
            if (!data.timestamp) {
                data.timestamp = new Date().toISOString()
            }

            // Skip messages sent by current user (already added locally in send())
            if (data.sender._id === user._id) {
                return
            }

            if (data.sender._id == 'ai') {
                setIsAiThinking(false)
                const parsedMessage = parseAiMessage(data.message)

                if (parsedMessage.fileTree) {
                    const normalizedTree = normalizeFileTree(parsedMessage.fileTree)
                    const mergedTree = mergeFileTrees(fileTreeRef.current, normalizedTree)
                    setFileTree(mergedTree)
                    saveFileTree(mergedTree)
                }
                setMessages(prevMessages => [...prevMessages, data])
            } else {
                setMessages(prevMessages => [...prevMessages, data])
            }
        }

        receiveMessage('project-message', messageHandler)

        // Typing indicator listeners
        const typingStartHandler = (data) => {
            setTypingUsers(prev => {
                if (!prev.find(u => u._id === data.user._id)) {
                    return [...prev, data.user]
                }
                return prev
            })
        }

        const typingStopHandler = (data) => {
            setTypingUsers(prev => prev.filter(u => u._id !== data.user._id))
        }

        receiveMessage('user-typing-start', typingStartHandler)
        receiveMessage('user-typing-stop', typingStopHandler)

        // Reaction listener
        const reactionHandler = (data) => {
            console.log('Received reaction:', data)
            setMessages(prevMessages => {
                const newMessages = [...prevMessages]
                const index = newMessages.findIndex(m => m._id === data.messageId)
                if (index !== -1) {
                    newMessages[index].reactions = data.reactions
                }
                return newMessages
            })
        }

        receiveMessage('message-reaction', reactionHandler)

        // File message listener
        const fileMessageHandler = (data) => {
            console.log('File message received:', data)

            // Ensure timestamp exists
            if (!data.timestamp) {
                data.timestamp = new Date().toISOString()
            }

            // Skip messages sent by current user (already added locally)
            if (data.sender._id === user._id) {
                return
            }

            setMessages(prevMessages => [...prevMessages, data])
        }

        receiveMessage('project-file-message', fileMessageHandler)

        if (project?._id) {
            axios.get(`/projects/get-project/${project._id}`).then(res => {
                if (res.data?.project) {
                    setProject(res.data.project)
                    setFileTree(res.data.project.fileTree || {})
                }
            }).catch(console.error)

            // Fetch historical messages
            axios.get(`/projects/get-messages/${project._id}`).then(res => {
                setMessages(res.data.messages || [])
                // Scroll to bottom initially
                setTimeout(() => {
                    if (messageBox.current) {
                        messageBox.current.scrollTop = messageBox.current.scrollHeight
                    }
                }, 500)
            }).catch(err => {
                console.error('Failed to load messages', err)
            })
        }

        axios.get('/users/all').then(res => {
            setUsers(res.data.users)
        }).catch(err => {
            console.log(err)
        })

        // Cleanup function to remove event listener
        return () => {
            if (socket) {
                socket.off('project-message', messageHandler)
                socket.off('user-typing-start', typingStartHandler)
                socket.off('user-typing-stop', typingStopHandler)
                socket.off('message-reaction', reactionHandler)
                socket.off('project-file-message', fileMessageHandler)
            }
        }
    }, [])

    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log(res.data)
            if (res.data.project) {
                setProject(res.data.project)
            }
        }).catch(err => {
            console.log(err)
        })
    }

    const closeFile = (fileName, e) => {
        e.stopPropagation()
        setOpenFiles(openFiles.filter(f => f !== fileName))
        if (currentFile === fileName) {
            setCurrentFile(openFiles[0] || null)
        }
    }

    const filteredFiles = (() => {
        const allFiles = getAllFilesFromTree(fileTree);
        return allFiles.filter(file =>
            file.toLowerCase().includes(fileSearchQuery.toLowerCase())
        );
    })()

    const formatTime = (timestamp) => {
        if (!timestamp) return ''

        const date = new Date(timestamp)
        const now = new Date()
        const diffInSeconds = Math.floor((now - date) / 1000)

        // If less than 1 minute ago, show "Just now"
        if (diffInSeconds < 60) {
            return 'Just now'
        }

        // If less than 1 hour ago, show minutes
        if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60)
            return `${minutes}m ago`
        }

        // If today, show time
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            })
        }

        // If this year, show date and time
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        }

        // Otherwise show full date
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="h-screen w-screen flex flex-col" style={{ background: 'var(--nc-bg)' }}>

            {/* ── Top Header ── */}
            <header
                className="flex items-center justify-between px-5 shrink-0 z-20"
                style={{
                    height: 56,
                    background: 'var(--nc-surface)',
                    borderBottom: '1px solid var(--nc-border)',
                }}
            >
                {/* Back + project name */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/home')}
                        className="nc-btn-icon"
                        style={{ width: 34, height: 34 }}
                        aria-label="Back to Dashboard"
                    >
                        <i className="ri-arrow-left-line text-[16px]" />
                    </button>

                    <div className="w-px h-5 flex-shrink-0" style={{ background: 'var(--nc-border)' }} />

                    <div
                        className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--nc-primary-muted)', border: '1px solid var(--nc-primary-border)' }}
                    >
                        <i className="ri-folder-3-fill text-[14px]" style={{ color: 'var(--nc-primary)' }} />
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-[15px] font-[700] text-[var(--nc-text-primary)] leading-none tracking-tight">{project.name}</h1>
                            {project.githubRepoName && (
                                <a
                                    href={project.githubRepoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-[600] transition-colors"
                                    style={{
                                        background: project.githubSyncStatus === 'syncing' 
                                            ? 'rgba(59,130,246,0.1)' 
                                            : project.githubSyncStatus === 'error' 
                                            ? 'rgba(239,68,68,0.1)' 
                                            : 'rgba(255,255,255,0.06)',
                                        border: `1px solid ${
                                            project.githubSyncStatus === 'syncing' 
                                                ? 'rgba(59,130,246,0.2)' 
                                                : project.githubSyncStatus === 'error' 
                                                ? 'rgba(239,68,68,0.2)' 
                                                : 'var(--nc-border)'
                                        }`,
                                        color: project.githubSyncStatus === 'syncing' 
                                            ? '#60A5FA' 
                                            : project.githubSyncStatus === 'error' 
                                            ? '#F87171' 
                                            : '#94A3B8'
                                    }}
                                    title={`Repository: ${project.githubRepoName}`}
                                >
                                    <i className="ri-github-fill text-[12px]" />
                                    <span>
                                        {project.githubSyncStatus === 'syncing' 
                                            ? 'Syncing…' 
                                            : project.githubSyncStatus === 'error' 
                                            ? 'Sync Error' 
                                            : 'Synced'}
                                    </span>
                                </a>
                            )}
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--nc-text-muted)' }}>
                            {project.users?.length || 0} {project.users?.length === 1 ? 'member' : 'members'}
                        </p>
                    </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                    {/* Copy Invite Link — premium button */}
                    <button
                        onClick={handleCopyInviteLink}
                        disabled={isGeneratingInvite}
                        title="Share invite link with your team"
                        aria-label="Copy invite link"
                        style={{
                            position: 'relative', overflow: 'hidden',
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '0 14px', height: 36, borderRadius: 10,
                            background: inviteCopied
                                ? 'rgba(34,197,94,0.1)'
                                : 'var(--nc-primary-muted)',
                            border: `1px solid ${inviteCopied ? 'rgba(34,197,94,0.2)' : 'var(--nc-primary-border)'}`,
                            color: inviteCopied ? '#4ADE80' : 'var(--nc-primary)',
                            fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em',
                            cursor: isGeneratingInvite ? 'not-allowed' : 'pointer',
                            opacity: isGeneratingInvite ? 0.65 : 1,
                            transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
                        }}
                    >
                        {/* Shine overlay */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
                            borderRadius: '10px 10px 0 0', pointerEvents: 'none',
                        }} />
                        <i className={`${isGeneratingInvite ? 'ri-loader-4-line nc-spin' : inviteCopied ? 'ri-check-double-line' : 'ri-links-line'}`}
                            style={{ fontSize: 13, position: 'relative' }} />
                        <span className="hidden sm:inline" style={{ position: 'relative' }}>
                            {inviteCopied ? 'Copied!' : 'Invite'}
                        </span>
                    </button>

                    <Button
                        onClick={() => setIsModalOpen(true)}
                        variant="secondary"
                        size="sm"
                        icon={<i className="ri-user-add-line" />}
                    >
                        Add member
                    </Button>

                    <button
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                        className="nc-btn-icon"
                        style={isSidePanelOpen ? {
                            background: 'var(--nc-primary-muted)',
                            borderColor: 'var(--nc-primary-border)',
                            color: 'var(--nc-primary)',
                        } : {}}
                        aria-label="Toggle collaborators panel"
                    >
                        <i className="ri-group-2-line text-[17px]" />
                    </button>
                </div>
            </header>

            {/* ── Main layout ── */}
            <div className="flex flex-1 overflow-hidden min-h-0">

                {/* ── Left Panel: Chat + Tasks ── */}
                <section
                    className="relative flex flex-col h-full shrink-0"
                    style={{ width: 360, background: 'var(--nc-surface)', borderRight: '1px solid var(--nc-border)' }}
                >
                    {/* Tab bar */}
                    <div
                        className="flex items-center gap-1 px-3 py-3 shrink-0"
                        style={{ borderBottom: '1px solid var(--nc-border)' }}
                    >
                        {[
                            { id: 'chat',  icon: 'ri-chat-3-line',  label: 'Chat' },
                            { id: 'tasks', icon: 'ri-task-line',     label: 'Tasks', badge: project.tasks?.length || 0 },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="flex items-center gap-2 px-3 h-8 rounded-[8px] text-[13px] font-[500] transition-all"
                                style={{
                                    background: activeTab === tab.id ? 'var(--nc-elevated)' : 'transparent',
                                    color: activeTab === tab.id ? 'var(--nc-text-primary)' : 'var(--nc-text-secondary)',
                                    fontWeight: activeTab === tab.id ? 600 : 500,
                                    boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                                }}
                                aria-selected={activeTab === tab.id}
                            >
                                <i className={`${tab.icon} text-[14px]`} />
                                {tab.label}
                                {tab.badge > 0 && (
                                    <span
                                        className="px-1.5 py-0.5 rounded-full text-[10px] font-[700]"
                                        style={{
                                            background: activeTab === tab.id ? 'var(--nc-primary-muted)' : 'rgba(255,255,255,0.08)',
                                            color: activeTab === tab.id ? 'var(--nc-primary)' : 'var(--nc-text-muted)',
                                        }}
                                    >
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'chat' ? (
                        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
                            {/* Messages */}
                            <div ref={messageBox} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                                {messages.length === 0 && !isAiThinking ? (
                                    <div className="h-full flex items-center justify-center">
                                        <EmptyState
                                            icon="ri-chat-1-line"
                                            title="No messages yet"
                                            description="Start the conversation or ask NeuraChat AI for help."
                                        />
                                    </div>
                                ) : (
                                <AnimatePresence>
                                    {messages.map((msg, index) => {
                                        const isCurrentUser = msg.sender && user && (
                                            msg.sender.email === user.email ||
                                            (msg.sender._id && msg.sender._id === user._id) ||
                                            msg.sender === user._id
                                        );

                                        return (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.15 }}
                                                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[85%] ${msg.sender._id === 'ai' ? 'max-w-full' : ''}`}>
                                                    {!isCurrentUser && (
                                                        <div className="flex items-center gap-1.5 mb-1.5 pl-1">
                                                            {msg.sender._id === 'ai' ? (
                                                                <div style={{
                                                                    width: 20, height: 20, borderRadius: '6px',
                                                                    background: 'var(--nc-primary)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                }}>
                                                                    <i className="ri-robot-2-fill text-[12px]" style={{ color: 'var(--nc-bg)' }} />
                                                                </div>
                                                            ) : (
                                                                <Avatar email={msg.sender.email} size="xs" />
                                                            )}
                                                            <span className="text-[11px] font-[600]" style={{ color: 'var(--nc-text-secondary)' }}>
                                                                {msg.sender._id === 'ai' ? 'NeuraChat AI' : msg.sender.email}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="relative">
                                                        <div
                                                            className={`px-4 py-2.5 group relative ${
                                                                msg.sender._id === 'ai'
                                                                    ? 'rounded-[14px] rounded-bl-[4px]'
                                                                    : isCurrentUser
                                                                        ? 'rounded-[14px] rounded-br-[4px]'
                                                                        : 'rounded-[14px] rounded-bl-[4px]'
                                                            }`}
                                                            style={{
                                                                background: msg.sender._id === 'ai'
                                                                    ? 'var(--nc-elevated)'
                                                                    : isCurrentUser
                                                                        ? 'var(--nc-primary-muted)'
                                                                        : 'var(--nc-elevated)',
                                                                border: msg.sender._id === 'ai'
                                                                    ? '1px solid var(--nc-border)'
                                                                    : isCurrentUser
                                                                        ? '1px solid var(--nc-primary-border)'
                                                                        : '1px solid var(--nc-border)',
                                                            }}
                                                        >
                                                            {msg.sender._id === 'ai'
                                                                ? WriteAiMessage(msg.message)
                                                                : <p className="text-[14px] leading-relaxed break-words" style={{ color: 'var(--nc-text-primary)' }}>{msg.message}</p>
                                                            }

                                                        {msg.files && msg.files.length > 0 && (
                                                            <div className="mt-2">
                                                                {msg.files.map((file, fi) => (
                                                                    <FilePreview key={fi} file={file} onDownload={handleFileDownload} />
                                                                ))}
                                                            </div>
                                                        )}

                                                        {msg.sender._id !== 'ai' && (
                                                            <button
                                                                onClick={() => setShowReactionPicker(showReactionPicker === index ? null : index)}
                                                                className="absolute -bottom-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full flex items-center justify-center text-[12px]"
                                                                style={{ background: 'var(--nc-surface)', border: '1px solid var(--nc-border)', color: 'var(--nc-text-muted)' }}
                                                                title="React"
                                                            >
                                                                <i className="ri-emotion-line" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {showReactionPicker === index && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.85 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className={`absolute ${isCurrentUser ? 'right-0' : 'left-0'} top-full mt-2 flex gap-1 p-2 rounded-[12px] z-10`}
                                                            style={{ background: 'var(--nc-elevated)', border: '1px solid var(--nc-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                                                        >
                                                            {availableReactions.map((emoji, ei) => (
                                                                <button key={ei} onClick={() => handleReaction(msg._id, emoji)} className="text-[18px] p-1 rounded-[8px] hover:bg-white/10 transition-all hover:scale-125">
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}

                                                    {msg.reactions && msg.reactions.length > 0 && (
                                                        <div className={`flex flex-wrap gap-1 mt-1.5 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                                            {msg.reactions.map((reaction, ri) => (
                                                                <button
                                                                    key={ri}
                                                                    onClick={() => handleReaction(msg._id, reaction.emoji)}
                                                                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition-all"
                                                                    style={{
                                                                        background: reaction.users.some(u => (u._id || u) === user._id) ? 'var(--nc-primary-muted)' : 'rgba(255,255,255,0.06)',
                                                                        border: reaction.users.some(u => (u._id || u) === user._id) ? '1px solid var(--nc-primary-border)' : '1px solid var(--nc-border)',
                                                                        color: 'var(--nc-text-secondary)',
                                                                    }}
                                                                    title={reaction.users.map(u => u.email).join(', ')}
                                                                >
                                                                    <span>{reaction.emoji}</span>
                                                                    <span className="font-[600]">{reaction.users.length}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {msg.timestamp && (
                                                        <p className={`text-[10px] mt-1 font-[500] ${isCurrentUser ? 'text-right' : 'text-left pl-1'}`}
                                                            style={{ color: 'var(--nc-text-muted)' }}>
                                                            {formatTime(msg.timestamp)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )})}

                                    {/* AI Thinking Loader */}
                                    {isAiThinking && <AiThinkingAnimation />}
                                
                                </AnimatePresence>
                                )}

                                {typingUsers.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2 text-[12px] pl-1"
                                        style={{ color: 'var(--nc-text-muted)' }}
                                    >
                                        <div className="flex gap-1">
                                            {[0, 150, 300].map((delay) => (
                                                <span key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce"
                                                    style={{ background: 'var(--nc-primary)', animationDelay: `${delay}ms` }} />
                                            ))}
                                        </div>
                                        <span>
                                            {typingUsers.length === 1
                                                ? `${typingUsers[0].email} is typing…`
                                                : typingUsers.length === 2
                                                    ? `${typingUsers[0].email} and ${typingUsers[1].email} are typing…`
                                                    : `${typingUsers.length} people are typing…`
                                            }
                                        </span>
                                    </motion.div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--nc-border)' }}>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsFileUploadModalOpen(true)}
                                        className="nc-btn-icon flex-shrink-0"
                                        style={{ width: 38, height: 38 }}
                                        title="Attach files"
                                        aria-label="Attach files"
                                    >
                                        <i className="ri-attachment-2 text-[16px]" />
                                    </button>

                                    <input
                                        value={message}
                                        onChange={(e) => { setMessage(e.target.value); handleTyping() }}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type a message…"
                                        className="nc-input"
                                        style={{ height: 38, fontSize: 14, flex: 1 }}
                                        type="text"
                                        aria-label="Message input"
                                    />

                                    <button
                                        onClick={send}
                                        disabled={!message.trim()}
                                        className="nc-btn nc-btn-primary flex-shrink-0"
                                        style={{ height: 38, width: 38, padding: 0, borderRadius: 10 }}
                                        aria-label="Send"
                                    >
                                        <i className="ri-send-plane-fill text-[16px]" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <TaskList
                            tasks={project.tasks || []}
                            projectUsers={project.users || []}
                            onCreateTask={handleCreateTask}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                            onToggleTask={handleToggleTask}
                        />
                    )}

                    {/* Collaborators slide panel */}
                    <AnimatePresence>
                        {isSidePanelOpen && (
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                                className="absolute inset-0 flex flex-col z-20"
                                style={{ background: 'var(--nc-surface)' }}
                            >
                                <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--nc-border)' }}>
                                    <h2 className="text-[14px] font-[700] text-[var(--nc-text-primary)]">Collaborators</h2>
                                    <button onClick={() => setIsSidePanelOpen(false)} className="nc-btn-icon" style={{ width: 32, height: 32 }} aria-label="Close">
                                        <i className="ri-close-line text-[16px]" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                                    {project.users?.map((pu, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 rounded-[12px] transition-colors"
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Avatar email={pu.email} size="md" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-[600] text-[var(--nc-text-primary)] truncate">{pu.email}</p>
                                                <p className="text-[11px]" style={{ color: 'var(--nc-text-muted)' }}>
                                                    {project.roles?.[pu._id] || (idx === 0 ? 'Admin' : 'Member')}
                                                </p>
                                            </div>
                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--nc-success)' }} />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* ── Middle: File Explorer + Editor ── */}
                <section className="flex-grow flex h-full relative z-0 overflow-hidden">

                    {/* File Explorer */}
                    <div className="flex flex-col shrink-0" style={{ width: 220, background: 'var(--nc-surface)', borderRight: '1px solid var(--nc-border)' }}>
                        <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--nc-border)' }}>
                            <div className="flex items-center justify-between mb-2.5">
                                <p className="text-[11px] font-[700] tracking-[0.08em] uppercase" style={{ color: 'var(--nc-text-muted)', margin: 0 }}>Files</p>
                                <button
                                    onClick={downloadProjectAsZip}
                                    className="flex items-center gap-1 text-[11px] font-[600] text-[var(--nc-primary)] hover:underline cursor-pointer"
                                    title="Download whole project folder as a ZIP file"
                                    style={{ background: 'none', border: 'none', padding: 0 }}
                                >
                                    <i className="ri-download-cloud-2-line text-[13px]" style={{ color: 'var(--nc-primary)' }} />
                                    Download ZIP
                                </button>
                            </div>
                            <div className="relative">
                                <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] pointer-events-none" style={{ color: 'var(--nc-text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search files…"
                                    value={fileSearchQuery}
                                    onChange={(e) => setFileSearchQuery(e.target.value)}
                                    className="nc-input"
                                    style={{ height: 32, paddingLeft: 30, fontSize: 13 }}
                                    aria-label="Search files"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                            {fileSearchQuery ? (
                                filteredFiles.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <i className="ri-file-line text-[24px] mb-2" style={{ color: 'var(--nc-text-muted)' }} />
                                        <p className="text-[12px] font-[500]" style={{ color: 'var(--nc-text-muted)' }}>No files matched</p>
                                    </div>
                                ) : (
                                    filteredFiles.map((file, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => { setCurrentFile(file); setOpenFiles([...new Set([...openFiles, file])]) }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-left transition-all text-[13px] font-[500]"
                                            style={{
                                                background: currentFile === file ? 'var(--nc-primary-muted)' : 'transparent',
                                                color: currentFile === file ? 'var(--nc-primary)' : 'var(--nc-text-secondary)',
                                                border: `1px solid ${currentFile === file ? 'var(--nc-primary-border)' : 'transparent'}`,
                                            }}
                                        >
                                            <i className="ri-file-code-line text-[14px] flex-shrink-0" />
                                            <span className="truncate">{file}</span>
                                        </button>
                                    ))
                                )
                            ) : (
                                Object.keys(fileTree).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <i className="ri-file-line text-[24px] mb-2" style={{ color: 'var(--nc-text-muted)' }} />
                                        <p className="text-[12px] font-[500]" style={{ color: 'var(--nc-text-muted)' }}>No files yet</p>
                                    </div>
                                ) : (
                                    renderFileTree(fileTree)
                                )
                            )}
                        </div>
                    </div>

                    {/* Code Editor */}
                    <div className="flex-grow flex flex-col bg-transparent overflow-hidden">
                        {/* Open file tabs */}
                        <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto shrink-0 nc-scrollbar-hidden"
                            style={{ background: 'var(--nc-surface)', borderBottom: '1px solid var(--nc-border)' }}>
                            {openFiles.length === 0 ? (
                                <span className="text-[13px] px-3 py-1" style={{ color: 'var(--nc-text-muted)' }}>No files open</span>
                            ) : (
                                openFiles.map((file, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setCurrentFile(file)}
                                        className="flex items-center gap-2 px-3 py-1 rounded-[8px] cursor-pointer transition-all text-[13px] font-[500] flex-shrink-0"
                                        style={{
                                            background: currentFile === file ? 'var(--nc-elevated)' : 'transparent',
                                            color: currentFile === file ? 'var(--nc-text-primary)' : 'var(--nc-text-secondary)',
                                            border: `1px solid ${currentFile === file ? 'var(--nc-border)' : 'transparent'}`,
                                        }}
                                    >
                                        <i className="ri-file-code-line text-[13px]" />
                                        <span>{file}</span>
                                        <button
                                            onClick={(e) => closeFile(file, e)}
                                            className="ml-1 rounded-full w-4 h-4 flex items-center justify-center text-[11px] transition-colors"
                                            style={{ color: 'var(--nc-text-muted)' }}
                                            onMouseEnter={e => e.currentTarget.style.color = 'var(--nc-text-primary)'}
                                            onMouseLeave={e => e.currentTarget.style.color = 'var(--nc-text-muted)'}
                                        >
                                            <i className="ri-close-line" />
                                        </button>
                                    </div>
                                ))
                            )}

                            {Object.keys(fileTree).length > 0 && (
                                <Button
                                    onClick={async () => {
                                        let sandbox = lifoSandbox;
                                        if (!sandbox) {
                                            toast.loading('Initializing Lifo.sh Runtime…', { id: 'lifo-boot' });
                                            try {
                                                sandbox = await getLifoSandbox(project._id);
                                                setLifoSandbox(sandbox);
                                                toast.success('Lifo Sandbox Ready!', { id: 'lifo-boot' });
                                            } catch (e) {
                                                toast.error('Failed to initialize Lifo sandbox', { id: 'lifo-boot' });
                                                setRuntimeStatus('Failed');
                                                return;
                                            }
                                        }

                                        setIsRunning(true);
                                        setTerminalOutput('');
                                        setIframeUrl(null);

                                        try {
                                            const result = await runLifoProject({
                                                sandbox,
                                                fileTree,
                                                onStatusChange: (status) => {
                                                    setRuntimeStatus(status);
                                                },
                                                onLog: (logText) => {
                                                    setTerminalOutput(prev => prev + logText);
                                                }
                                            });

                                            if (result.success && result.previewUrl) {
                                                setIframeUrl(result.previewUrl);
                                                setPreviewsList(result.previews || []);
                                                toast.success('Application running in Lifo.sh preview!');
                                            } else if (result.reason === 'unsupported_native') {
                                                toast.error('Native binary dependencies detected (see console).');
                                            } else {
                                                toast.error(result.message || 'Execution completed with warnings.');
                                            }
                                        } catch (error) {
                                            console.error('Lifo execution exception:', error);
                                            setRuntimeStatus('Failed');
                                            setTerminalOutput(prev => prev + `\nExecution Error: ${error.message || String(error)}\n`);
                                            toast.error(`Execution note: ${error.message || 'Check console output'}`);
                                        } finally {
                                            setIsRunning(false);
                                        }
                                    }}
                                    size="sm"
                                    loading={isRunning}
                                    variant="primary"
                                    icon={<i className={isRunning ? "ri-loader-4-line nc-spin" : "ri-play-fill"} />}
                                    className="ml-auto flex-shrink-0"
                                    style={{ height: 30, padding: '0 12px', fontSize: 13 }}
                                >
                                    {isRunning ? runtimeStatus : 'Run'}
                                </Button>
                            )}
                        </div>

                        {/* Editor content */}
                        <div className="flex-grow flex flex-col overflow-hidden">
                            <div className="flex-grow overflow-hidden relative">
                                {(() => {
                                    const openFileObj = getFileByPathString(fileTree, currentFile);
                                    if (openFileObj) {
                                        return (
                                            <div className="h-full code-editor-container">
                                                <div className="line-numbers">
                                                    {openFileObj.file.contents.split('\n').map((_, idx) => (
                                                        <div key={idx} className="line-number" />
                                                    ))}
                                                </div>
                                                <div className="code-content">
                                                    <pre className="hljs h-full">
                                                        <code
                                                            className="hljs outline-none"
                                                            contentEditable
                                                            suppressContentEditableWarning
                                                            onBlur={(e) => {
                                                                const updatedContent = e.target.innerText
                                                                const ft = updateFileInTreeByPathString(fileTree, currentFile, updatedContent)
                                                                setFileTree(ft)
                                                                saveFileTree(ft)
                                                            }}
                                                            dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', openFileObj.file.contents).value }}
                                                            style={{ whiteSpace: 'pre', paddingBottom: '25rem' }}
                                                        />
                                                    </pre>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="h-full flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="w-16 h-16 mx-auto rounded-[16px] flex items-center justify-center mb-4"
                                                        style={{ background: 'var(--nc-primary-muted)', border: '1px solid var(--nc-primary-border)' }}>
                                                        <i className="ri-terminal-box-line text-[28px]" style={{ color: 'var(--nc-primary)' }} />
                                                    </div>
                                                    <h3 className="text-[16px] font-[700] text-[var(--nc-text-primary)] mb-1">Editor Ready</h3>
                                                    <p className="text-[13px]" style={{ color: 'var(--nc-text-secondary)' }}>Select a file from the explorer</p>
                                                </div>
                                            </div>
                                        );
                                    }
                                })()}
                            </div>

                            {/* Terminal output panel */}
                            {terminalOutput && (
                                <div
                                    className="h-44 border-t flex flex-col shrink-0"
                                    style={{ background: '#09090F', borderColor: 'var(--nc-border)' }}
                                >
                                    <div className="px-4 py-2 flex items-center justify-between border-b" style={{ borderColor: 'var(--nc-border)' }}>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--nc-primary)' }} />
                                            <span className="text-[10px] font-[700] uppercase tracking-[0.08em]" style={{ color: 'var(--nc-text-secondary)' }}>Console Output</span>
                                        </div>
                                        <button
                                            onClick={() => setTerminalOutput('')}
                                            className="text-[10px] font-[600] hover:text-[var(--nc-text-primary)]"
                                            style={{ color: 'var(--nc-text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <pre
                                        className="flex-grow p-3 overflow-y-auto font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-text nc-scrollbar-hidden"
                                        style={{ color: '#E2E8F0', margin: 0 }}
                                        ref={(el) => { if (el) el.scrollTop = el.scrollHeight }}
                                    >
                                        {terminalOutput}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Resizer Handle */}
                <div
                    onMouseDown={handleMouseDown}
                    className={`preview-resizer ${isDragging ? 'dragging' : ''}`}
                    title="Drag to resize Live Preview"
                />

                {/* ── Right: Live Preview & AI Assistant ── */}
                <motion.section
                    className="flex flex-col shrink-0 overflow-hidden"
                    style={{ 
                        width: previewPanelWidth, 
                        background: 'var(--nc-bg)', 
                        borderLeft: '1px solid var(--nc-border)', 
                        position: 'relative', 
                        zIndex: 20 
                    }}
                >
                    {iframeUrl ? (
                        <div className="preview-canvas-container">
                            {/* Device Selector Toolbar */}
                            <div className="flex items-center justify-between gap-2 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--nc-border)', background: 'var(--nc-surface)' }}>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <div className="w-5 h-5 rounded-[5px] flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}>
                                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--nc-success)' }} />
                                    </div>
                                    <span className="text-[11px] font-[800] tracking-wider" style={{ color: 'var(--nc-success)' }}>LIVE PREVIEW</span>
                                </div>

                                {/* Device Presets Button Group */}
                                <div className="flex items-center gap-0.5 border rounded-[8px] p-0.5" style={{ borderColor: 'var(--nc-border)', background: 'var(--nc-bg)' }}>
                                    {[
                                        { id: 'mobile', icon: 'ri-smartphone-line', tooltip: 'Phone View (375x812)' },
                                        { id: 'tablet', icon: 'ri-tablet-line', tooltip: 'Tablet View (768x1024)' },
                                        { id: 'laptop', icon: 'ri-computer-line', tooltip: 'Laptop View (1024x640)' },
                                        { id: 'responsive', icon: 'ri-aspect-ratio-line', tooltip: 'Responsive View (Custom)' },
                                    ].map((device) => (
                                        <button
                                            key={device.id}
                                            onClick={() => {
                                                setPreviewDevice(device.id);
                                                if (device.id === 'laptop') {
                                                    setPreviewOrientation('landscape');
                                                } else {
                                                    setPreviewOrientation('portrait');
                                                }
                                            }}
                                            className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-all"
                                            title={device.tooltip}
                                            style={{
                                                border: 'none',
                                                background: previewDevice === device.id ? 'var(--nc-primary-muted)' : 'transparent',
                                                color: previewDevice === device.id ? 'var(--nc-primary)' : 'var(--nc-text-muted)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <i className={`${device.icon} text-[13px]`} />
                                        </button>
                                    ))}
                                </div>

                                {/* Orientation & Zoom & Extra controls */}
                                <div className="flex items-center gap-1.5">
                                    {previewDevice !== 'responsive' && (
                                        <button
                                            onClick={() => setPreviewOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait')}
                                            className="w-7 h-7 rounded-[6px] border flex items-center justify-center transition-colors"
                                            title={`Rotate Screen (${previewOrientation === 'portrait' ? 'Landscape' : 'Portrait'})`}
                                            style={{
                                                borderColor: 'var(--nc-border)',
                                                background: 'var(--nc-bg)',
                                                color: 'var(--nc-text-secondary)',
                                                cursor: 'pointer',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--nc-border-hover)'}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--nc-border)'}
                                        >
                                            <i className={`ri-clockwise-2-line text-[13px] transition-transform duration-300 ${previewOrientation === 'landscape' ? 'rotate-90' : ''}`} />
                                        </button>
                                    )}

                                    {/* Zoom Dropdown */}
                                    <select
                                        value={previewZoom}
                                        onChange={(e) => setPreviewZoom(e.target.value)}
                                        className="nc-input"
                                        style={{
                                            height: 28,
                                            fontSize: 11,
                                            background: 'var(--nc-bg)',
                                            border: '1px solid var(--nc-border)',
                                            color: 'var(--nc-text-primary)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            outline: 'none',
                                            padding: '0 6px',
                                            width: 60,
                                        }}
                                        title="Zoom scale"
                                    >
                                        <option value="fit">Fit</option>
                                        <option value="0.5">50%</option>
                                        <option value="0.75">75%</option>
                                        <option value="1.0">100%</option>
                                        <option value="1.25">125%</option>
                                    </select>
                                </div>
                            </div>

                            {/* Path Selector Bar / URL display */}
                            <div className="flex items-center gap-2 px-4 py-2 shrink-0 border-b" style={{ background: 'var(--nc-surface)', borderColor: 'var(--nc-border)' }}>
                                <i className="ri-global-line text-[13px]" style={{ color: 'var(--nc-text-muted)' }} />
                                {previewsList && previewsList.length > 1 ? (
                                    <select
                                        value={iframeUrl}
                                        onChange={(e) => setIframeUrl(e.target.value)}
                                        className="nc-input flex-1"
                                        style={{
                                            height: 26,
                                            fontSize: 11,
                                            background: 'var(--nc-bg)',
                                            border: '1px solid var(--nc-border)',
                                            color: 'var(--nc-text-primary)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            outline: 'none',
                                            padding: '0 6px'
                                        }}
                                    >
                                        {previewsList.map((p, idx) => (
                                            <option key={idx} value={p.url} style={{ background: 'var(--nc-bg)', color: 'var(--nc-text-primary)' }}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text" value={iframeUrl} readOnly
                                        className="nc-input flex-1"
                                        style={{ height: 26, fontSize: 11, cursor: 'default', background: 'transparent', border: 'none', color: 'var(--nc-text-muted)' }}
                                        title="Lifo Sandbox URL"
                                    />
                                )}
                            </div>

                            {/* Width Controller (only show when responsive mode is active) */}
                            {previewDevice === 'responsive' && (
                                <div className="flex items-center gap-3 px-4 py-2 shrink-0 border-b" style={{ background: 'var(--nc-surface)', borderColor: 'var(--nc-border)' }}>
                                    <span className="text-[10px] font-[600] uppercase tracking-wider text-[var(--nc-text-muted)] w-20">
                                        Width: {previewWidth}px
                                    </span>
                                    <input
                                        type="range"
                                        min="320"
                                        max="1200"
                                        step="10"
                                        value={previewWidth}
                                        onChange={(e) => setPreviewWidth(Number(e.target.value))}
                                        className="flex-1 cursor-pointer accent-[var(--nc-primary)]"
                                        style={{ height: 4 }}
                                        aria-label="Device width simulation"
                                    />
                                    <button
                                        onClick={() => setPreviewWidth(375)}
                                        className="text-[10px] px-2 py-0.5 rounded font-[500] hover:bg-[rgba(34,197,94,0.15)] transition-colors"
                                        style={{ background: 'var(--nc-elevated)', border: '1px solid var(--nc-border)', color: 'var(--nc-text-secondary)', cursor: 'pointer' }}
                                    >
                                        Reset
                                    </button>
                                </div>
                            )}

                            {/* Canvas Viewport containing simulated device */}
                            {(() => {
                                const deviceDimensions = {
                                    mobile: {
                                        portrait: { width: 375, height: 812 },
                                        landscape: { width: 812, height: 375 }
                                    },
                                    tablet: {
                                        portrait: { width: 768, height: 1024 },
                                        landscape: { width: 1024, height: 768 }
                                    },
                                    laptop: {
                                        portrait: { width: 800, height: 1200 },
                                        landscape: { width: 1024, height: 640 }
                                    },
                                    responsive: {
                                        portrait: { width: previewWidth, height: '100%' },
                                        landscape: { width: previewWidth, height: '100%' }
                                    }
                                };

                                const dims = deviceDimensions[previewDevice][previewOrientation];
                                const devWidth = dims.width;
                                const devHeight = dims.height;

                                let scale = 1;
                                if (previewZoom === 'fit') {
                                    const canvasPadding = 80;
                                    const availableWidth = previewPanelWidth - canvasPadding;
                                    if (devWidth > availableWidth) {
                                        scale = availableWidth / devWidth;
                                    }
                                } else {
                                    scale = Number(previewZoom);
                                }

                                return (
                                    <div className="preview-canvas">
                                        <div 
                                            className="device-wrapper"
                                            style={{
                                                transform: `scale(${scale})`,
                                                width: devWidth,
                                                height: previewDevice === 'laptop' && previewOrientation === 'landscape' 
                                                    ? (typeof devHeight === 'number' ? devHeight + 12 : devHeight) 
                                                    : devHeight,
                                                flexShrink: 0
                                            }}
                                        >
                                            {previewDevice === 'mobile' && (
                                                <div className="device-phone" style={{ width: devWidth, height: devHeight }}>
                                                    <div className="device-phone-speaker" />
                                                    <div className="device-phone-camera" />
                                                    <iframe
                                                        src={iframeUrl}
                                                        title="Mobile Preview"
                                                        style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                                                    />
                                                </div>
                                            )}

                                            {previewDevice === 'tablet' && (
                                                <div className="device-tablet" style={{ width: devWidth, height: devHeight }}>
                                                    <div className="device-tablet-camera" />
                                                    <iframe
                                                        src={iframeUrl}
                                                        title="Tablet Preview"
                                                        style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                                                    />
                                                </div>
                                            )}

                                            {previewDevice === 'laptop' && (
                                                <div className="flex flex-col items-center w-full h-full">
                                                    <div className="device-laptop" style={{ width: devWidth, height: devHeight }}>
                                                        <div className="device-laptop-camera" />
                                                        <iframe
                                                            src={iframeUrl}
                                                            title="Laptop Preview"
                                                            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                                                        />
                                                    </div>
                                                    {previewOrientation === 'landscape' && (
                                                        <div className="device-laptop-base" style={{ width: devWidth }} />
                                                    )}
                                                </div>
                                            )}

                                            {previewDevice === 'responsive' && (
                                                <div className="device-responsive" style={{ width: devWidth, height: '100%', minHeight: 400 }}>
                                                    <iframe
                                                        src={iframeUrl}
                                                        title="Responsive Preview"
                                                        style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                            <RobotSkeleton 
                                state={isRunning ? 'thinking' : terminalOutput.includes('UNSUPPORTED') || terminalOutput.includes('Error:') ? 'error' : 'idle'} 
                                message={isRunning ? `${runtimeStatus}…` : terminalOutput.includes('UNSUPPORTED') ? 'Unsupported native framework' : 'Click Run to boot project inside Lifo.sh sandbox!'}
                            />
                        </div>
                    )}
                </motion.section>
            </div>

            {/* ── Add Collaborators Modal ── */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Invite collaborators" subtitle="Send invitation to join this project" size="md">
                <div className="space-y-2 mb-5 max-h-80 overflow-y-auto">
                    {users.filter(u => !project.users.find(pu => pu._id === u._id)).map(u => (
                        <button
                            key={u._id}
                            className="w-full flex items-center gap-3 p-3 rounded-[12px] text-left transition-all"
                            style={{
                                background: selectedUserId.has(u._id) ? 'var(--nc-primary-muted)' : 'var(--nc-surface)',
                                border: `1px solid ${selectedUserId.has(u._id) ? 'var(--nc-primary-border)' : 'var(--nc-border)'}`,
                            }}
                            onClick={() => handleUserClick(u._id)}
                        >
                            <Avatar email={u.email} size="md" />
                            <span className="flex-1 text-[14px] font-[600] text-[var(--nc-text-primary)]">{u.email}</span>
                            {selectedUserId.has(u._id) && (
                                <i className="ri-checkbox-circle-fill text-[18px]" style={{ color: 'var(--nc-primary)' }} />
                            )}
                        </button>
                    ))}
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setIsModalOpen(false)} fullWidth>Cancel</Button>
                    <Button variant="primary" onClick={addCollaborators} disabled={selectedUserId.size === 0} icon={<i className="ri-mail-send-line" />} fullWidth>
                        Send Invites {selectedUserId.size > 0 ? `(${selectedUserId.size})` : ''}
                    </Button>
                </div>
            </Modal>

            {/* ── File Upload Modal ── */}
            <Modal isOpen={isFileUploadModalOpen} onClose={() => !uploadingFiles && setIsFileUploadModalOpen(false)} title="Upload files" size="lg">
                <FileUpload onFilesSelected={handleFileUpload} />
                {uploadingFiles && (
                    <div className="mt-4 flex items-center justify-center gap-2" style={{ color: 'var(--nc-primary)' }}>
                        <i className="ri-loader-4-line nc-spin text-[18px]" />
                        <span className="text-[14px] font-[600]">Uploading files…</span>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default Project
