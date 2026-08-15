import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { commandRegistry } from '../../services/commandRegistry'
import { flattenFileTree } from '../../config/lifoRuntime'

/**
 * CommandPalette Component
 *
 * Dual-mode search modal for:
 * - Command Palette (Ctrl + Shift + P)
 * - Quick Open File Search (Ctrl + P)
 */
export function CommandPalette({
    isOpen,
    onClose,
    mode = 'commands', // 'commands' | 'files'
    fileTree = {},
    onSelectFile,
}) {
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [commands, setCommands] = useState([])

    // Subscribe to command registry updates
    useEffect(() => {
        setCommands(commandRegistry.getAll())
        return commandRegistry.subscribe(setCommands)
    }, [])

    // Flatten file tree for file search
    const allFiles = useMemo(() => {
        if (mode !== 'files') return []
        return flattenFileTree(fileTree)
    }, [fileTree, mode])

    // Filter results based on search query
    const results = useMemo(() => {
        const q = query.toLowerCase().trim()
        if (mode === 'commands') {
            if (!q) return commands
            return commands.filter(c =>
                c.label.toLowerCase().includes(q) ||
                c.category?.toLowerCase().includes(q) ||
                c.id.toLowerCase().includes(q)
            )
        } else {
            // mode === 'files'
            if (!q) return allFiles.slice(0, 20)
            return allFiles
                .filter(f => f.path.toLowerCase().includes(q))
                .slice(0, 20)
        }
    }, [query, mode, commands, allFiles])

    // Reset index on search change or mode change
    useEffect(() => {
        setSelectedIndex(0)
    }, [query, mode])

    // Reset query when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('')
            setSelectedIndex(0)
        }
    }, [isOpen])

    const handleSelect = useCallback((item) => {
        if (!item) return
        if (mode === 'commands') {
            onClose()
            commandRegistry.execute(item.id)
        } else {
            onClose()
            onSelectFile?.(item.path)
        }
    }, [mode, onClose, onSelectFile])

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(idx => (idx + 1) % Math.max(1, results.length))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(idx => (idx - 1 + results.length) % Math.max(1, results.length))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (results[selectedIndex]) {
                handleSelect(results[selectedIndex])
            }
        } else if (e.key === 'Escape') {
            onClose()
        }
    }, [results, selectedIndex, handleSelect, onClose])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: -10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-200"
                >
                    {/* Header Input */}
                    <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-950/80 gap-3">
                        <i className={mode === 'commands' ? 'ri-command-line text-sky-400 text-lg' : 'ri-file-search-line text-emerald-400 text-lg'} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            placeholder={mode === 'commands' ? 'Type a command or search...' : 'Search file by name...'}
                            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none font-medium"
                        />
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            ESC to close
                        </span>
                    </div>

                    {/* Results List */}
                    <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                        {results.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-500">
                                No {mode === 'commands' ? 'commands' : 'files'} matching "{query}"
                            </div>
                        ) : (
                            results.map((item, idx) => {
                                const isSelected = idx === selectedIndex

                                if (mode === 'commands') {
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={`px-3 py-2 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'bg-sky-600 text-white shadow-md'
                                                    : 'hover:bg-slate-800/60 text-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <i className={`${item.icon || 'ri-function-line'} text-sm ${isSelected ? 'text-white' : 'text-sky-400'}`} />
                                                <span className="font-semibold">{item.label}</span>
                                                {item.category && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                                        isSelected ? 'bg-sky-700 text-sky-100' : 'bg-slate-800 text-slate-400'
                                                    }`}>
                                                        {item.category}
                                                    </span>
                                                )}
                                            </div>
                                            {item.shortcut && (
                                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                                    isSelected ? 'border-sky-400 text-sky-100' : 'border-slate-800 bg-slate-950 text-slate-400'
                                                }`}>
                                                    {item.shortcut}
                                                </span>
                                            )}
                                        </div>
                                    )
                                } else {
                                    return (
                                        <div
                                            key={item.path}
                                            onClick={() => handleSelect(item)}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={`px-3 py-2 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'bg-emerald-600 text-white shadow-md'
                                                    : 'hover:bg-slate-800/60 text-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <i className={`ri-file-code-line text-sm ${isSelected ? 'text-white' : 'text-emerald-400'}`} />
                                                <span className="font-semibold truncate">{item.path}</span>
                                            </div>
                                        </div>
                                    )
                                }
                            })
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
