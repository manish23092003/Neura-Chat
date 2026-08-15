import React, { memo, useCallback, useMemo, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Markdown from 'markdown-to-jsx'
import toast from 'react-hot-toast'
import EmptyState from '../ui/EmptyState'
import Avatar from '../ui/Avatar'
import FilePreview from '../FilePreview'
import AiThinkingAnimation from '../AiThinkingAnimation'
import TaskList from '../TaskList'
import Roadmap from '../Roadmap'

// ── Styled Code Block with Copy ───────────────────────────────────────────────
const StyledCodeBlock = memo(function StyledCodeBlock(props) {
    const ref = useRef(null)
    const [copied, setCopied] = useState(false)

    const handleCopy = useCallback(() => {
        const code = ref.current?.innerText || props.children
        navigator.clipboard.writeText(code).then(() => {
            toast.success('Code copied to clipboard!')
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }).catch(() => toast.error('Failed to copy code'))
    }, [props.children])

    // Inline vs Block code
    const isBlock = props.className?.includes('lang-') || String(props.children).includes('\n')

    if (!isBlock) {
        return (
            <code className="bg-slate-800 text-emerald-300 font-mono text-[12px] px-1.5 py-0.5 rounded border border-slate-700">
                {props.children}
            </code>
        )
    }

    const lang = props.className?.replace('lang-', '') || 'code'

    return (
        <div className="relative group my-3 rounded-lg overflow-hidden border border-slate-800 bg-[#07070b]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                <span className="uppercase font-bold tracking-wider text-slate-500">{lang}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] hover:text-slate-100 transition-colors"
                >
                    <i className={copied ? 'ri-check-line text-emerald-400' : 'ri-file-copy-line'} />
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <pre className="p-3 overflow-x-auto font-mono text-[12px] text-slate-200 leading-relaxed m-0">
                <code ref={ref}>{props.children}</code>
            </pre>
        </div>
    )
})

const MD_OVERRIDES = { overrides: { code: StyledCodeBlock } }

// ── File Tree Summary Renderer ────────────────────────────────────────────────
const RenderTreeSummary = ({ tree, depth = 0 }) => {
    if (!tree || typeof tree !== 'object') return null
    const keys = Object.keys(tree)

    return (
        <div className="space-y-0.5 font-mono text-[11px]">
            {keys.map((key) => {
                const node = tree[key]
                const isDir = !!(node.directory || (!node.file && typeof node === 'object'))
                const children = node.directory || (isDir ? node : null)

                return (
                    <div key={key} style={{ paddingLeft: `${depth * 14}px` }}>
                        <div className="flex items-center gap-1.5 py-0.5 text-slate-300">
                            <i className={isDir ? 'ri-folder-fill text-amber-400 text-[13px]' : 'ri-file-code-line text-sky-400 text-[13px]'} />
                            <span>{key}</span>
                        </div>
                        {isDir && children && <RenderTreeSummary tree={children} depth={depth + 1} />}
                    </div>
                )
            })}
        </div>
    )
}

// ── AiMessage Component ────────────────────────────────────────────────────────
const AiMessage = memo(function AiMessage({ messageStr, onActionPrompt }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isLongResponse, setIsLongResponse] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const [showFilesList, setShowFilesList] = useState(false)
    const contentRef = useRef(null)

    const parsed = useMemo(() => {
        if (!messageStr || typeof messageStr !== 'string') return { text: messageStr || '' }
        let cleaned = messageStr.trim()
        if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7)
        else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3)
        if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
        cleaned = cleaned.trim()
        try { return JSON.parse(cleaned) }
        catch {
            try { return JSON.parse(cleaned.replace(/\\+\s+"/g, '\\"')) }
            catch { return { text: messageStr } }
        }
    }, [messageStr])

    const handleCopyFullResponse = useCallback(() => {
        navigator.clipboard.writeText(parsed.text || messageStr)
            .then(() => toast.success('Response copied to clipboard!'))
            .catch(() => toast.error('Failed to copy'))
    }, [parsed.text, messageStr])

    const flatFiles = useMemo(() => {
        const getFlatFiles = (tree, currentPath = '') => {
            let files = []
            if (!tree || typeof tree !== 'object') return files
            for (const key of Object.keys(tree)) {
                const node = tree[key]
                if (!node) continue
                const newPath = currentPath ? `${currentPath}/${key}` : key
                if (node.file || node.contents !== undefined || typeof node === 'string') {
                    files.push({ name: key, path: newPath })
                } else if (node.directory) {
                    files = [...files, ...getFlatFiles(node.directory, newPath)]
                } else if (typeof node === 'object') {
                    files = [...files, ...getFlatFiles(node, newPath)]
                }
            }
            return files
        }
        return getFlatFiles(parsed.fileTree)
    }, [parsed.fileTree])

    const isProject = useMemo(() => {
        return parsed.fileTree && (parsed.buildCommand || parsed.startCommand || flatFiles.length > 2)
    }, [parsed.fileTree, parsed.buildCommand, parsed.startCommand, flatFiles])

    // Measure height of text for read more/less toggle
    useEffect(() => {
        if (contentRef.current) {
            const hasOverflow = contentRef.current.scrollHeight > 240
            setIsLongResponse(hasOverflow)
        }
    }, [parsed.text])

    // Render file changes section dynamically based on Type 1-5 rules
    const renderFilesSection = () => {
        if (!parsed.fileTree || flatFiles.length === 0) return null

        if (isProject) {
            // Type 5 / Type 3 Project Generation (Collapsible Project Card)
            return (
                <div className="mt-3 p-3 rounded-lg border border-[var(--nc-border)] bg-[var(--nc-surface)] font-sans shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <i className="ri-folder-open-fill text-amber-500 text-[18px]" />
                            <div>
                                <h4 className="text-[12px] font-semibold text-[var(--nc-text-primary)]">
                                    {parsed.projectName || 'Generated Workspace'}
                                </h4>
                                <p className="text-[10px] text-[var(--nc-text-secondary)] mt-0.5">
                                    {flatFiles.length} files • {parsed.framework || 'HTML/CSS/JS'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowFilesList(prev => !prev)}
                            className="px-2 py-1 rounded text-[11px] font-semibold bg-[var(--nc-surface)] border border-[var(--nc-border)] hover:bg-[var(--nc-elevated)] text-[var(--nc-accent)] transition-colors flex items-center gap-1"
                        >
                            {showFilesList ? 'Hide files' : 'View files'}
                            <i className={showFilesList ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
                        </button>
                    </div>

                    {showFilesList && (
                        <div className="mt-3 pt-3 border-t border-[var(--nc-border)] max-h-[160px] overflow-y-auto pr-1">
                            <RenderTreeSummary tree={parsed.fileTree} />
                        </div>
                    )}
                </div>
            )
        }

        if (flatFiles.length === 1) {
            // Type 2 / Type 4 Single File Change
            const file = flatFiles[0]
            return (
                <div className="mt-3 p-2.5 rounded-lg border border-[var(--nc-border)] bg-[var(--nc-surface)] flex items-center justify-between text-[12px] font-sans shadow-sm">
                    <div className="flex items-center gap-2 text-[var(--nc-text-primary)]">
                        <i className="ri-file-code-fill text-sky-500 text-[16px]" />
                        <span className="font-mono">{file.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            Modified
                        </span>
                    </div>
                </div>
            )
        }

        // Multiple files changed list (Type 3)
        return (
            <div className="mt-3 p-3 rounded-lg border border-[var(--nc-border)] bg-[var(--nc-surface)] font-sans shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[var(--nc-text-secondary)] tracking-wider">
                        FILES CHANGED · {flatFiles.length}
                    </span>
                    <button
                        onClick={() => setShowFilesList(prev => !prev)}
                        className="text-[11px] font-semibold text-[var(--nc-accent)] hover:text-sky-500 transition-colors flex items-center gap-0.5"
                    >
                        {showFilesList ? 'Hide details' : 'Show details'}
                        <i className={showFilesList ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
                    </button>
                </div>
                <div className="space-y-1">
                    {flatFiles.slice(0, 3).map((file, i) => (
                        <div key={i} className="flex items-center gap-2 text-[12px] text-[var(--nc-text-primary)] font-mono">
                            <span className="text-[var(--nc-text-muted)]">└─</span>
                            <i className="ri-file-code-line text-[var(--nc-text-secondary)]" />
                            <span>{file.name}</span>
                            <span className="text-[9px] text-[var(--nc-text-muted)] ml-auto">Modified</span>
                        </div>
                    ))}
                    {flatFiles.length > 3 && !showFilesList && (
                        <p className="text-[10px] text-[var(--nc-text-muted)] pl-6 font-mono">
                            ... and {flatFiles.length - 3} more files
                        </p>
                    )}
                </div>

                {showFilesList && flatFiles.length > 3 && (
                    <div className="mt-2 pt-2 border-t border-[var(--nc-border)] pl-6 space-y-1">
                        {flatFiles.slice(3).map((file, i) => (
                            <div key={i} className="flex items-center gap-2 text-[12px] text-[var(--nc-text-primary)] font-mono">
                                <span className="text-[var(--nc-text-muted)]">└─</span>
                                <i className="ri-file-code-line text-[var(--nc-text-secondary)]" />
                                <span>{file.name}</span>
                                <span className="text-[9px] text-[var(--nc-text-muted)] ml-auto">Modified</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="w-full space-y-2.5 font-sans">
            {/* Simple identity header with clean primary Copy button & context menu */}
            <div className="flex items-center justify-between text-[12px] border-b border-[var(--nc-border)] pb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[15px]" role="img" aria-label="bot">🤖</span>
                    <span className="font-bold text-[var(--nc-text-primary)] tracking-tight">NeuraChat AI</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleCopyFullResponse}
                        className="hover:text-[var(--nc-text-primary)] flex items-center gap-1.5 transition-colors px-2 py-1 rounded hover:bg-[var(--nc-elevated)] text-[11px] font-semibold text-[var(--nc-text-secondary)]"
                        title="Copy full response"
                    >
                        <i className="ri-file-copy-line" />
                        <span>Copy</span>
                    </button>
                    {onActionPrompt && (
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(prev => !prev)}
                                className="hover:text-[var(--nc-text-primary)] flex items-center justify-center w-6 h-6 rounded hover:bg-[var(--nc-elevated)] text-[var(--nc-text-secondary)] transition-colors"
                                title="More actions"
                            >
                                <i className="ri-more-fill text-[14px]" />
                            </button>
                            {showDropdown && (
                                <>
                                    <div className="fixed inset-0 z-25" onClick={() => setShowDropdown(false)} />
                                    <div className="absolute right-0 mt-1 w-36 rounded shadow-lg bg-[var(--nc-surface)] border border-[var(--nc-border)] z-30 py-1 font-sans">
                                        <button
                                            onClick={() => {
                                                setShowDropdown(false)
                                                onActionPrompt('@ai Continue building modern components for this project')
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-xs text-[var(--nc-text-primary)] hover:bg-[var(--nc-elevated)] transition-colors flex items-center gap-1.5"
                                        >
                                            <i className="ri-play-line text-sky-500" />
                                            Continue
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDropdown(false)
                                                onActionPrompt('@ai Explain how this code works in detail')
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-xs text-[var(--nc-text-primary)] hover:bg-[var(--nc-elevated)] transition-colors flex items-center gap-1.5"
                                        >
                                            <i className="ri-question-line text-sky-500" />
                                            Explain
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDropdown(false)
                                                onActionPrompt('@ai Fix any compilation or runtime errors in this project')
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-xs text-[var(--nc-text-primary)] hover:bg-[var(--nc-elevated)] transition-colors flex items-center gap-1.5"
                                        >
                                            <i className="ri-bug-line text-amber-500" />
                                            Fix Errors
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDropdown(false)
                                                onActionPrompt('@ai Regenerate the previous answer')
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-xs text-[var(--nc-text-primary)] hover:bg-[var(--nc-elevated)] transition-colors flex items-center gap-1.5"
                                        >
                                            <i className="ri-refresh-line text-emerald-500" />
                                            Regenerate
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Content area with high-contrast text and subtle fade truncation */}
            <div className="relative">
                <div
                    ref={contentRef}
                    className={`transition-all duration-200 overflow-hidden ${
                        !isExpanded && isLongResponse ? 'max-h-[240px]' : 'max-h-none'
                    }`}
                >
                    {parsed.text && (
                        <div className="text-[13.5px] leading-relaxed text-[var(--nc-text-primary)] font-sans tracking-wide">
                            <Markdown children={parsed.text} options={MD_OVERRIDES} />
                        </div>
                    )}

                    {!isExpanded && isLongResponse && (
                        <div
                            className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
                            style={{ background: 'linear-gradient(to top, var(--nc-elevated), transparent)' }}
                        />
                    )}
                </div>

                {isLongResponse && (
                    <button
                        onClick={() => setIsExpanded(prev => !prev)}
                        className="flex items-center gap-1.5 mt-2.5 text-[11px] font-bold text-[var(--nc-accent)] hover:text-sky-500 transition-colors uppercase tracking-wider"
                    >
                        {isExpanded ? (
                            <>Read less <i className="ri-arrow-up-s-line" /></>
                        ) : (
                            <>Read more <i className="ri-arrow-down-s-line" /></>
                        )}
                    </button>
                )}
            </div>

            {/* Dynamic, lightweight file tree representation */}
            {renderFilesSection()}
        </div>
    )
})

// ── formatTime ───────────────────────────────────────────────────────────────
const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (date.toDateString() === now.toDateString())
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    if (date.getFullYear() === now.getFullYear())
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const AVAILABLE_REACTIONS = ['👍', '❤️', '😊', '🎉', '🚀', '👏']

/**
 * ChatPanel
 */
const ChatPanel = memo(function ChatPanel({
    user,
    project,
    messages,
    message,
    setMessage,
    onSend,
    onTyping,
    onFileUpload,
    isAiThinking,
    typingUsers,
    messageBoxRef,
    showReactionPicker,
    setShowReactionPicker,
    onReaction,
    onFileDownload,
    activeTab,
    setActiveTab,
    onCreateTask,
    onUpdateTask,
    onDeleteTask,
    onToggleTask,
}) {
    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSend()
        }
    }, [onSend])

    const handleActionPrompt = useCallback((promptText) => {
        setMessage(promptText)
    }, [setMessage])

    return (
        <section
            className="relative flex flex-col h-full shrink-0"
            style={{ width: 380, background: 'var(--nc-surface)', borderRight: '1px solid var(--nc-border)' }}
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
                        className="flex items-center gap-2 px-3 h-8 rounded-[8px] text-[13px] transition-all"
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
                    <div ref={messageBoxRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                        {messages.length === 0 && !isAiThinking ? (
                            <div className="h-full flex items-center justify-center">
                                <EmptyState
                                    icon="ri-chat-1-line"
                                    title="No messages yet"
                                    description="Start the conversation or ask NeuraChat AI with @ai."
                                />
                            </div>
                        ) : (
                            <AnimatePresence>
                                {messages.map((msg, index) => {
                                    const isAi = msg.sender?._id === 'ai' || msg.sender === 'ai'
                                    const isCurrentUser = msg.sender && user && (
                                        msg.sender.email === user.email ||
                                        (msg.sender._id && msg.sender._id === user._id) ||
                                        msg.sender === user._id
                                    )
                                    return (
                                        <motion.div
                                            key={msg._id || index}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className={`flex ${isAi || !isCurrentUser ? 'justify-start' : 'justify-end'}`}
                                        >
                                            <div className={`w-full ${isAi ? 'max-w-full' : 'max-w-[88%]'}`}>
                                                {!isCurrentUser && !isAi && (
                                                    <div className="flex items-center gap-1.5 mb-1 pl-1">
                                                        <Avatar email={msg.sender?.email} size="xs" />
                                                        <span className="text-[11px] font-[600]" style={{ color: 'var(--nc-text-secondary)' }}>
                                                            {msg.sender?.email}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="relative">
                                                    <div
                                                        className={`p-3.5 group relative ${
                                                            isAi
                                                                ? 'rounded-[16px] w-full'
                                                                : isCurrentUser
                                                                ? 'rounded-[16px] rounded-br-[4px]'
                                                                : 'rounded-[16px] rounded-bl-[4px]'
                                                        }`}
                                                        style={{
                                                            background: isAi
                                                                ? 'var(--nc-elevated)'
                                                                : isCurrentUser
                                                                ? 'var(--nc-primary-muted)'
                                                                : 'var(--nc-elevated)',
                                                            border: isAi
                                                                ? '1px solid var(--nc-border)'
                                                                : isCurrentUser
                                                                ? '1px solid var(--nc-primary-border)'
                                                                : '1px solid var(--nc-border)',
                                                        }}
                                                    >
                                                        {isAi
                                                            ? <AiMessage messageStr={msg.message} onActionPrompt={handleActionPrompt} />
                                                            : <p className="text-[13.5px] leading-relaxed break-words" style={{ color: 'var(--nc-text-primary)' }}>{msg.message}</p>
                                                        }

                                                        {msg.files && msg.files.length > 0 && (
                                                            <div className="mt-2">
                                                                {msg.files.map((file, fi) => (
                                                                    <FilePreview key={fi} file={file} onDownload={onFileDownload} />
                                                                ))}
                                                            </div>
                                                        )}

                                                        {!isAi && (
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
                                                            {AVAILABLE_REACTIONS.map((emoji, ei) => (
                                                                <button key={ei} onClick={() => onReaction(msg._id, emoji)} className="text-[18px] p-1 rounded-[8px] hover:bg-white/10 transition-all hover:scale-125">
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
                                                                    onClick={() => onReaction(msg._id, reaction.emoji)}
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
                                                        <p className={`text-[10px] mt-1 font-[500] ${isCurrentUser && !isAi ? 'text-right' : 'text-left pl-1'}`}
                                                            style={{ color: 'var(--nc-text-muted)' }}>
                                                            {formatTime(msg.timestamp)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}

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
                                        : `${typingUsers.length} people are typing…`}
                                </span>
                            </motion.div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--nc-border)' }}>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onFileUpload}
                                className="nc-btn-icon flex-shrink-0"
                                style={{ width: 38, height: 38 }}
                                title="Attach files"
                                aria-label="Attach files"
                            >
                                <i className="ri-attachment-2 text-[16px]" />
                            </button>

                            <input
                                value={message}
                                onChange={(e) => { setMessage(e.target.value); onTyping() }}
                                onKeyPress={handleKeyPress}
                                placeholder="Type @ai to ask NeuraChat AI..."
                                className="nc-input"
                                style={{ height: 38, fontSize: 13, flex: 1 }}
                                type="text"
                                aria-label="Message input"
                            />

                            <button
                                onClick={onSend}
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
                    onCreateTask={onCreateTask}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                    onToggleTask={onToggleTask}
                />
            )}
        </section>
    )
})

export default ChatPanel
