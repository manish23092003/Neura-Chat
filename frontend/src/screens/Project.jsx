import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js'
import { getWebContainer } from '../config/webcontainer'
import { transformFileTree } from '../utils/fileUtils'
import Modal from '../components/Modal'
import Button from '../components/Button'
import FilePreview from '../components/FilePreview'
import FileUpload from '../components/FileUpload'
import TaskList from '../components/TaskList'

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
                    className="absolute top-1 right-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded flex items-center gap-1 transition-all z-50 shadow-lg"
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

    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState(new Set())
    const [project, setProject] = useState(location.state.project)
    const [message, setMessage] = useState('')
    const [users, setUsers] = useState([])
    const [messages, setMessages] = useState([])
    const [fileTree, setFileTree] = useState({})
    const [currentFile, setCurrentFile] = useState(null)
    const [openFiles, setOpenFiles] = useState([])
    const [webContainer, setWebContainer] = useState(null)
    const [iframeUrl, setIframeUrl] = useState(null)
    const [runProcess, setRunProcess] = useState(null)
    const [isRunning, setIsRunning] = useState(false)
    const [fileSearchQuery, setFileSearchQuery] = useState('')
    const [showReactionPicker, setShowReactionPicker] = useState(null) // Track which message shows reaction picker
    const [typingUsers, setTypingUsers] = useState([]) // Track who is typing
    const typingTimeoutRef = useRef(null) // For debouncing typing indicator
    const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false)
    const [uploadingFiles, setUploadingFiles] = useState(false)
    const [activeTab, setActiveTab] = useState('chat') // 'chat', 'tasks', 'files'

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
            toast.success('Collaborators added successfully!')
            setIsModalOpen(false)
            setSelectedUserId(new Set())
            // Refresh project data
            axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {
                setProject(res.data.project)
            })
        }).catch(err => {
            console.log(err)
            toast.error('Failed to add collaborators')
        })
    }

    const send = () => {
        if (!message.trim()) return

        const messageData = {
            message,
            sender: user,
            timestamp: new Date().toISOString(),
            reactions: [] // Initialize empty reactions array
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

    const handleReaction = (messageIndex, emoji) => {
        setMessages(prevMessages => {
            const newMessages = [...prevMessages]
            const message = newMessages[messageIndex]

            // Initialize reactions array if it doesn't exist
            if (!message.reactions) {
                message.reactions = []
            }

            // Find if this emoji already exists
            const existingReaction = message.reactions.find(r => r.emoji === emoji)

            if (existingReaction) {
                // Check if user already reacted with this emoji
                const userIndex = existingReaction.users.findIndex(u => u._id === user._id)
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
                messageIndex,
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
            const response = await axios.post('/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            const uploadedFiles = response.data.files

            // Send file message via socket
            const fileMessage = {
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

    function WriteAiMessage(message) {
        try {
            const messageObject = JSON.parse(message)
            return (
                <div className='overflow-auto bg-slate-900 text-white rounded-lg p-3 border border-slate-700'>
                    <Markdown
                        children={messageObject.text}
                        options={{
                            overrides: {
                                code: SyntaxHighlightedCode,
                            },
                        }}
                    />
                </div>
            )
        } catch (e) {
            return (
                <div className='overflow-auto bg-slate-900 text-white rounded-lg p-3 border border-slate-700'>
                    <p>{message}</p>
                </div>
            )
        }
    }

    useEffect(() => {
        let isMounted = true
        let unsubscribeServerReady = null
        const socket = initializeSocket(project._id)

        if (!webContainer) {
            getWebContainer().then(container => {
                if (!isMounted) return
                setWebContainer(container)
                console.log("container started")

                console.log("container started")
            })
        }

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
                let message
                try {
                    message = JSON.parse(data.message)
                } catch (e) {
                    message = { text: data.message }
                }

                if (message.fileTree) {
                    webContainer?.mount(transformFileTree(message.fileTree))
                    setFileTree(message.fileTree || {})
                    saveFileTree(message.fileTree || {}) // Persist to backend
                }
            }
            setMessages(prevMessages => [...prevMessages, data])
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
                if (newMessages[data.messageIndex]) {
                    newMessages[data.messageIndex].reactions = data.reactions
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

        axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {
            setProject(res.data.project)
            setFileTree(res.data.project.fileTree || {})
            if (res.data.project.messages) {
                setMessages(res.data.project.messages)
                setTimeout(() => {
                    if (messageBox.current) {
                        messageBox.current.scrollTop = messageBox.current.scrollHeight
                    }
                }, 100)
            }
        })

        axios.get('/users/all').then(res => {
            setUsers(res.data.users)
        }).catch(err => {
            console.log(err)
        })

        // Cleanup function to remove event listener
        return () => {
            isMounted = false
            toast.dismiss('server-ready')

            if (unsubscribeServerReady) {
                unsubscribeServerReady()
            }
            if (socket) {
                socket.off('project-message', messageHandler)
                socket.off('user-typing-start', typingStartHandler)
                socket.off('user-typing-stop', typingStopHandler)
                socket.off('message-reaction', reactionHandler)
                socket.off('project-file-message', fileMessageHandler)
            }
        }
    }, [])

    useEffect(() => {
        if (!webContainer) return;

        console.log("Setting up server-ready listener");
        const unsubscribe = webContainer.on('server-ready', (port, url) => {
            console.log('Server ready - Port:', port, 'URL:', url);
            const fullUrl = url.startsWith('http') ? url : `http://localhost:${port}`;
            setIframeUrl(fullUrl);
            setRunProcess(true) // Ensure runProcess state matches
            toast.success('Previews Enabled', { id: 'server-preview' });
        });

        return () => {
            console.log("Cleaning up server-ready listener");
            unsubscribe();
        };
    }, [webContainer]);

    // Cleanup running process on unmount
    // Cleanup running process on unmount
    useEffect(() => {
        return () => {
            // Do not kill process on unmount, allow it to run in background
            // if (runProcess) {
            //     console.log("Cleaning up running process");
            //     runProcess.kill();
            // }
        };
    }, [runProcess]);

    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log(res.data)
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

    const filteredFiles = Object.keys(fileTree).filter(file =>
        file.toLowerCase().includes(fileSearchQuery.toLowerCase())
    )

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



    // Clear chat handler
    const handleClearChat = async () => {
        if (!confirm('Are you sure you want to clear the chat? This action cannot be undone.')) {
            return
        }

        try {
            await axios.put(`/projects/${project._id}/clear-chat`)
            setMessages([])
            sendMessage('project-chat-cleared', { user })
            toast.success('Chat cleared successfully')
        } catch (error) {
            console.error('Clear chat error:', error)
            toast.error('Failed to clear chat')
        }
    }

    // Effect to listen for remote clears
    useEffect(() => {
        const handleChatCleared = (data) => {
            setMessages([])
            toast.success(`Chat cleared by ${data.user.email}`)
        }
        receiveMessage('project-chat-cleared', handleChatCleared)
    }, [])

    return (
        <main className='h-screen w-screen flex flex-col bg-slate-950'>
            {/* Header */}
            <header className='flex justify-between items-center px-6 py-4 bg-slate-900 border-b border-slate-800'>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <i className="ri-arrow-left-line text-slate-400 text-xl"></i>
                    </button>
                    <div>
                        <h1 className='text-xl font-bold text-white'>{project.name}</h1>
                        <p className="text-sm text-slate-400">{project.users.length} collaborators</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleClearChat}
                        className="p-2 hover:bg-red-900/50 text-red-500 rounded-lg transition-colors"
                        title="Clear Chat"
                    >
                        <i className="ri-delete-bin-line text-xl"></i>
                    </button>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        variant="secondary"
                        size="small"
                        icon={<i className="ri-user-add-line"></i>}
                    >
                        Add Collaborator
                    </Button>
                    <button
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                        className='p-2 hover:bg-slate-800 rounded-lg transition-colors'
                    >
                        <i className="ri-group-fill text-slate-400 text-xl"></i>
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel - Chat & Tasks */}
                <section className="relative flex flex-col h-full w-96 bg-slate-900 border-r border-slate-800">
                    {/* Tab Header */}
                    <div className="p-4 border-b border-slate-800">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'chat'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                <i className="ri-chat-3-line mr-2"></i>
                                Chat
                            </button>
                            <button
                                onClick={() => setActiveTab('tasks')}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'tasks'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                <i className="ri-task-line mr-2"></i>
                                Tasks
                                {project.tasks && project.tasks.length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full">
                                        {project.tasks.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'chat' ? (
                        <div className="conversation-area flex-grow flex flex-col h-full relative overflow-hidden">
                            <div
                                ref={messageBox}
                                className="message-box p-4 flex-grow flex flex-col gap-3 overflow-auto"
                            >
                                <AnimatePresence>
                                    {messages.map((msg, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${msg.sender._id == user._id ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[85%] ${msg.sender._id === 'ai' ? 'max-w-full' : ''}`}>
                                                {msg.sender._id !== user._id && (
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white text-xs font-semibold">
                                                            {msg.sender.email?.charAt(0).toUpperCase() || 'A'}
                                                        </div>
                                                        <span className="text-xs text-slate-400">{msg.sender.email || 'AI Assistant'}</span>
                                                    </div>
                                                )}
                                                <div className="relative">
                                                    <div className={`rounded-2xl p-3 ${msg.sender._id === 'ai'
                                                        ? 'bg-slate-800 border border-slate-700'
                                                        : msg.sender._id == user._id
                                                            ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white'
                                                            : 'bg-slate-800 text-white'
                                                        } group relative`}>
                                                        {msg.sender._id === 'ai' ?
                                                            WriteAiMessage(msg.message) :
                                                            <p className="text-sm break-words">{msg.message}</p>
                                                        }

                                                        {/* File Attachments */}
                                                        {msg.files && msg.files.length > 0 && (
                                                            <div className="file-attachments-container mt-2">
                                                                {msg.files.map((file, fileIndex) => (
                                                                    <FilePreview
                                                                        key={fileIndex}
                                                                        file={file}
                                                                        onDownload={handleFileDownload}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Reaction Button - Shows on hover */}
                                                        {msg.sender._id !== 'ai' && (
                                                            <button
                                                                onClick={() => setShowReactionPicker(showReactionPicker === index ? null : index)}
                                                                className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700 hover:bg-slate-600 rounded-full p-1 text-xs"
                                                                title="Add reaction"
                                                            >
                                                                <i className="ri-emotion-line"></i>
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Reaction Picker */}
                                                    {showReactionPicker === index && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className={`absolute ${msg.sender._id == user._id ? 'right-0' : 'left-0'} top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 flex gap-1 shadow-xl z-10`}
                                                        >
                                                            {availableReactions.map((emoji, emojiIndex) => (
                                                                <button
                                                                    key={emojiIndex}
                                                                    onClick={() => handleReaction(index, emoji)}
                                                                    className="text-xl hover:scale-125 transition-transform p-1"
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}

                                                    {/* Display Reactions */}
                                                    {msg.reactions && msg.reactions.length > 0 && (
                                                        <div className={`flex flex-wrap gap-1 mt-2 ${msg.sender._id == user._id ? 'justify-end' : 'justify-start'}`}>
                                                            {msg.reactions.map((reaction, reactionIndex) => (
                                                                <button
                                                                    key={reactionIndex}
                                                                    onClick={() => handleReaction(index, reaction.emoji)}
                                                                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${reaction.users.some(u => u._id === user._id)
                                                                        ? 'bg-purple-600/30 border border-purple-500'
                                                                        : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-700'
                                                                        }`}
                                                                    title={reaction.users.map(u => u.email).join(', ')}
                                                                >
                                                                    <span>{reaction.emoji}</span>
                                                                    <span className="text-slate-300">{reaction.users.length}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {msg.timestamp && (
                                                        <p className={`text-xs text-slate-500 mt-1 ${msg.sender._id == user._id ? 'text-right' : 'text-left'}`}>
                                                            {formatTime(msg.timestamp)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {/* Typing Indicator */}
                                {typingUsers.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="px-4 py-2 text-xs text-slate-400 italic flex items-center gap-2"
                                    >
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                        <span>
                                            {typingUsers.length === 1
                                                ? `${typingUsers[0].email} is typing...`
                                                : typingUsers.length === 2
                                                    ? `${typingUsers[0].email} and ${typingUsers[1].email} are typing...`
                                                    : `${typingUsers.length} people are typing...`
                                            }
                                        </span>
                                    </motion.div>
                                )}
                            </div>

                            <div className="p-4 border-t border-slate-800 bg-slate-900">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsFileUploadModalOpen(true)}
                                        className='px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all'
                                        title="Attach files"
                                    >
                                        <i className="ri-attachment-2"></i>
                                    </button>
                                    <input
                                        value={message}
                                        onChange={(e) => {
                                            setMessage(e.target.value)
                                            handleTyping()
                                        }}
                                        onKeyPress={handleKeyPress}
                                        className='input flex-grow'
                                        type="text"
                                        placeholder='Type a message...'
                                    />
                                    <button
                                        onClick={send}
                                        className='px-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all'
                                    >
                                        <i className="ri-send-plane-fill"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Tasks Tab */
                        <TaskList
                            tasks={project.tasks || []}
                            projectUsers={project.users || []}
                            onCreateTask={handleCreateTask}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                            onToggleTask={handleToggleTask}
                        />
                    )}

                    {/* Collaborators Side Panel */}
                    <AnimatePresence>
                        {isSidePanelOpen && (
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25 }}
                                className='absolute inset-0 flex flex-col gap-2 glass-strong z-10'
                            >
                                <header className='flex justify-between items-center px-4 py-3 border-b border-white/10'>
                                    <h2 className='font-semibold text-lg text-white'>Collaborators</h2>
                                    <button
                                        onClick={() => setIsSidePanelOpen(false)}
                                        className='p-2 hover:bg-white/10 rounded-lg transition-colors'
                                    >
                                        <i className="ri-close-fill text-xl text-slate-300"></i>
                                    </button>
                                </header>
                                <div className="users flex flex-col gap-2 p-4 overflow-auto">
                                    {project.users && project.users.map((projectUser, idx) => (
                                        <div key={idx} className="user cursor-pointer hover:bg-white/5 p-3 rounded-lg flex gap-3 items-center transition-colors">
                                            <div className='w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white font-semibold'>
                                                {projectUser.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className='font-semibold text-white'>{projectUser.email}</h3>
                                                <p className="text-xs text-slate-400">Active now</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* Middle Section - Code Editor */}
                <section className="flex-grow flex h-full">
                    {/* File Explorer */}
                    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
                        <div className="p-4 border-b border-slate-800">
                            <h2 className="text-sm font-semibold text-white mb-3">FILES</h2>
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={fileSearchQuery}
                                onChange={(e) => setFileSearchQuery(e.target.value)}
                                className="input text-sm py-2"
                            />
                        </div>
                        <div className="file-tree flex-1 overflow-auto p-2">
                            {filteredFiles.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <i className="ri-file-line text-3xl mb-2"></i>
                                    <p className="text-sm">No files yet</p>
                                </div>
                            ) : (
                                filteredFiles.map((file, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setCurrentFile(file)
                                            setOpenFiles([...new Set([...openFiles, file])])
                                        }}
                                        className={`w-full text-left p-2 px-3 rounded-lg flex items-center gap-2 transition-colors ${currentFile === file
                                            ? 'bg-purple-600/20 text-purple-400'
                                            : 'text-slate-300 hover:bg-slate-800'
                                            }`}
                                    >
                                        <i className="ri-file-code-line"></i>
                                        <span className="text-sm truncate">{file}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Code Editor Area */}
                    <div className="flex-grow flex flex-col bg-slate-950">
                        {/* Tabs */}
                        <div className="flex items-center gap-1 bg-slate-900 border-b border-slate-800 p-2 overflow-x-auto">
                            {openFiles.length === 0 ? (
                                <div className="text-slate-500 text-sm px-4 py-2">No files open</div>
                            ) : (
                                openFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        onClick={() => setCurrentFile(file)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${currentFile === file
                                            ? 'bg-slate-800 text-white'
                                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                            }`}
                                    >
                                        <i className="ri-file-code-line text-sm"></i>
                                        <span className="text-sm">{file}</span>
                                        <div className="flex items-center gap-1 ml-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(fileTree[file].file.contents)
                                                    toast.success('Copied to clipboard')
                                                }}
                                                className="hover:text-purple-400 transition-colors p-1"
                                                title="Copy code"
                                            >
                                                <i className="ri-file-copy-line text-sm"></i>
                                            </button>
                                            <button
                                                onClick={(e) => closeFile(file, e)}
                                                className="hover:text-red-400 transition-colors p-1"
                                            >
                                                <i className="ri-close-line text-sm"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}

                            {openFiles.length > 0 && (
                                <Button
                                    onClick={async () => {
                                        // Check if webContainer is ready
                                        if (!webContainer) {
                                            toast.error('WebContainer is not ready yet. Please wait a moment and try again.')
                                            return
                                        }

                                        setIsRunning(true)
                                        try {
                                            await webContainer.mount(transformFileTree(fileTree))

                                            // Check if package.json exists and has changed
                                            const packageJson = fileTree['package.json']?.file?.contents
                                            const needsInstall = packageJson && packageJson !== window.lastPackageJson

                                            if (needsInstall) {
                                                toast.loading('Installing dependencies...', { id: 'install' })
                                                const installProcess = await webContainer.spawn("npm", ["install"])

                                                installProcess.output.pipeTo(new WritableStream({
                                                    write(chunk) {
                                                        console.log(chunk)
                                                    }
                                                }))

                                                // Wait for install to complete
                                                await installProcess.exit
                                                window.lastPackageJson = packageJson
                                                toast.success('Dependencies installed!', { id: 'install' })
                                            } else if (packageJson) {
                                                toast.success('Using cached dependencies', { duration: 1000 })
                                            }

                                            // kill previous process if running
                                            if (runProcess) {
                                                console.log("Killing previous process");
                                                try {
                                                    runProcess.kill();
                                                } catch (e) {
                                                    console.warn("Failed to kill previous process:", e);
                                                }
                                            }

                                            toast.loading('Starting server...', { id: 'start' })

                                            setIframeUrl(null) // Reset iframe

                                            const randomPort = Math.floor(Math.random() * 1000) + 3000;
                                            console.log("Starting server on port:", randomPort);

                                            let tempRunProcess = await webContainer.spawn("npm", ["start"], {
                                                env: {
                                                    PORT: String(randomPort)
                                                }
                                            })

                                            tempRunProcess.output.pipeTo(new WritableStream({
                                                write(chunk) {
                                                    console.log(chunk)
                                                }
                                            }))

                                            setRunProcess(tempRunProcess)
                                            toast.dismiss('start')
                                        } catch (error) {
                                            toast.error('Failed to run project')
                                            console.error(error)
                                        } finally {
                                            setIsRunning(false)
                                        }
                                    }}
                                    variant="primary"
                                    size="small"
                                    loading={isRunning}
                                    className="ml-auto"
                                    icon={<i className="ri-play-fill"></i>}
                                >
                                    Run
                                </Button>
                            )}
                        </div>

                        {/* Editor */}
                        <div className="flex-grow overflow-hidden">
                            {fileTree[currentFile] ? (
                                <div className="h-full code-editor-container">
                                    {/* Line Numbers */}
                                    <div className="line-numbers">
                                        {fileTree[currentFile].file.contents.split('\n').map((_, index) => (
                                            <div key={index} className="line-number"></div>
                                        ))}
                                    </div>

                                    {/* Code Content */}
                                    <div className="code-content">
                                        <pre className="hljs h-full">
                                            <code
                                                className="hljs outline-none"
                                                contentEditable
                                                suppressContentEditableWarning
                                                onBlur={(e) => {
                                                    const updatedContent = e.target.innerText
                                                    const ft = {
                                                        ...fileTree,
                                                        [currentFile]: {
                                                            file: {
                                                                contents: updatedContent
                                                            }
                                                        }
                                                    }
                                                    setFileTree(ft)
                                                    saveFileTree(ft)
                                                }}
                                                dangerouslySetInnerHTML={{
                                                    __html: hljs.highlight('javascript', fileTree[currentFile].file.contents).value
                                                }}
                                                style={{
                                                    whiteSpace: 'pre-wrap',
                                                    paddingBottom: '25rem',
                                                }}
                                            />
                                        </pre>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-500">
                                    <div className="text-center">
                                        <i className="ri-code-s-slash-line text-6xl mb-4"></i>
                                        <p>Select a file to start editing</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Right Panel - Preview */}
                {iframeUrl && (
                    <motion.section
                        initial={{ width: 0 }}
                        animate={{ width: '400px' }}
                        className="bg-slate-900 border-l border-slate-800 flex flex-col"
                    >
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                            <h2 className="text-sm font-semibold text-white">PREVIEW</h2>
                        </div>

                        <div className="flex-1 bg-slate-950 p-2 overflow-hidden relative">
                            {/* Iframe for web apps */}
                            <iframe
                                src={iframeUrl}
                                className="absolute inset-0 w-full h-full bg-white"
                                style={{ zIndex: 10 }}
                            ></iframe>
                        </div>
                    </motion.section>
                )}
            </div>

            {/* Add Collaborators Modal */}
            < Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add Collaborators"
                size="medium"
            >
                <div className="users-list flex flex-col gap-2 mb-6 max-h-96 overflow-auto">
                    {users.filter(u => !project.users.find(pu => pu._id === u._id)).map(user => (
                        <div
                            key={user._id}
                            className={`user cursor-pointer hover:bg-white/5 p-3 rounded-lg flex gap-3 items-center transition-colors ${selectedUserId.has(user._id) ? 'bg-purple-600/20 border border-purple-500' : ''
                                }`}
                            onClick={() => handleUserClick(user._id)}
                        >
                            <div className='w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white font-semibold'>
                                {user.email.charAt(0).toUpperCase()}
                            </div>
                            <h3 className='font-semibold text-white flex-1'>{user.email}</h3>
                            {selectedUserId.has(user._id) && (
                                <i className="ri-check-line text-purple-400"></i>
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => setIsModalOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={addCollaborators}
                        disabled={selectedUserId.size === 0}
                        icon={<i className="ri-user-add-line"></i>}
                    >
                        Add {selectedUserId.size > 0 ? `(${selectedUserId.size})` : ''}
                    </Button>
                </div>
            </Modal >

            {/* File Upload Modal */}
            < Modal
                isOpen={isFileUploadModalOpen}
                onClose={() => !uploadingFiles && setIsFileUploadModalOpen(false)}
                title="Upload Files"
                size="large"
            >
                <FileUpload onFilesSelected={handleFileUpload} />
                {
                    uploadingFiles && (
                        <div className="mt-4 text-center">
                            <div className="inline-flex items-center gap-2 text-purple-400">
                                <div className="animate-spin">
                                    <i className="ri-loader-4-line text-xl"></i>
                                </div>
                                <span>Uploading files...</span>
                            </div>
                        </div>
                    )
                }
            </Modal >
        </main >
    )
}

export default Project