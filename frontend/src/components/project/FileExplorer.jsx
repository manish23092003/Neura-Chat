import React, { memo, useMemo, useCallback, useState } from 'react'

// Extension → language name for highlight.js
const EXT_TO_LANG = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown',
    sh: 'bash', bash: 'bash', yml: 'yaml', yaml: 'yaml', xml: 'xml',
    java: 'java', c: 'c', cpp: 'cpp', go: 'go', rs: 'rust', php: 'php',
    rb: 'ruby', kt: 'kotlin', swift: 'swift', sql: 'sql',
}

/**
 * FileExplorer
 *
 * Left sidebar showing the project file tree + search.
 * Memoized — only re-renders when fileTree, currentFile, openFiles, or
 * expandedFolders change.
 */
const FileExplorer = memo(function FileExplorer({
    fileTree,
    currentFile,
    openFiles,
    setCurrentFile,
    setOpenFiles,
    onDownloadZip,
    onCreateFile,
}) {
    const [fileSearchQuery, setFileSearchQuery] = useState('')
    const [expandedFolders, setExpandedFolders] = useState({})

    const toggleFolder = useCallback((pathStr) => {
        setExpandedFolders(prev => ({ ...prev, [pathStr]: !prev[pathStr] }))
    }, [])

    const openFile = useCallback((filePath) => {
        setCurrentFile(filePath)
        setOpenFiles(prev => [...new Set([...prev, filePath])])
    }, [setCurrentFile, setOpenFiles])

    // Memoized flat file list for search
    const allFiles = useMemo(() => {
        const flatten = (node, path = '', acc = []) => {
            if (!node) return acc
            for (const key of Object.keys(node)) {
                const child = node[key]
                const currentPath = path ? `${path}/${key}` : key
                const isDir = !!(child.directory || (!child.file && typeof child === 'object'))
                const next = child.directory || (isDir ? child : null)
                if (isDir) { if (next) flatten(next, currentPath, acc) }
                else acc.push(currentPath)
            }
            return acc
        }
        return flatten(fileTree)
    }, [fileTree])

    const filteredFiles = useMemo(() => {
        if (!fileSearchQuery) return []
        return allFiles.filter(f => f.toLowerCase().includes(fileSearchQuery.toLowerCase()))
    }, [allFiles, fileSearchQuery])

    // Recursive tree renderer — memoized per render since it depends on many values
    const renderTree = useCallback((node, path = '', level = 0) => {
        if (!node) return null
        const sortedKeys = Object.keys(node).sort((a, b) => {
            const aDir = !!(node[a].directory || (!node[a].file && typeof node[a] === 'object'))
            const bDir = !!(node[b].directory || (!node[b].file && typeof node[b] === 'object'))
            if (aDir && !bDir) return -1
            if (!aDir && bDir) return 1
            return a.localeCompare(b)
        })

        return sortedKeys.map((key) => {
            const childNode = node[key]
            const currentPath = path ? `${path}/${key}` : key
            const isDir = !!(childNode.directory || (!childNode.file && typeof childNode === 'object'))
            const nextNode = childNode.directory || (isDir ? childNode : null)

            if (isDir) {
                const isExpanded = !!expandedFolders[currentPath]
                return (
                    <div key={currentPath}>
                        <button
                            onClick={() => toggleFolder(currentPath)}
                            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-[6px] text-left transition-all text-[13px] font-[600]"
                            style={{ color: 'var(--nc-text-secondary)', paddingLeft: `${8 + level * 10}px` }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--nc-text-primary)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--nc-text-secondary)' }}
                        >
                            <i className={isExpanded ? 'ri-arrow-down-s-line text-[14px]' : 'ri-arrow-right-s-line text-[14px]'} style={{ color: 'var(--nc-text-muted)' }} />
                            <i className={isExpanded ? 'ri-folder-open-fill text-[15px]' : 'ri-folder-fill text-[15px]'} style={{ color: '#FCD34D' }} />
                            <span className="truncate">{key}</span>
                        </button>
                        {isExpanded && nextNode && (
                            <div className="mt-0.5">{renderTree(nextNode, currentPath, level + 1)}</div>
                        )}
                    </div>
                )
            }

            const isActive = currentFile === currentPath
            return (
                <button
                    key={currentPath}
                    onClick={() => openFile(currentPath)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-left transition-all text-[13px] font-[500]"
                    style={{
                        paddingLeft: `${24 + level * 10}px`,
                        background: isActive ? 'var(--nc-primary-muted)' : 'transparent',
                        color: isActive ? 'var(--nc-primary)' : 'var(--nc-text-secondary)',
                        border: `1px solid ${isActive ? 'var(--nc-primary-border)' : 'transparent'}`,
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--nc-text-primary)' } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--nc-text-secondary)' } }}
                >
                    <i className="ri-file-code-line text-[14px] flex-shrink-0" style={{ color: isActive ? 'var(--nc-primary)' : 'var(--nc-text-muted)' }} />
                    <span className="truncate">{key}</span>
                </button>
            )
        })
    }, [expandedFolders, currentFile, toggleFolder, openFile])

    const isEmpty = Object.keys(fileTree).length === 0

    return (
        <div className="flex flex-col shrink-0" style={{ width: 220, background: 'var(--nc-surface)', borderRight: '1px solid var(--nc-border)' }}>
            {/* Header */}
            <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--nc-border)' }}>
                <div className="flex items-center justify-between mb-2.5">
                    <p className="text-[11px] font-[700] tracking-[0.08em] uppercase" style={{ color: 'var(--nc-text-muted)', margin: 0 }}>Files</p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCreateFile}
                            className="text-[11px] font-[600] text-[var(--nc-text-secondary)] hover:text-[var(--nc-text-primary)]"
                            title="New file"
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                        >
                            <i className="ri-add-line text-[14px]" />
                        </button>
                        <button
                            onClick={onDownloadZip}
                            className="flex items-center gap-1 text-[11px] font-[600] text-[var(--nc-primary)] hover:underline cursor-pointer"
                            title="Download project as ZIP"
                            style={{ background: 'none', border: 'none', padding: 0 }}
                        >
                            <i className="ri-download-cloud-2-line text-[13px]" style={{ color: 'var(--nc-primary)' }} />
                            ZIP
                        </button>
                    </div>
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

            {/* Tree */}
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
                                onClick={() => openFile(file)}
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
                ) : isEmpty ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <i className="ri-file-line text-[24px] mb-2" style={{ color: 'var(--nc-text-muted)' }} />
                        <p className="text-[12px] font-[500]" style={{ color: 'var(--nc-text-muted)' }}>No files yet</p>
                    </div>
                ) : (
                    renderTree(fileTree)
                )}
            </div>
        </div>
    )
})

export default FileExplorer
export { EXT_TO_LANG }
