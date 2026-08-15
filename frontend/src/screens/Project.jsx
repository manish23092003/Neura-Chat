import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from '../config/axios'
import { sendMessage } from '../config/socket'
import { destroyLifoSandbox } from '../config/lifoRuntime'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import FileUpload from '../components/FileUpload'
import JSZip from 'jszip'

// Extracted sub-components
import ProjectHeader from '../components/project/ProjectHeader'
import ChatPanel from '../components/project/ChatPanel'
import FileExplorer from '../components/project/FileExplorer'
import CodeEditor from '../components/project/CodeEditor'
import LivePreview from '../components/project/LivePreview'
import { WorkspaceSidebar } from '../components/project/WorkspaceSidebar'
import { ErrorOverlay } from '../components/project/ErrorOverlay'
import { VersionHistoryModal } from '../components/project/VersionHistoryModal'
import { CommandPalette } from '../components/project/CommandPalette'
import { StatusBar } from '../components/project/StatusBar'
import { AiContextViewer } from '../components/project/AiContextViewer'
import { ActivityPanel } from '../components/project/ActivityPanel'
import { saveVersionSnapshot } from '../services/versionHistory'
import { commandRegistry } from '../services/commandRegistry'
import { settingsManager } from '../services/settingsManager'
import { aiMemoryEngine } from '../services/aiMemoryEngine'

// Custom hooks
import useFileTree from '../hooks/useFileTree'
import useProjectSocket from '../hooks/useProjectSocket'
import useLifoRuntime from '../hooks/useLifoRuntime'
import useWorkspaces from '../hooks/useWorkspaces'
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts'

// ─────────────────────────────────────────────────────────────────────────────

const Project = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user } = useContext(UserContext)
    const messageBox = useRef(null)

    const initialProject = location?.state?.project || null

    // Redirect if no project data
    useEffect(() => {
        if (!initialProject) {
            toast.error('Project details not found. Redirecting to home...')
            navigate('/home')
        }
    }, [initialProject, navigate])

    // ── Core state ────────────────────────────────────────────────────────────
    const [project, setProject] = useState(
        initialProject || { name: 'Loading...', users: [], fileTree: {} }
    )
    const [users, setUsers] = useState([])          // all platform users (for invite modal)
    const [messages, setMessages] = useState([])
    const [message, setMessage] = useState('')
    const [isAiThinking, setIsAiThinking] = useState(false)

    // UI state
    const [activeTab, setActiveTab] = useState('chat')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState(new Set())
    const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false)
    const [uploadingFiles, setUploadingFiles] = useState(false)
    const [inviteCopied, setInviteCopied] = useState(false)
    const [isGeneratingInvite, setIsGeneratingInvite] = useState(false)
    const [showReactionPicker, setShowReactionPicker] = useState(null)
    const [typingUsers, setTypingUsers] = useState([])

    // File tabs
    const [currentFile, setCurrentFile] = useState(null)
    const [openFiles, setOpenFiles] = useState([])

    // Preview panel resize
    const [previewPanelWidth, setPreviewPanelWidth] = useState(420)
    const [isDragging, setIsDragging] = useState(false)
    const [previewDevice, setPreviewDevice] = useState('mobile')
    const [previewZoom, setPreviewZoom] = useState('fit')
    const [previewOrientation, setPreviewOrientation] = useState('portrait')
    const [previewWidth, setPreviewWidth] = useState(375)

    // Command Palette & Settings state
    const [commandPaletteMode, setCommandPaletteMode] = useState('commands') // 'commands' | 'files'
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
    const [isAiContextViewerOpen, setIsAiContextViewerOpen] = useState(false)
    const [isActivityPanelOpen, setIsActivityPanelOpen] = useState(false)
    const [aiDockPosition, setAiDockPosition] = useState(settingsManager.get('aiDockPosition'))

    // Global keyboard shortcuts hook
    useKeyboardShortcuts()

    // Workspace & History state
    const [isWorkspaceSidebarOpen, setIsWorkspaceSidebarOpen] = useState(false)
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
    const {
        workspaces,
        activeWorkspace,
        activeWorkspaceId,
        switchWorkspace,
        createWorkspace,
        renameWorkspace,
        duplicateWorkspace,
        deleteWorkspace,
        togglePinWorkspace,
        updateActiveWorkspace,
        updateWorkspaceTreeById,
    } = useWorkspaces(project._id, initialProject?.fileTree)

    const activeWsIdRef = useRef(activeWorkspaceId)
    useEffect(() => {
        activeWsIdRef.current = activeWorkspaceId
    }, [activeWorkspaceId])

    const handleWorkspaceSync = useCallback((newTree, wsId) => {
        if (wsId) {
            updateWorkspaceTreeById(wsId, newTree)
        } else {
            updateActiveWorkspace({ fileTree: newTree })
        }
    }, [updateWorkspaceTreeById, updateActiveWorkspace])

    const currentInitialTree = useMemo(() => {
        if (activeWorkspace) {
            return activeWorkspace.fileTree || {}
        }
        return initialProject?.fileTree || {}
    }, [activeWorkspace, initialProject?.fileTree])

    // ── File tree hook ────────────────────────────────────────────────────────
    const { fileTree, fileTreeRef, setFileTree, updateFile, deleteFile, mergeAiTree, getFile, getAllPaths } =
        useFileTree(
            currentInitialTree,
            project._id,
            setProject,
            handleWorkspaceSync,
            activeWorkspaceId
        )

    // ── Runtime hook ──────────────────────────────────────────────────────────
    const {
        isRunning, runtimeStatus, terminalOutput,
        logs, iframeUrl, setIframeUrl, previewsList,
        runProject, clearTerminal, getRuntimeErrors, getRuntimeWarnings,
    } = useLifoRuntime(project._id)

    // Extracted AI Memory
    const aiMemory = useMemo(() => aiMemoryEngine.extractMemory(fileTree), [fileTree])

    // Cycle AI Dock Position
    const toggleAiDock = useCallback(() => {
        const positions = ['right', 'bottom', 'floating', 'hidden']
        setAiDockPosition(prev => {
            const nextIdx = (positions.indexOf(prev) + 1) % positions.length
            const nextPos = positions[nextIdx]
            settingsManager.set('aiDockPosition', nextPos)
            return nextPos
        })
    }, [])

    // Register IDE Commands in commandRegistry
    useEffect(() => {
        const u1 = commandRegistry.register({
            id: 'ide.commandPalette',
            label: 'Command Palette',
            category: 'IDE',
            shortcut: 'Ctrl + Shift + P',
            icon: 'ri-command-line',
            action: () => { setCommandPaletteMode('commands'); setIsCommandPaletteOpen(true) },
        })
        const u2 = commandRegistry.register({
            id: 'ide.quickOpen',
            label: 'Quick Open File',
            category: 'Navigation',
            shortcut: 'Ctrl + P',
            icon: 'ri-file-search-line',
            action: () => { setCommandPaletteMode('files'); setIsCommandPaletteOpen(true) },
        })
        const u3 = commandRegistry.register({
            id: 'runtime.run',
            label: 'Run Sandbox Project',
            category: 'Execution',
            shortcut: 'F5',
            icon: 'ri-play-line',
            action: () => runProject(fileTreeRef.current),
        })
        const u4 = commandRegistry.register({
            id: 'sidebar.toggle',
            label: 'Toggle Workspace Sidebar',
            category: 'IDE',
            shortcut: 'Ctrl + B',
            icon: 'ri-layout-grid-line',
            action: () => setIsWorkspaceSidebarOpen(p => !p),
        })
        const u5 = commandRegistry.register({
            id: 'ai.toggle',
            label: 'Cycle AI Assistant Dock Position',
            category: 'AI Assistant',
            shortcut: 'Ctrl + L',
            icon: 'ri-robot-2-line',
            action: toggleAiDock,
        })
        const u6 = commandRegistry.register({
            id: 'ai.memory',
            label: 'View AI Memory & Context',
            category: 'AI Assistant',
            icon: 'ri-brain-line',
            action: () => setIsAiContextViewerOpen(true),
        })

        return () => { u1(); u2(); u3(); u4(); u5(); u6() }
    }, [runProject, toggleAiDock, fileTreeRef])

    // ── Socket handlers (stable refs via useCallback) ─────────────────────────
    const handleMessage = useCallback((data) => {
        if (data.sender?._id === 'ai') {
            setIsAiThinking(false)
            try {
                let cleaned = (data.message || '').trim()
                if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
                else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
                if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
                const parsed = JSON.parse(cleaned.trim())
                if (parsed.fileTree) {
                    const targetWsId = data.workspaceId || activeWsIdRef.current
                    if (targetWsId && targetWsId === activeWsIdRef.current) {
                        mergeAiTree(parsed.fileTree)
                        saveVersionSnapshot(targetWsId, parsed.fileTree, `AI: ${(parsed.text || '').slice(0, 40)}...`)
                    } else if (targetWsId) {
                        updateWorkspaceTreeById(targetWsId, parsed.fileTree).then((updatedWs) => {
                            toast.success(`AI generated code for workspace "${updatedWs?.name || 'background workspace'}"! 🚀`)
                        })
                        saveVersionSnapshot(targetWsId, parsed.fileTree, `AI: ${(parsed.text || '').slice(0, 40)}...`)
                    }
                }
            } catch { /* non-JSON AI response — just show text */ }
        }
        setMessages(prev => [...prev, data])
        setTimeout(() => {
            if (messageBox.current) messageBox.current.scrollTop = messageBox.current.scrollHeight
        }, 80)
    }, [mergeAiTree, activeWsIdRef, updateWorkspaceTreeById])

    const handleFileMessage = useCallback((data) => {
        setMessages(prev => [...prev, data])
    }, [])

    const handleReactionUpdate = useCallback((data) => {
        setMessages(prev => {
            const idx = prev.findIndex(m => m._id === data.messageId)
            if (idx === -1) return prev
            const next = [...prev]
            next[idx] = { ...next[idx], reactions: data.reactions }
            return next
        })
    }, [])

    const handleTypingStart = useCallback((data) => {
        setTypingUsers(prev => prev.find(u => u._id === data.user._id) ? prev : [...prev, data.user])
    }, [])

    const handleTypingStop = useCallback((data) => {
        setTypingUsers(prev => prev.filter(u => u._id !== data.user._id))
    }, [])

    // ── Socket hook ───────────────────────────────────────────────────────────
    const { connect: connectSocket, sendTyping } = useProjectSocket({
        projectId: project?._id,
        currentUserId: user?._id,
        onMessage: handleMessage,
        onFileMessage: handleFileMessage,
        onReaction: handleReactionUpdate,
        onTypingStart: handleTypingStart,
        onTypingStop: handleTypingStop,
    })

    // Initialize socket + fetch initial data once
    useEffect(() => {
        if (!project?._id) return
        const cleanup = connectSocket()

        // Fetch project + messages in parallel
        Promise.all([
            axios.get(`/projects/get-project/${project._id}`),
            axios.get(`/projects/get-messages/${project._id}`),
            axios.get('/users/all'),
        ]).then(([projRes, msgsRes, usersRes]) => {
            if (projRes.data?.project) {
                setProject(projRes.data.project)
            }
            setMessages(msgsRes.data?.messages || [])
            setUsers(usersRes.data?.users || [])
            setTimeout(() => {
                if (messageBox.current) messageBox.current.scrollTop = messageBox.current.scrollHeight
            }, 500)
        }).catch(err => {
            if (import.meta.env.DEV) console.warn('[Project] data fetch error:', err.message)
        })

        return cleanup
    }, [project._id]) // eslint-disable-line react-hooks/exhaustive-deps

    // Sync open files & current file when active workspace changes
    useEffect(() => {
        if (activeWorkspace) {
            const treePaths = getAllPaths()
            const open = activeWorkspace.openFiles && activeWorkspace.openFiles.length > 0
                ? activeWorkspace.openFiles
                : treePaths.slice(0, 3)
            const current = activeWorkspace.currentFile || open[0] || treePaths[0] || null
            setOpenFiles(open)
            setCurrentFile(current)
        }
    }, [activeWorkspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-open first file if none is currently open
    useEffect(() => {
        if (!currentFile && fileTree && Object.keys(fileTree).length > 0) {
            const paths = getAllPaths()
            if (paths.length > 0) {
                setCurrentFile(paths[0])
                setOpenFiles(prev => prev.length === 0 ? [paths[0]] : prev)
            }
        }
    }, [fileTree, currentFile, getAllPaths])

    // Destroy Lifo sandbox on unmount
    useEffect(() => () => destroyLifoSandbox(), [])

    // Scroll to bottom when AI starts thinking
    useEffect(() => {
        if (isAiThinking) {
            setTimeout(() => {
                if (messageBox.current) messageBox.current.scrollTop = messageBox.current.scrollHeight
            }, 100)
        }
    }, [isAiThinking])

    // ── Drag-to-resize preview panel ──────────────────────────────────────────
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return
            const newWidth = window.innerWidth - e.clientX
            const maxWidth = window.innerWidth * 0.75
            if (newWidth >= 320 && newWidth <= maxWidth) setPreviewPanelWidth(newWidth)
        }
        const handleMouseUp = () => setIsDragging(false)
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging])

    // ── Send message ──────────────────────────────────────────────────────────
    const send = useCallback(() => {
        if (!message.trim()) return
        const msgData = {
            _id: crypto.randomUUID(),
            message,
            sender: user,
            workspaceId: activeWorkspaceId,
            workspaceFileTree: fileTreeRef.current,
            timestamp: new Date().toISOString(),
            reactions: [],
        }
        if (message.includes('@ai')) setIsAiThinking(true)
        sendMessage('project-message', msgData)
        setMessages(prev => [...prev, msgData])
        setMessage('')
        setTimeout(() => {
            if (messageBox.current) messageBox.current.scrollTop = messageBox.current.scrollHeight
        }, 100)
    }, [message, user, activeWorkspaceId, fileTreeRef])

    // ── Reaction handler ──────────────────────────────────────────────────────
    const handleReaction = useCallback((messageId, emoji) => {
        setMessages(prev => {
            const next = [...prev]
            const idx = next.findIndex(m => m._id === messageId)
            if (idx === -1) return prev
            const msg = { ...next[idx], reactions: [...(next[idx].reactions || [])] }
            const existing = msg.reactions.find(r => r.emoji === emoji)
            if (existing) {
                const userIdx = existing.users.findIndex(u => (u._id || u) === user._id)
                if (userIdx > -1) {
                    existing.users = existing.users.filter((_, i) => i !== userIdx)
                    if (existing.users.length === 0) msg.reactions = msg.reactions.filter(r => r.emoji !== emoji)
                } else {
                    existing.users = [...existing.users, user]
                }
            } else {
                msg.reactions = [...msg.reactions, { emoji, users: [user] }]
            }
            next[idx] = msg
            sendMessage('message-reaction', { messageId, emoji, user, reactions: msg.reactions })
            return next
        })
        setShowReactionPicker(null)
    }, [user])

    // ── Task handlers ──────────────────────────────────────────────────────────
    const handleCreateTask = useCallback(async (taskData) => {
        try {
            const res = await axios.post(`/projects/${project._id}/tasks`, taskData)
            setProject(res.data.project)
            toast.success('Task created!')
        } catch { toast.error('Failed to create task') }
    }, [project._id])

    const handleUpdateTask = useCallback(async (taskId, updates) => {
        try {
            const res = await axios.put(`/projects/${project._id}/tasks/${taskId}`, updates)
            setProject(res.data.project)
            toast.success('Task updated!')
        } catch { toast.error('Failed to update task') }
    }, [project._id])

    const handleDeleteTask = useCallback(async (taskId) => {
        try {
            const res = await axios.delete(`/projects/${project._id}/tasks/${taskId}`)
            setProject(res.data.project)
            toast.success('Task deleted!')
        } catch { toast.error('Failed to delete task') }
    }, [project._id])

    const handleToggleTask = useCallback(async (taskId) => {
        try {
            const res = await axios.put(`/projects/${project._id}/tasks/${taskId}/toggle`)
            setProject(res.data.project)
        } catch { toast.error('Failed to toggle task') }
    }, [project._id])

    // ── File handlers ─────────────────────────────────────────────────────────
    const handleCreateFile = useCallback(() => {
        const fileName = prompt('Enter file name (e.g. index.js or routes/user.js):')
        if (!fileName?.trim()) return
        const trimmed = fileName.trim()
        if (getFile(trimmed)) { toast.error('File already exists!'); return }
        updateFile(trimmed, '')
        setCurrentFile(trimmed)
        setOpenFiles(prev => [...new Set([...prev, trimmed])])
        toast.success(`Created file ${trimmed}`)
    }, [getFile, updateFile])

    const handleDeleteFile = useCallback((fileName) => {
        const confirmed = window.confirm(`Are you sure you want to delete ${fileName}?`)
        if (!confirmed) return
        deleteFile(fileName)
        setOpenFiles(prev => prev.filter(f => f !== fileName))
        setCurrentFile(prev => prev === fileName ? null : prev)
        toast.success(`Deleted file ${fileName}`)
    }, [deleteFile])

    const closeFile = useCallback((fileName, e) => {
        e.stopPropagation()
        setOpenFiles(prev => prev.filter(f => f !== fileName))
        setCurrentFile(prev => prev === fileName ? (openFiles[0] || null) : prev)
    }, [openFiles])

    // ── File upload / download ─────────────────────────────────────────────────
    const handleFileUpload = useCallback(async (files) => {
        setUploadingFiles(true)
        const formData = new FormData()
        files.forEach(file => formData.append('files', file))
        try {
            const response = await axios.post('/files/upload', formData)
            const uploadedFiles = response.data.files
            const fileMessage = {
                _id: crypto.randomUUID(),
                message: message.trim() || `Shared ${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}`,
                sender: user,
                workspaceId: activeWorkspaceId,
                workspaceFileTree: fileTreeRef.current,
                timestamp: new Date().toISOString(),
                files: uploadedFiles,
                reactions: [],
            }
            sendMessage('project-file-message', fileMessage)
            setMessages(prev => [...prev, fileMessage])
            setMessage('')
            setIsFileUploadModalOpen(false)
            toast.success('Files uploaded successfully!')
        } catch { toast.error('Failed to upload files') }
        finally { setUploadingFiles(false) }
    }, [message, user, activeWorkspaceId, fileTreeRef])

    const handleFileDownload = useCallback(async (fileUrl, fileName) => {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
            const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${baseUrl}${fileUrl}`
            const response = await fetch(fullUrl)
            if (!response.ok) throw new Error('Failed to download file')
            const blob = await response.blob()
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = fileName
            document.body.appendChild(link)
            link.click()
            window.URL.revokeObjectURL(blobUrl)
            document.body.removeChild(link)
            toast.success('File downloaded!')
        } catch { toast.error('Failed to download file') }
    }, [])

    // ── Download project as ZIP ────────────────────────────────────────────────
    const downloadProjectAsZip = useCallback(() => {
        const zip = new JSZip()
        const addFolder = (zipObj, node) => {
            if (!node || typeof node !== 'object') return
            Object.keys(node).forEach(key => {
                const n = node[key]
                if (!n || typeof n !== 'object') return
                if (n.file) zipObj.file(key, n.file.contents || '')
                else if (n.directory) addFolder(zipObj.folder(key), n.directory)
                else addFolder(zipObj.folder(key), n)
            })
        }
        addFolder(zip, fileTree)
        zip.generateAsync({ type: 'blob' }).then(blob => {
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.style.display = 'none'
            a.href = url
            a.download = `${project.name || 'project'}-workspace.zip`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            toast.success('Workspace downloaded!')
        }).catch(() => toast.error('Failed to download workspace'))
    }, [fileTree, project.name])

    // ── Invite link ───────────────────────────────────────────────────────────
    const handleCopyInviteLink = useCallback(async () => {
        setIsGeneratingInvite(true)
        try {
            const res = await axios.post(`/projects/${project._id}/invite/generate`)
            await navigator.clipboard.writeText(res.data.inviteUrl)
            setInviteCopied(true)
            toast.success('Invite link copied! Valid for 7 days 🔗')
            setTimeout(() => setInviteCopied(false), 3000)
        } catch { toast.error('Failed to generate invite link') }
        finally { setIsGeneratingInvite(false) }
    }, [project._id])

    // ── Add collaborators ─────────────────────────────────────────────────────
    const addCollaborators = useCallback(() => {
        axios.put('/projects/add-user', {
            projectId: project._id,
            users: Array.from(selectedUserId),
        }).then(() => {
            toast.success('Invitations sent!')
            setIsModalOpen(false)
            setSelectedUserId(new Set())
            return axios.get(`/projects/get-project/${project._id}`)
        }).then(res => setProject(res.data.project))
        .catch(() => toast.error('Failed to send invitations'))
    }, [project._id, selectedUserId])

    const handleUserClick = useCallback((id) => {
        setSelectedUserId(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }, [])

    // ── 1-Click Auto Debugging ────────────────────────────────────────────────
    const handleFixWithAi = useCallback((errorInfo) => {
        const fixPrompt = `@ai Fix this runtime error: "${errorInfo.title}" in file "${errorInfo.file || 'project'}". Output updated fileTree.`
        setMessage(fixPrompt)
        setIsAiThinking(true)
        sendMessage('project-message', {
            _id: crypto.randomUUID(),
            message: fixPrompt,
            sender: { _id: user._id, email: user.email },
            workspaceId: activeWorkspaceId,
            workspaceFileTree: fileTreeRef.current,
            timestamp: new Date().toISOString(),
        })
        toast.success('Sent error details to NeuraChat AI for auto-fix! 🪄')
    }, [user, setMessage, activeWorkspaceId, fileTreeRef])

    // ── Run project ───────────────────────────────────────────────────────────
    const handleRun = useCallback(() => {
        runProject(fileTreeRef.current)
    }, [runProject, fileTreeRef])

    // ── Derived: has any files ────────────────────────────────────────────────
    const hasFiles = useMemo(() => Object.keys(fileTree).length > 0, [fileTree])

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="h-screen w-screen flex flex-col" style={{ background: 'var(--nc-bg)' }}>

            {/* ── Top Header ── */}
            <ProjectHeader
                project={project}
                inviteCopied={inviteCopied}
                isGeneratingInvite={isGeneratingInvite}
                onCopyInviteLink={handleCopyInviteLink}
            />

            {/* ── Main layout ── */}
            <div className="flex flex-1 overflow-hidden min-h-0">
                {isActivityPanelOpen && (
                    <ActivityPanel onClose={() => setIsActivityPanelOpen(false)} />
                )}

                {/* ── Left Panel: Chat + Tasks ── */}
                <ChatPanel
                    user={user}
                    project={project}
                    messages={messages}
                    message={message}
                    setMessage={setMessage}
                    onSend={send}
                    onTyping={sendTyping}
                    onFileUpload={() => setIsFileUploadModalOpen(true)}
                    isAiThinking={isAiThinking}
                    typingUsers={typingUsers}
                    messageBoxRef={messageBox}
                    showReactionPicker={showReactionPicker}
                    setShowReactionPicker={setShowReactionPicker}
                    onReaction={handleReaction}
                    onFileDownload={handleFileDownload}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onCreateTask={handleCreateTask}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    onToggleTask={handleToggleTask}
                />

                {/* ── Workspace Sidebar ── */}
                <WorkspaceSidebar
                    workspaces={workspaces}
                    activeWorkspaceId={activeWorkspaceId}
                    onSwitchWorkspace={(wsId) => {
                        switchWorkspace(wsId)
                        setOpenFiles([])
                        setCurrentFile(null)
                    }}
                    onCreateWorkspace={async (promptStr) => {
                        const newWs = await createWorkspace(promptStr, {})
                        setOpenFiles([])
                        setCurrentFile(null)
                        return newWs
                    }}
                    onRenameWorkspace={renameWorkspace}
                    onDuplicateWorkspace={duplicateWorkspace}
                    onDeleteWorkspace={deleteWorkspace}
                    onTogglePinWorkspace={togglePinWorkspace}
                    isOpen={isWorkspaceSidebarOpen}
                    onClose={() => setIsWorkspaceSidebarOpen(false)}
                />

                {/* ── Middle: File Explorer + Editor ── */}
                <section className="flex-grow flex h-full relative z-0 overflow-hidden">
                    <FileExplorer
                        fileTree={fileTree}
                        currentFile={currentFile}
                        openFiles={openFiles}
                        setCurrentFile={setCurrentFile}
                        setOpenFiles={setOpenFiles}
                        onDownloadZip={downloadProjectAsZip}
                        onCreateFile={handleCreateFile}
                        onDeleteFile={handleDeleteFile}
                        activeWorkspaceName={activeWorkspace?.name || 'Main Workspace'}
                        onToggleWorkspaceSidebar={() => setIsWorkspaceSidebarOpen(p => !p)}
                    />

                    <CodeEditor
                        currentFile={currentFile}
                        openFiles={openFiles}
                        fileTree={fileTree}
                        getFile={getFile}
                        onFileChange={updateFile}
                        onCloseFile={closeFile}
                        onSetCurrentFile={setCurrentFile}
                        logs={logs}
                        terminalOutput={terminalOutput}
                        onClearTerminal={clearTerminal}
                        isRunning={isRunning}
                        runtimeStatus={runtimeStatus}
                        onRun={handleRun}
                        hasFiles={hasFiles}
                    />
                </section>

                {/* Resizer Handle */}
                <div
                    onMouseDown={(e) => { e.preventDefault(); setIsDragging(true) }}
                    className={`preview-resizer ${isDragging ? 'dragging' : ''}`}
                    title="Drag to resize Live Preview"
                />

                {/* ── Right: Live Preview ── */}
                <section
                    className="flex flex-col shrink-0 overflow-hidden"
                    style={{
                        width: previewPanelWidth,
                        background: 'var(--nc-bg)',
                        borderLeft: '1px solid var(--nc-border)',
                        position: 'relative',
                        zIndex: 20,
                    }}
                >
                    <LivePreview
                        iframeUrl={iframeUrl}
                        previewsList={previewsList}
                        setIframeUrl={setIframeUrl}
                        previewDevice={previewDevice}
                        setPreviewDevice={setPreviewDevice}
                        previewOrientation={previewOrientation}
                        setPreviewOrientation={setPreviewOrientation}
                        previewZoom={previewZoom}
                        setPreviewZoom={setPreviewZoom}
                        previewWidth={previewWidth}
                        setPreviewWidth={setPreviewWidth}
                        previewPanelWidth={previewPanelWidth}
                        isRunning={isRunning}
                        runtimeStatus={runtimeStatus}
                        terminalOutput={terminalOutput}
                        onRun={handleRun}
                    />
                </section>
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
                            <span className="flex-1 text-[14px] font-[600] text-[var(--nc-text-primary)]">{u.email}</span>
                            {selectedUserId.has(u._id) && <i className="ri-checkbox-circle-fill text-[18px]" style={{ color: 'var(--nc-primary)' }} />}
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

            {/* ── VS Code Bottom Status Bar ── */}
            <StatusBar
                activeLanguage={currentFile ? (currentFile.endsWith('.jsx') || currentFile.endsWith('.js') ? 'JavaScript' : currentFile.split('.').pop()?.toUpperCase() || 'Text') : 'JavaScript'}
                activeWorkspaceName={activeWorkspace?.name || 'Main Workspace'}
                runtimeStatus={runtimeStatus}
                isRunning={isRunning}
                aiDockPosition={aiDockPosition}
                onToggleAiDock={toggleAiDock}
                onToggleWorkspaceSidebar={() => setIsWorkspaceSidebarOpen(p => !p)}
                onRunProject={handleRun}
                onOpenCommandPalette={() => { setCommandPaletteMode('commands'); setIsCommandPaletteOpen(true) }}
            />

            {/* ── Command Palette Modal ── */}
            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
                mode={commandPaletteMode}
                fileTree={fileTree}
                onSelectFile={(filePath) => {
                    setCurrentFile(filePath)
                    setOpenFiles(prev => [...new Set([...prev, filePath])])
                }}
            />

            {/* ── AI Context & Memory Viewer Modal ── */}
            <AiContextViewer
                isOpen={isAiContextViewerOpen}
                onClose={() => setIsAiContextViewerOpen(false)}
                memory={aiMemory}
                fileTree={fileTree}
            />

            {/* ── Version History Modal ── */}
            <VersionHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                workspaceId={activeWorkspaceId}
                workspaceName={activeWorkspace?.name || 'Main Workspace'}
                onRestoreSnapshot={(restoredTree) => {
                    setFileTree(restoredTree)
                }}
            />
        </div>
    )
}

export default Project
