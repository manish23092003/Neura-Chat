import React, { memo, useCallback, useMemo, useState, useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import Button from '../ui/Button'
import { EXT_TO_LANG } from './FileExplorer'

/**
 * Extension -> Monaco language mapping
 */
const MONACO_LANG_MAP = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown',
    sh: 'shell', bash: 'shell', yml: 'yaml', yaml: 'yaml', xml: 'xml',
    java: 'java', c: 'cpp', cpp: 'cpp', go: 'go', rs: 'rust', php: 'php',
    rb: 'ruby', kt: 'kotlin', swift: 'swift', sql: 'sql', env: 'plaintext',
}

const getMonacoLanguage = (filePath) => {
    if (!filePath) return 'plaintext'
    const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
    return MONACO_LANG_MAP[ext] || EXT_TO_LANG[ext] || 'plaintext'
}

/**
 * File icon generator based on path
 */
const getTabIconClass = (filePath) => {
    const ext = filePath?.split('.').pop()?.toLowerCase() ?? ''
    switch (ext) {
        case 'js':
        case 'jsx':
            return 'ri-javascript-fill text-yellow-400'
        case 'ts':
        case 'tsx':
            return 'ri-code-s-slash-line text-blue-400'
        case 'html':
            return 'ri-html5-fill text-orange-500'
        case 'css':
            return 'ri-css3-fill text-blue-500'
        case 'json':
            return 'ri-braces-line text-amber-300'
        case 'md':
            return 'ri-markdown-fill text-gray-300'
        case 'py':
            return 'ri-python-fill text-blue-300'
        case 'java':
            return 'ri-code-box-line text-red-400'
        default:
            return 'ri-file-code-line text-gray-400'
    }
}

/* ============================================================================
   TERMINAL SUB-COMPONENTS (memoized for performance)
   ============================================================================ */

/**
 * Single log row — memoized to prevent re-renders of unchanged rows.
 */
const LogRow = memo(function LogRow({ entry, index, showTimestamps, onClickError }) {
    const ts = showTimestamps
        ? new Date(entry.timestamp).toLocaleTimeString('en-GB', { hour12: false })
        : null

    let levelColor = 'nc-term-text'
    let icon = null

    switch (entry.level) {
        case 'error':
            levelColor = 'nc-term-error'
            icon = <i className="ri-close-circle-fill nc-term-error-icon" />
            break
        case 'warning':
            levelColor = 'nc-term-warning'
            icon = <i className="ri-alert-fill nc-term-warning-icon" />
            break
        case 'success':
            levelColor = 'nc-term-success'
            icon = <i className="ri-checkbox-circle-fill nc-term-success-icon" />
            break
        case 'info':
        default:
            break
    }

    const isClickable = entry.file && (entry.level === 'error' || entry.level === 'warning')

    return (
        <div
            className={`nc-term-row ${levelColor} ${isClickable ? 'nc-term-row-clickable' : ''}`}
            onClick={isClickable ? () => onClickError(entry) : undefined}
        >
            <span className="nc-term-line-num">{index + 1}</span>
            {ts && <span className="nc-term-timestamp">{ts}</span>}
            <div className="nc-term-content">
                {icon}
                <span>{entry.text}</span>
            </div>
            {isClickable && (
                <span className="nc-term-file-link" title={`${entry.file}:${entry.line || '?'}`}>
                    {entry.file}{entry.line ? `:${entry.line}` : ''}
                </span>
            )}
        </div>
    )
})

/**
 * Terminal filter tab button.
 */
const FilterTab = memo(function FilterTab({ label, count, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`nc-term-filter-tab ${active ? 'active' : ''}`}
            aria-label={`Show ${label} logs`}
        >
            <span>{label}</span>
            {count > 0 && <span className="nc-term-filter-count">{count}</span>}
        </button>
    )
})

/**
 * Terminal icon button with tooltip.
 */
const TermIconBtn = memo(function TermIconBtn({ icon, title, onClick, active, className = '' }) {
    return (
        <button
            onClick={onClick}
            className={`nc-term-icon-btn ${active ? 'nc-term-icon-btn-active' : ''} ${className}`}
            title={title}
            aria-label={title}
        >
            <i className={icon} />
        </button>
    )
})

/* ============================================================================
   SAVED TERMINAL HEIGHT KEY
   ============================================================================ */
const TERMINAL_HEIGHT_KEY = 'nc-terminal-height'
const getStoredHeight = () => {
    try {
        const v = localStorage.getItem(TERMINAL_HEIGHT_KEY)
        return v ? parseInt(v, 10) : 224
    } catch { return 224 }
}
const storeHeight = (h) => {
    try { localStorage.setItem(TERMINAL_HEIGHT_KEY, String(h)) } catch {}
}

/* ============================================================================
   MAIN CODEEDITOR COMPONENT
   ============================================================================ */

const CodeEditor = memo(function CodeEditor({
    currentFile,
    openFiles,
    fileTree,
    getFile,
    onFileChange,      // (pathStr, newContent) => void
    onCloseFile,       // (fileName, event) => void
    onSetCurrentFile,
    // Terminal data
    logs = [],                  // structured log entries from useLifoRuntime
    terminalOutput,             // backward-compatible string (used only as fallback)
    onClearTerminal,
    isRunning,
    runtimeStatus,
    onRun,
    hasFiles,
    // Error navigation
    onNavigateToFile,           // (filePath, line, column) => void (optional)
}) {
    // Terminal UI state
    const [terminalHeight, setTerminalHeight] = useState(getStoredHeight)
    const [isTerminalMaximized, setIsTerminalMaximized] = useState(false)
    const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false)
    const [autoScroll, setAutoScroll] = useState(true)
    const [terminalWrap, setTerminalWrap] = useState(true)
    const [terminalSearch, setTerminalSearch] = useState('')
    const [showTerminalSearch, setShowTerminalSearch] = useState(false)
    const [showTimestamps, setShowTimestamps] = useState(false)
    const [isDraggingTerminal, setIsDraggingTerminal] = useState(false)
    const [minimapEnabled, setMinimapEnabled] = useState(false)
    const [activeFilter, setActiveFilter] = useState('all')
    const [copyFeedback, setCopyFeedback] = useState(false)
    const [showNewOutput, setShowNewOutput] = useState(false)
    const [isTerminalVisible, setIsTerminalVisible] = useState(true)

    const terminalContainerRef = useRef(null)
    const editorRef = useRef(null)
    const prevLogCountRef = useRef(0)

    // Current file details
    const currentFileObj = useMemo(() => getFile(currentFile), [currentFile, fileTree, getFile])
    const currentContent = currentFileObj?.file?.contents ?? ''
    const currentLang = useMemo(() => getMonacoLanguage(currentFile), [currentFile])

    // Determine if terminal has content (either structured logs or legacy string)
    const hasTerminalContent = logs.length > 0 || (terminalOutput && terminalOutput.length > 0)

    /* ── Log level counts ── */
    const logCounts = useMemo(() => {
        const counts = { all: 0, error: 0, warning: 0, info: 0, success: 0 }
        for (const entry of logs) {
            counts.all++
            if (entry.level === 'error') counts.error++
            else if (entry.level === 'warning') counts.warning++
            else if (entry.level === 'success') counts.success++
            else counts.info++
        }
        return counts
    }, [logs])

    /* ── Filtered + searched logs ── */
    const filteredLogs = useMemo(() => {
        let result = logs

        // Apply level filter
        if (activeFilter !== 'all') {
            if (activeFilter === 'info') {
                result = result.filter(e => e.level === 'info' || e.level === 'success')
            } else {
                result = result.filter(e => e.level === activeFilter)
            }
        }

        // Apply search
        if (terminalSearch.trim()) {
            const q = terminalSearch.toLowerCase()
            result = result.filter(e => e.text.toLowerCase().includes(q))
        }

        return result
    }, [logs, activeFilter, terminalSearch])

    /* ── Auto-scroll behavior ── */
    useEffect(() => {
        if (!terminalContainerRef.current) return

        if (autoScroll) {
            terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight
            setShowNewOutput(false)
        } else if (logs.length > prevLogCountRef.current) {
            // New logs arrived while user is scrolled up
            setShowNewOutput(true)
        }

        prevLogCountRef.current = logs.length
    }, [logs, autoScroll])

    /* ── Detect manual scroll ── */
    const handleTerminalScroll = useCallback(() => {
        if (!terminalContainerRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = terminalContainerRef.current
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 40
        if (isAtBottom) {
            setAutoScroll(true)
            setShowNewOutput(false)
        } else {
            setAutoScroll(false)
        }
    }, [])

    /* ── Terminal resize handling ── */
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDraggingTerminal) return
            const newHeight = window.innerHeight - e.clientY
            const minH = 80
            const maxH = Math.floor(window.innerHeight * 0.7)
            const clamped = Math.max(minH, Math.min(maxH, newHeight))
            setTerminalHeight(clamped)
        }
        const handleMouseUp = () => {
            if (isDraggingTerminal) {
                setIsDraggingTerminal(false)
                storeHeight(terminalHeight)
            }
        }

        if (isDraggingTerminal) {
            document.body.style.cursor = 'row-resize'
            document.body.style.userSelect = 'none'
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }
        return () => {
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDraggingTerminal, terminalHeight])

    /* ── Keyboard shortcut: Ctrl+` ── */
    useEffect(() => {
        const handleKey = (e) => {
            // Don't intercept when typing in inputs
            const tag = e.target.tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return

            if (e.ctrlKey && e.key === '`') {
                e.preventDefault()
                setIsTerminalVisible(prev => !prev)
            }
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [])

    /* ── Handle Monaco editor mount ── */
    const handleEditorDidMount = useCallback((editor, monaco) => {
        editorRef.current = editor

        // Custom NeuraChat dark theme
        monaco.editor.defineTheme('neurachat-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: '', background: '09090F' },
                { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
                { token: 'keyword', foreground: '3b82f6', fontStyle: 'bold' },
                { token: 'string', foreground: '10b981' },
                { token: 'number', foreground: 'f59e0b' },
            ],
            colors: {
                'editor.background': '#0b0b0f',
                'editor.foreground': '#e2e8f0',
                'editor.lineHighlightBackground': '#18182480',
                'editorCursor.foreground': '#3b82f6',
                'editorWhitespace.foreground': '#334155',
                'editorIndentGuide.background': '#1e293b',
                'editorIndentGuide.activeBackground': '#334155',
                'editorLineNumber.foreground': '#475569',
                'editorLineNumber.activeForeground': '#94a3b8',
            },
        })
        monaco.editor.setTheme('neurachat-dark')
    }, [])

    /* ── Handle content change in Monaco ── */
    const handleEditorChange = useCallback((value) => {
        if (currentFile && value !== undefined) {
            onFileChange(currentFile, value)
        }
    }, [currentFile, onFileChange])

    /* ── Error click: navigate to file in Monaco ── */
    const handleErrorClick = useCallback((entry) => {
        if (!entry.file) return

        // If a navigation callback is provided, use it
        if (onNavigateToFile) {
            onNavigateToFile(entry.file, entry.line, entry.column)
            return
        }

        // Fallback: try to open the file and jump in the current editor
        if (editorRef.current && entry.line) {
            onSetCurrentFile(entry.file)
            // After React render, jump to line
            setTimeout(() => {
                if (editorRef.current) {
                    editorRef.current.revealLineInCenter(entry.line)
                    editorRef.current.setPosition({
                        lineNumber: entry.line,
                        column: entry.column || 1,
                    })
                    editorRef.current.focus()
                }
            }, 100)
        } else {
            onSetCurrentFile(entry.file)
        }
    }, [onNavigateToFile, onSetCurrentFile])

    /* ── Copy terminal logs ── */
    const handleCopyTerminal = useCallback(() => {
        const text = filteredLogs.map(e => {
            const ts = new Date(e.timestamp).toLocaleTimeString('en-GB', { hour12: false })
            return `[${ts}] [${e.level.toUpperCase()}] ${e.text}`
        }).join('\n')

        if (!text) return

        navigator.clipboard.writeText(text)
            .then(() => {
                setCopyFeedback(true)
                setTimeout(() => setCopyFeedback(false), 2000)
            })
            .catch(() => {})
    }, [filteredLogs])

    /* ── Download terminal logs ── */
    const handleDownloadTerminal = useCallback(() => {
        const text = logs.map(e => {
            const ts = new Date(e.timestamp).toLocaleTimeString('en-GB', { hour12: false })
            const src = e.source ? e.source.toUpperCase() : 'RUNTIME'
            return `[${ts}] [${e.level.toUpperCase()}] [${src}] ${e.text}`
        }).join('\n')

        if (!text) return

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `terminal-output-${Date.now()}.log`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }, [logs])

    /* ── Scroll helpers ── */
    const scrollToTop = useCallback(() => {
        if (terminalContainerRef.current) {
            terminalContainerRef.current.scrollTop = 0
            setAutoScroll(false)
        }
    }, [])

    const scrollToBottom = useCallback(() => {
        if (terminalContainerRef.current) {
            terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight
            setAutoScroll(true)
            setShowNewOutput(false)
        }
    }, [])

    /* ── Toggle collapse ── */
    const toggleCollapse = useCallback(() => {
        if (isTerminalMaximized) {
            setIsTerminalMaximized(false)
        }
        setIsTerminalCollapsed(prev => !prev)
    }, [isTerminalMaximized])

    /* ── Toggle maximize ── */
    const toggleMaximize = useCallback(() => {
        if (isTerminalCollapsed) {
            setIsTerminalCollapsed(false)
        }
        setIsTerminalMaximized(prev => !prev)
    }, [isTerminalCollapsed])

    /* ── Runtime status indicator ── */
    const statusDot = useMemo(() => {
        if (isRunning) {
            if (runtimeStatus === 'Starting' || runtimeStatus === 'Booting') {
                return 'nc-term-dot-starting'
            }
            return 'nc-term-dot-running'
        }
        if (runtimeStatus === 'Failed') {
            return 'nc-term-dot-error'
        }
        return 'nc-term-dot-idle'
    }, [isRunning, runtimeStatus])

    /* ── Terminal effective height ── */
    const terminalEffectiveHeight = isTerminalMaximized
        ? 'calc(100% - 42px)'
        : isTerminalCollapsed
            ? '36px'
            : `${terminalHeight}px`

    return (
        <div className="flex-grow flex flex-col bg-transparent overflow-hidden">
            {/* Open file tabs + Run button */}
            <div
                className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto shrink-0 nc-scrollbar-hidden"
                style={{ background: 'var(--nc-surface)', borderBottom: '1px solid var(--nc-border)' }}
            >
                {openFiles.length === 0 ? (
                    <span className="text-[13px] px-3 py-1" style={{ color: 'var(--nc-text-muted)' }}>No files open</span>
                ) : (
                    openFiles.map((file) => {
                        const isActive = currentFile === file
                        return (
                            <div
                                key={file}
                                onClick={() => onSetCurrentFile(file)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] cursor-pointer transition-all text-[12px] font-[500] flex-shrink-0 group"
                                style={{
                                    background: isActive ? 'var(--nc-elevated)' : 'transparent',
                                    color: isActive ? 'var(--nc-text-primary)' : 'var(--nc-text-secondary)',
                                    border: `1px solid ${isActive ? 'var(--nc-border)' : 'transparent'}`,
                                }}
                            >
                                <i className={getTabIconClass(file)} />
                                <span className="font-mono">{file}</span>
                                <button
                                    onClick={(e) => onCloseFile(file, e)}
                                    className="ml-1 rounded-full w-4 h-4 flex items-center justify-center text-[11px] opacity-60 group-hover:opacity-100 transition-opacity"
                                    style={{ color: 'var(--nc-text-muted)' }}
                                    title="Close tab"
                                    aria-label={`Close ${file}`}
                                >
                                    <i className="ri-close-line" />
                                </button>
                            </div>
                        )
                    })
                )}

                <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                    {/* Toggle Minimap */}
                    <button
                        onClick={() => setMinimapEnabled(prev => !prev)}
                        className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[13px] transition-colors"
                        style={{
                            background: minimapEnabled ? 'var(--nc-primary-muted)' : 'transparent',
                            color: minimapEnabled ? 'var(--nc-primary)' : 'var(--nc-text-muted)',
                            border: '1px solid var(--nc-border)',
                        }}
                        title={minimapEnabled ? 'Hide Minimap' : 'Show Minimap'}
                        aria-label={minimapEnabled ? 'Hide Minimap' : 'Show Minimap'}
                    >
                        <i className="ri-map-2-line" />
                    </button>

                    {hasFiles && (
                        <Button
                            onClick={onRun}
                            size="sm"
                            loading={isRunning}
                            variant="primary"
                            icon={<i className={isRunning ? 'ri-loader-4-line nc-spin' : 'ri-play-fill'} />}
                            style={{ height: 30, padding: '0 14px', fontSize: 13 }}
                        >
                            {isRunning ? runtimeStatus : 'Run'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Breadcrumbs */}
            {currentFile && (
                <div
                    className="flex items-center gap-1 px-4 py-1 border-b text-[11px] font-mono shrink-0"
                    style={{ background: '#0b0b0f', borderColor: 'var(--nc-border)', color: 'var(--nc-text-muted)' }}
                >
                    <i className="ri-folder-open-line text-[12px]" />
                    <span>project</span>
                    <span>/</span>
                    <span style={{ color: 'var(--nc-text-primary)' }}>{currentFile}</span>
                    <span className="ml-auto text-[10px] uppercase font-sans font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--nc-elevated)', color: 'var(--nc-text-secondary)' }}>
                        {currentLang}
                    </span>
                </div>
            )}

            {/* Monaco Editor area */}
            <div className={`flex-grow flex flex-col overflow-hidden relative ${isTerminalMaximized ? 'nc-term-editor-minimized' : ''}`} style={{ background: '#0b0b0f' }}>
                {currentFileObj ? (
                    <div className="h-full w-full relative">
                        <Editor
                            height="100%"
                            language={currentLang}
                            value={currentContent}
                            onChange={handleEditorChange}
                            onMount={handleEditorDidMount}
                            theme="neurachat-dark"
                            options={{
                                fontSize: 13,
                                fontFamily: "'Cascadia Code', 'Fira Code', 'Inter', monospace",
                                fontLigatures: true,
                                minimap: { enabled: minimapEnabled },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                wordWrap: 'on',
                                padding: { top: 12, bottom: 12 },
                                cursorBlinking: 'smooth',
                                cursorSmoothCaretAnimation: 'on',
                                bracketPairColorization: { enabled: true },
                                renderLineHighlight: 'all',
                                tabSize: 2,
                            }}
                            loading={
                                <div className="h-full flex items-center justify-center text-slate-400 gap-2">
                                    <i className="ri-loader-4-line nc-spin text-xl" />
                                    <span className="text-sm font-medium">Loading Monaco Editor...</span>
                                </div>
                            }
                        />
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <div
                                className="w-16 h-16 mx-auto rounded-[16px] flex items-center justify-center mb-4"
                                style={{ background: 'var(--nc-primary-muted)', border: '1px solid var(--nc-primary-border)' }}
                            >
                                <i className="ri-terminal-box-line text-[28px]" style={{ color: 'var(--nc-primary)' }} />
                            </div>
                            <h3 className="text-[16px] font-[700] text-[var(--nc-text-primary)] mb-1">Editor Ready</h3>
                            <p className="text-[13px]" style={{ color: 'var(--nc-text-secondary)' }}>Select a file from the explorer to start editing</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ════════════════════════════════════════════════════════════════════
               TERMINAL PANEL
               ════════════════════════════════════════════════════════════════════ */}

            {isTerminalVisible && (
                <>
                    {/* Resize drag handle */}
                    {!isTerminalCollapsed && !isTerminalMaximized && (
                        <div
                            onMouseDown={(e) => { e.preventDefault(); setIsDraggingTerminal(true) }}
                            className={`nc-term-resize-handle ${isDraggingTerminal ? 'nc-term-resize-active' : ''}`}
                            title="Drag to resize terminal"
                            role="separator"
                            aria-orientation="horizontal"
                            aria-label="Resize terminal"
                        />
                    )}

                    <div
                        className="nc-term-panel"
                        style={{ height: terminalEffectiveHeight }}
                    >
                        {/* ── Terminal Header ── */}
                        <div className="nc-term-header">
                            {/* Left: status + title + line count */}
                            <div className="nc-term-header-left">
                                <button
                                    onClick={toggleCollapse}
                                    className="nc-term-title-btn"
                                    aria-label={isTerminalCollapsed ? 'Expand terminal' : 'Collapse terminal'}
                                    title={isTerminalCollapsed ? 'Expand terminal' : 'Collapse terminal'}
                                >
                                    <span className={`nc-term-dot ${statusDot}`} />
                                    <span className="nc-term-title">Console</span>
                                    <i className={`ri-arrow-${isTerminalCollapsed ? 'up' : 'down'}-s-line nc-term-chevron`} />
                                </button>

                                <span className="nc-term-line-count">
                                    {logCounts.all} {logCounts.all === 1 ? 'line' : 'lines'}
                                </span>

                                {/* Filter tabs (hidden when collapsed) */}
                                {!isTerminalCollapsed && (
                                    <div className="nc-term-filters">
                                        <FilterTab label="All" count={logCounts.all} active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
                                        <FilterTab label="Errors" count={logCounts.error} active={activeFilter === 'error'} onClick={() => setActiveFilter('error')} />
                                        <FilterTab label="Warnings" count={logCounts.warning} active={activeFilter === 'warning'} onClick={() => setActiveFilter('warning')} />
                                        <FilterTab label="Info" count={logCounts.info + logCounts.success} active={activeFilter === 'info'} onClick={() => setActiveFilter('info')} />
                                    </div>
                                )}
                            </div>

                            {/* Right: Controls (hidden when collapsed) */}
                            {!isTerminalCollapsed && (
                                <div className="nc-term-header-right">
                                    {/* Search toggle */}
                                    <TermIconBtn
                                        icon="ri-search-line"
                                        title="Search console (Ctrl+F)"
                                        onClick={() => setShowTerminalSearch(p => !p)}
                                        active={showTerminalSearch}
                                    />

                                    {/* Timestamps toggle */}
                                    <TermIconBtn
                                        icon="ri-time-line"
                                        title={showTimestamps ? 'Hide timestamps' : 'Show timestamps'}
                                        onClick={() => setShowTimestamps(p => !p)}
                                        active={showTimestamps}
                                    />

                                    {/* Auto-scroll */}
                                    <TermIconBtn
                                        icon="ri-arrow-down-line"
                                        title={autoScroll ? 'Auto-scroll on' : 'Auto-scroll off'}
                                        onClick={() => { setAutoScroll(p => !p); if (!autoScroll) scrollToBottom() }}
                                        active={autoScroll}
                                    />

                                    {/* Word wrap */}
                                    <TermIconBtn
                                        icon="ri-text-wrap"
                                        title={terminalWrap ? 'Word wrap on' : 'Word wrap off'}
                                        onClick={() => setTerminalWrap(p => !p)}
                                        active={terminalWrap}
                                    />

                                    <div className="nc-term-divider" />

                                    {/* Copy */}
                                    <TermIconBtn
                                        icon={copyFeedback ? 'ri-check-line' : 'ri-file-copy-line'}
                                        title={copyFeedback ? 'Copied!' : 'Copy terminal output'}
                                        onClick={handleCopyTerminal}
                                        active={copyFeedback}
                                    />

                                    {/* Download */}
                                    <TermIconBtn
                                        icon="ri-download-2-line"
                                        title="Download terminal logs"
                                        onClick={handleDownloadTerminal}
                                    />

                                    {/* Maximize / Restore */}
                                    <TermIconBtn
                                        icon={isTerminalMaximized ? 'ri-contract-up-down-line' : 'ri-expand-up-down-line'}
                                        title={isTerminalMaximized ? 'Restore terminal' : 'Maximize terminal'}
                                        onClick={toggleMaximize}
                                    />

                                    {/* Clear */}
                                    <TermIconBtn
                                        icon="ri-delete-bin-line"
                                        title="Clear terminal"
                                        onClick={onClearTerminal}
                                        className="nc-term-icon-btn-danger"
                                    />
                                </div>
                            )}
                        </div>

                        {/* ── Search bar ── */}
                        {showTerminalSearch && !isTerminalCollapsed && (
                            <div className="nc-term-search-bar">
                                <i className="ri-search-line nc-term-search-icon" />
                                <input
                                    type="text"
                                    value={terminalSearch}
                                    onChange={(e) => setTerminalSearch(e.target.value)}
                                    placeholder="Filter console logs..."
                                    className="nc-term-search-input"
                                    autoFocus
                                    aria-label="Search terminal logs"
                                />
                                {terminalSearch && (
                                    <span className="nc-term-search-count">
                                        {filteredLogs.length} {filteredLogs.length === 1 ? 'match' : 'matches'}
                                    </span>
                                )}
                                {terminalSearch && (
                                    <button
                                        onClick={() => setTerminalSearch('')}
                                        className="nc-term-search-clear"
                                        aria-label="Clear search"
                                        title="Clear search"
                                    >
                                        <i className="ri-close-line" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* ── Terminal body ── */}
                        {!isTerminalCollapsed && (
                            <div className="nc-term-body-wrap">
                                {filteredLogs.length === 0 ? (
                                    /* Empty state */
                                    <div className="nc-term-empty">
                                        {logs.length === 0 ? (
                                            <>
                                                <i className="ri-terminal-box-line nc-term-empty-icon" />
                                                <span className="nc-term-empty-title">No output yet</span>
                                                <span className="nc-term-empty-sub">Run your project to see runtime logs here.</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri-filter-off-line nc-term-empty-icon" />
                                                <span className="nc-term-empty-title">No {activeFilter === 'all' ? '' : activeFilter + ' '}logs match</span>
                                                <span className="nc-term-empty-sub">
                                                    {terminalSearch ? `No results for "${terminalSearch}"` : `No ${activeFilter} entries found.`}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        ref={terminalContainerRef}
                                        onScroll={handleTerminalScroll}
                                        className={`nc-term-body ${terminalWrap ? 'nc-term-wrap' : 'nc-term-nowrap'}`}
                                    >
                                        {filteredLogs.map((entry, idx) => (
                                            <LogRow
                                                key={entry.id}
                                                entry={entry}
                                                index={idx}
                                                showTimestamps={showTimestamps}
                                                onClickError={handleErrorClick}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Scroll controls */}
                                {filteredLogs.length > 20 && !autoScroll && (
                                    <div className="nc-term-scroll-controls">
                                        <button onClick={scrollToTop} className="nc-term-scroll-btn" aria-label="Scroll to top" title="Scroll to top">
                                            <i className="ri-arrow-up-line" />
                                        </button>
                                        <button onClick={scrollToBottom} className="nc-term-scroll-btn" aria-label="Scroll to bottom" title="Scroll to bottom">
                                            <i className="ri-arrow-down-line" />
                                        </button>
                                    </div>
                                )}

                                {/* New output indicator */}
                                {showNewOutput && (
                                    <button onClick={scrollToBottom} className="nc-term-new-output" aria-label="Scroll to new output">
                                        <i className="ri-arrow-down-line" />
                                        <span>New output</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
})

export default CodeEditor
