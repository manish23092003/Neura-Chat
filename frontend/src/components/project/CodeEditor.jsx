import React, { memo, useCallback, useMemo } from 'react'
import hljs from 'highlight.js'
import Button from '../ui/Button'
import { EXT_TO_LANG } from './FileExplorer'

/**
 * Detect highlight.js language from a file path.
 */
const getLanguage = (filePath) => {
    if (!filePath) return 'plaintext'
    const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
    return EXT_TO_LANG[ext] ?? 'plaintext'
}

/**
 * CodeEditor
 *
 * Middle panel: open-file tabs, the code editor, terminal output, and the Run button.
 * Memoized — only re-renders when currentFile, openFiles, fileTree content, or
 * terminalOutput change.
 */
const CodeEditor = memo(function CodeEditor({
    currentFile,
    openFiles,
    fileTree,
    getFile,
    onFileChange,      // (pathStr, newContent) => void
    onCloseFile,       // (fileName, event) => void
    onSetCurrentFile,
    terminalOutput,
    onClearTerminal,
    isRunning,
    runtimeStatus,
    onRun,
    hasFiles,
}) {
    // Highlight the current file's content
    const highlightedHtml = useMemo(() => {
        const fileObj = getFile(currentFile)
        if (!fileObj) return null
        const lang = getLanguage(currentFile)
        try {
            return hljs.highlight(fileObj.file.contents, { language: lang }).value
        } catch {
            return hljs.highlightAuto(fileObj.file.contents).value
        }
    }, [currentFile, fileTree, getFile]) // fileTree dep ensures re-highlight when AI updates file

    const currentFileObj = useMemo(() => getFile(currentFile), [currentFile, fileTree, getFile])

    const handleBlur = useCallback((e) => {
        if (!currentFile) return
        onFileChange(currentFile, e.target.innerText)
    }, [currentFile, onFileChange])

    return (
        <div className="flex-grow flex flex-col bg-transparent overflow-hidden">
            {/* Open file tabs + Run button */}
            <div
                className="flex items-center gap-1 px-2 py-2 overflow-x-auto shrink-0 nc-scrollbar-hidden"
                style={{ background: 'var(--nc-surface)', borderBottom: '1px solid var(--nc-border)' }}
            >
                {openFiles.length === 0 ? (
                    <span className="text-[13px] px-3 py-1" style={{ color: 'var(--nc-text-muted)' }}>No files open</span>
                ) : (
                    openFiles.map((file) => (
                        <div
                            key={file}
                            onClick={() => onSetCurrentFile(file)}
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
                                onClick={(e) => onCloseFile(file, e)}
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

                {hasFiles && (
                    <Button
                        onClick={onRun}
                        size="sm"
                        loading={isRunning}
                        variant="primary"
                        icon={<i className={isRunning ? 'ri-loader-4-line nc-spin' : 'ri-play-fill'} />}
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
                    {currentFileObj ? (
                        <div className="h-full code-editor-container">
                            <div className="line-numbers">
                                {currentFileObj.file.contents.split('\n').map((_, idx) => (
                                    <div key={idx} className="line-number" />
                                ))}
                            </div>
                            <div className="code-content">
                                <pre className="hljs h-full">
                                    <code
                                        className="hljs outline-none"
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={handleBlur}
                                        dangerouslySetInnerHTML={{ __html: highlightedHtml ?? '' }}
                                        style={{ whiteSpace: 'pre', paddingBottom: '25rem' }}
                                    />
                                </pre>
                            </div>
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
                                <p className="text-[13px]" style={{ color: 'var(--nc-text-secondary)' }}>Select a file from the explorer</p>
                            </div>
                        </div>
                    )}
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
                                onClick={onClearTerminal}
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
    )
})

export default CodeEditor
