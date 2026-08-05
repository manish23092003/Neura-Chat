import React, { memo, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js'
import toast from 'react-hot-toast'
import { useRef, useState } from 'react'
import EmptyState from '../ui/EmptyState'
import Avatar from '../ui/Avatar'
import FilePreview from '../FilePreview'
import AiThinkingAnimation from '../AiThinkingAnimation'
import TaskList from '../TaskList'

// ── SyntaxHighlightedCode ────────────────────────────────────────────────────
const SyntaxHighlightedCode = memo(function SyntaxHighlightedCode(props) {
    const ref = useRef(null)
    const [showCopy, setShowCopy] = useState(false)
    const [copied, setCopied] = useState(false)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)
            ref.current.removeAttribute('data-highlighted')
        }
    }, [props.className, props.children])

    const handleCopy = useCallback(() => {
        const code = ref.current?.innerText || props.children
        navigator.clipboard.writeText(code).then(() => {
            toast.success('Code copied to clipboard!')
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }).catch(() => toast.error('Failed to copy code'))
    }, [props.children])

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
                    <i className={copied ? 'ri-check-line' : 'ri-file-copy-line'} />
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            )}
        </div>
    )
})

// Markdown overrides — defined once outside component to avoid re-creating on every render
const MD_OVERRIDES = { overrides: { code: SyntaxHighlightedCode } }

// ── AiMessage ────────────────────────────────────────────────────────────────
const AiMessage = memo(function AiMessage({ messageStr }) {
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

    return (
        <div
            className="overflow-auto rounded-lg p-3 border"
            style={{ background: 'var(--nc-bg)', borderColor: 'var(--nc-border)' }}
        >
            <Markdown children={parsed.text || ''} options={MD_OVERRIDES} />
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

// ── ChatPanel ────────────────────────────────────────────────────────────────
/**
 * Left panel — chat tab and tasks tab.
 * Memoized and receives only the data it needs; avoids re-rendering when
 * unrelated state changes (file tree, runtime, preview, etc.)
 */
const ChatPanel = memo(function ChatPanel({
    // shared
    user,
    project,
    // chat
    messages,
    message,
    setMessage,
    onSend,
    onTyping,
    onFileUpload,
    isAiThinking,
    typingUsers,
    messageBoxRef,
    // reactions
    showReactionPicker,
    setShowReactionPicker,
    onReaction,
    // file download
    onFileDownload,
    // tabs
    activeTab,
    setActiveTab,
    // collaborators slide panel
    isSidePanelOpen,
    setIsSidePanelOpen,
    // tasks
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

    return (
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
                    <div ref={messageBoxRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
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
                                    )
                                    return (
                                        <motion.div
                                            key={msg._id || index}
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
                                                            ? <AiMessage messageStr={msg.message} />
                                                            : <p className="text-[14px] leading-relaxed break-words" style={{ color: 'var(--nc-text-primary)' }}>{msg.message}</p>
                                                        }

                                                        {msg.files && msg.files.length > 0 && (
                                                            <div className="mt-2">
                                                                {msg.files.map((file, fi) => (
                                                                    <FilePreview key={fi} file={file} onDownload={onFileDownload} />
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
                                                        <p className={`text-[10px] mt-1 font-[500] ${isCurrentUser ? 'text-right' : 'text-left pl-1'}`}
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
                                placeholder="Type a message…"
                                className="nc-input"
                                style={{ height: 38, fontSize: 14, flex: 1 }}
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
    )
})

export default ChatPanel
