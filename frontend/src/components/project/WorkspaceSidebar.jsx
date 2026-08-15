import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function formatRelativeTime(dateString) {
    if (!dateString) return 'Updated recently'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Updated recently'
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (1000 * 60))
    if (diffMins < 1) return 'Updated just now'
    if (diffMins < 60) return `Updated ${diffMins} min ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Updated ${diffHours} hr${diffHours > 1 ? 's' : ''} ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Updated yesterday'
    if (diffDays < 30) return `Updated ${diffDays} days ago`
    return `Updated ${date.toLocaleDateString()}`
}

export function WorkspaceSidebar({
    workspaces,
    activeWorkspaceId,
    onSwitchWorkspace,
    onCreateWorkspace,
    onRenameWorkspace,
    onDuplicateWorkspace,
    onDeleteWorkspace,
    onTogglePinWorkspace,
    isOpen,
    onClose,
}) {
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('date') // 'date' | 'name' | 'pinned'

    // Filter & sort workspaces
    const filteredWorkspaces = useMemo(() => {
        return workspaces
            .filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                if (sortBy === 'pinned') return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)
                if (sortBy === 'name') return a.name.localeCompare(b.name)
                return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
            })
    }, [workspaces, searchQuery, sortBy])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.aside
                initial={{ x: -280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="w-72 flex flex-col h-full shrink-0 border-r z-40 bg-[#0A0A0B] border-[#24262A] text-[#E8E8EA] font-sans select-none"
            >
                {/* ── Header ── */}
                <div className="p-3.5 border-b border-[#24262A] flex items-center justify-between shrink-0 bg-[#101113]">
                    <div className="flex items-center gap-2">
                        <i className="ri-layout-grid-fill text-[#3B82F6] text-sm" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#E8E8EA]">WORKSPACES</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono text-[#A1A4AC] bg-[#15171A] border border-[#24262A]">
                            {workspaces.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => {
                                const promptStr = prompt('Enter a title for your new workspace:')
                                if (promptStr) onCreateWorkspace(promptStr)
                            }}
                            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium text-xs px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors shadow-xs"
                            title="New Workspace"
                        >
                            <i className="ri-add-line text-sm" />
                            <span>New</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="w-6 h-6 rounded flex items-center justify-center text-[#A1A4AC] hover:text-white hover:bg-[#1A1C20] transition-colors"
                            title="Close sidebar"
                        >
                            <i className="ri-close-line text-base" />
                        </button>
                    </div>
                </div>

                {/* ── Search & Sort Control Bar ── */}
                <div className="p-3 border-b border-[#24262A] space-y-2 shrink-0 bg-[#0A0A0B]">
                    <div className="relative">
                        <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6B6F78]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search workspaces..."
                            className="w-full pl-8 pr-3 py-1.5 rounded-md text-xs bg-[#101113] border border-[#24262A] text-[#E8E8EA] placeholder-[#6B6F78] outline-none focus:border-[#3B82F6] transition-colors"
                        />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-[10px] font-semibold text-[#6B6F78]">Sort</span>
                        <div className="flex gap-2">
                            {[
                                { id: 'date', label: 'Recent' },
                                { id: 'name', label: 'Name' },
                                { id: 'pinned', label: 'Pinned' },
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setSortBy(mode.id)}
                                    className={`transition-colors ${
                                        sortBy === mode.id
                                            ? 'text-[#3B82F6] font-semibold'
                                            : 'text-[#A1A4AC] hover:text-[#E8E8EA]'
                                    }`}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Workspaces List ── */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredWorkspaces.length === 0 ? (
                        <div className="py-12 text-center text-[#6B6F78] text-xs">
                            No matching workspaces
                        </div>
                    ) : (
                        filteredWorkspaces.map((ws) => {
                            const isActive = ws.id === activeWorkspaceId
                            const fileCount = ws.fileTree ? Object.keys(ws.fileTree).length : 0
                            return (
                                <div
                                    key={ws.id}
                                    onClick={() => onSwitchWorkspace(ws.id)}
                                    className={`w-full group relative flex items-center justify-between p-2.5 rounded-md text-left cursor-pointer transition-colors border ${
                                        isActive
                                            ? 'bg-[#15171A] border-[#24262A] text-white'
                                            : 'bg-transparent border-transparent hover:bg-[#101113] text-[#A1A4AC] hover:text-[#E8E8EA]'
                                    }`}
                                >
                                    {/* Subtle Primary Accent Left Indicator */}
                                    {isActive && (
                                        <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-[#3B82F6] rounded-r" />
                                    )}

                                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pl-1.5">
                                        <i className={`ri-${ws.isPinned ? 'pushpin-fill text-[#F59E0B]' : 'folder-3-line text-[#A1A4AC]'} text-sm shrink-0`} />
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-xs font-semibold truncate leading-tight ${
                                                isActive ? 'text-[#E8E8EA]' : 'text-[#A1A4AC] group-hover:text-[#E8E8EA]'
                                            }`}>
                                                {ws.name}
                                            </p>
                                            <p className="text-[11px] text-[#6B6F78] truncate mt-0.5 font-sans">
                                                {fileCount > 0 ? `${fileCount} file${fileCount === 1 ? '' : 's'} · ` : ''}{formatRelativeTime(ws.updatedAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Micro Icons */}
                                    <div className="flex items-center gap-1 shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onTogglePinWorkspace(ws.id) }}
                                            className={`p-1 rounded text-[#A1A4AC] hover:text-[#F59E0B] hover:bg-[#1A1C20] transition-colors`}
                                            title={ws.isPinned ? 'Unpin' : 'Pin'}
                                        >
                                            <i className="ri-pushpin-line text-xs" />
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                const newName = prompt('Rename workspace:', ws.name)
                                                if (newName) onRenameWorkspace(ws.id, newName)
                                            }}
                                            className="p-1 rounded text-[#A1A4AC] hover:text-[#3B82F6] hover:bg-[#1A1C20] transition-colors"
                                            title="Rename"
                                        >
                                            <i className="ri-edit-line text-xs" />
                                        </button>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDuplicateWorkspace(ws.id) }}
                                            className="p-1 rounded text-[#A1A4AC] hover:text-[#22C55E] hover:bg-[#1A1C20] transition-colors"
                                            title="Duplicate"
                                        >
                                            <i className="ri-file-copy-line text-xs" />
                                        </button>

                                        {workspaces.length > 1 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (confirm(`Delete workspace "${ws.name}"?`)) onDeleteWorkspace(ws.id)
                                                }}
                                                className="p-1 rounded text-[#A1A4AC] hover:text-[#EF4444] hover:bg-[#1A1C20] transition-colors"
                                                title="Delete"
                                            >
                                                <i className="ri-delete-bin-line text-xs" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </motion.aside>
        </AnimatePresence>
    )
}

export default WorkspaceSidebar
