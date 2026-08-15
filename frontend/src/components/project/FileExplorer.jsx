import React, { memo, useMemo, useCallback, useState } from 'react'

// Extension -> icon generator
const getFileIcon = (filePath) => {
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
            return 'ri-file-code-line text-slate-400'
    }
}

// Extension → language name mapping
const EXT_TO_LANG = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown',
    sh: 'bash', bash: 'bash', yml: 'yaml', yaml: 'yaml', xml: 'xml',
    java: 'java', c: 'c', cpp: 'cpp', go: 'go', rs: 'rust', php: 'php',
    rb: 'ruby', kt: 'kotlin', swift: 'swift', sql: 'sql',
}

const isDirectoryNode = (node) => {
    if (!node || typeof node !== 'object') return false
    if (node.file || node.contents !== undefined) return false
    if (node.directory || node.type === 'directory' || node.children) return true
    const keys = Object.keys(node)
    if (keys.length === 0) return true
    return !keys.some(k => k === 'contents' || k === 'file')
}

/**
 * FileExplorer Component
 */
const FileExplorer = memo(function FileExplorer({
    fileTree,
    currentFile,
    openFiles,
    setCurrentFile,
    setOpenFiles,
    onDownloadZip,
    onCreateFile,
    onDeleteFile,
    activeWorkspaceName = 'Main Workspace',
    onToggleWorkspaceSidebar,
}) {
    const [fileSearchQuery, setFileSearchQuery] = useState('')
    const [expandedFolders, setExpandedFolders] = useState({ 'src': true, 'public': true })

    const toggleFolder = useCallback((pathStr) => {
        setExpandedFolders(prev => ({ ...prev, [pathStr]: !prev[pathStr] }))
    }, [])

    const openFile = useCallback((filePath) => {
        setCurrentFile(filePath)
        setOpenFiles(prev => [...new Set([...prev, filePath])])
    }, [setCurrentFile, setOpenFiles])

    // Flat file list for search
    const allFiles = useMemo(() => {
        const flatten = (node, path = '', acc = []) => {
            if (!node) return acc
            for (const key of Object.keys(node)) {
                const child = node[key]
                const currentPath = path ? `${path}/${key}` : key
                const isDir = isDirectoryNode(child)
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

    // Recursive tree renderer
    const renderTree = useCallback((node, path = '', level = 0) => {
        if (!node) return null
        const sortedKeys = Object.keys(node).sort((a, b) => {
            const aDir = isDirectoryNode(node[a])
            const bDir = isDirectoryNode(node[b])
            if (aDir && !bDir) return -1
            if (!aDir && bDir) return 1
            return a.localeCompare(b)
        })

        return sortedKeys.map((key) => {
            const childNode = node[key]
            const currentPath = path ? `${path}/${key}` : key
            const isDir = isDirectoryNode(childNode)
            const nextNode = childNode.directory || (isDir ? childNode : null)

            if (isDir) {
                const isExpanded = !!expandedFolders[currentPath]
                return (
                    <div key={currentPath}>
                        <button
                            onClick={() => toggleFolder(currentPath)}
                            className="w-full flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-left transition-all text-[12.5px] font-[600]"
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
                <div
                    key={currentPath}
                    className="w-full flex items-center justify-between rounded-[6px] transition-all group/item"
                    style={{
                        paddingLeft: `${24 + level * 10}px`,
                        background: isActive ? 'var(--nc-primary-muted)' : 'transparent',
                        border: `1px solid ${isActive ? 'var(--nc-primary-border)' : 'transparent'}`,
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                    <button
                        onClick={() => openFile(currentPath)}
                        className="flex-1 flex items-center gap-2 py-1 text-left text-[12.5px] font-[500] min-w-0"
                        style={{
                            color: isActive ? 'var(--nc-primary)' : 'var(--nc-text-secondary)',
                            background: 'transparent',
                            border: 'none',
                        }}
                    >
                        <i className={`${getFileIcon(currentPath)} text-[14px] flex-shrink-0`} />
                        <span className="truncate font-mono">{key}</span>
                    </button>
                    {onDeleteFile && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteFile(currentPath);
                            }}
                            className="opacity-0 group-hover/item:opacity-100 p-1 hover:text-red-500 rounded text-[12px] transition-opacity mr-1 flex-shrink-0"
                            title="Delete file"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--nc-text-muted)' }}
                        >
                            <i className="ri-delete-bin-line" />
                        </button>
                    )}
                </div>
            )
        })
    }, [expandedFolders, currentFile, toggleFolder, openFile, onDeleteFile])

    const isEmpty = Object.keys(fileTree).length === 0

    return (
        <div className="flex flex-col shrink-0" style={{ width: 230, background: 'var(--nc-surface)', borderRight: '1px solid var(--nc-border)' }}>
            {/* Active Workspace Header */}
            <div className="px-3 py-2.5 shrink-0 border-b flex items-center justify-between" style={{ borderColor: 'var(--nc-border)' }}>
                <button
                    onClick={onToggleWorkspaceSidebar}
                    className="flex items-center gap-2 text-left min-w-0 flex-1 hover:opacity-80 transition-opacity"
                    title="Switch Workspace"
                >
                    <i className="ri-layout-grid-line text-sky-400 text-sm shrink-0" />
                    <span className="text-[12px] font-bold text-[var(--nc-text-primary)] truncate">{activeWorkspaceName}</span>
                    <i className="ri-arrow-down-s-line text-xs text-slate-500 shrink-0" />
                </button>
                <button
                    onClick={onDownloadZip}
                    className="p-1 text-sky-400 hover:text-sky-300 rounded text-xs transition-colors shrink-0"
                    title="Download workspace as ZIP"
                >
                    <i className="ri-download-cloud-2-line text-sm" />
                </button>
            </div>

            {/* Sub Header & Search */}
            <div className="px-3 py-2 shrink-0 border-b" style={{ borderColor: 'var(--nc-border)' }}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-[700] tracking-wider uppercase text-slate-400">Files Explorer</span>
                    <button
                        onClick={onCreateFile}
                        className="text-[11px] font-[600] text-slate-300 hover:text-white flex items-center gap-1"
                        title="New file"
                    >
                        <i className="ri-add-line text-xs" />
                        New File
                    </button>
                </div>
                <div className="relative">
                    <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search files…"
                        value={fileSearchQuery}
                        onChange={(e) => setFileSearchQuery(e.target.value)}
                        className="nc-input w-full"
                        style={{ height: 28, paddingLeft: 26, fontSize: 12 }}
                        aria-label="Search files"
                    />
                </div>
            </div>

            {/* Tree */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {fileSearchQuery ? (
                    filteredFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <i className="ri-file-line text-[24px] mb-2 text-slate-600" />
                            <p className="text-[12px] font-[500] text-slate-500">No files matched</p>
                        </div>
                    ) : (
                        filteredFiles.map((file, idx) => (
                            <div
                                key={idx}
                                className="w-full flex items-center justify-between rounded-[8px] transition-all group/item"
                                style={{
                                    background: currentFile === file ? 'var(--nc-primary-muted)' : 'transparent',
                                    border: `1px solid ${currentFile === file ? 'var(--nc-primary-border)' : 'transparent'}`,
                                }}
                            >
                                <button
                                    onClick={() => openFile(file)}
                                    className="flex-1 flex items-center gap-2 px-3 py-1.5 text-left text-[12.5px] font-[500] min-w-0"
                                    style={{
                                        color: currentFile === file ? 'var(--nc-primary)' : 'var(--nc-text-secondary)',
                                        background: 'transparent',
                                        border: 'none',
                                    }}
                                >
                                    <i className={`${getFileIcon(file)} text-[14px] flex-shrink-0`} />
                                    <span className="truncate font-mono">{file}</span>
                                </button>
                                {onDeleteFile && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteFile(file);
                                        }}
                                        className="opacity-0 group-hover/item:opacity-100 p-1 hover:text-red-500 rounded text-[12px] transition-opacity mr-2 flex-shrink-0"
                                        title="Delete file"
                                    >
                                        <i className="ri-delete-bin-line" />
                                    </button>
                                )}
                            </div>
                        ))
                    )
                ) : isEmpty ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <i className="ri-file-line text-[24px] mb-2 text-slate-600" />
                        <p className="text-[12px] font-[500] text-slate-500">No files in workspace</p>
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
