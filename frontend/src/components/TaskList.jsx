import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TaskItem from './TaskItem'
import toast from 'react-hot-toast'

const TaskList = ({ tasks = [], projectUsers = [], onCreateTask, onUpdateTask, onDeleteTask, onToggleTask }) => {
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [newTaskPriority, setNewTaskPriority] = useState('medium')
    const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('')
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('default')
    const [showAddForm, setShowAddForm] = useState(false)
    const titleInputRef = useRef(null)

    const handleCreateTask = () => {
        if (!newTaskTitle.trim()) {
            toast.error('Please enter a task title')
            return
        }
        onCreateTask({
            title: newTaskTitle.trim(),
            priority: newTaskPriority,
            assignedTo: newTaskAssignedTo || null,
        })
        setNewTaskTitle('')
        setNewTaskPriority('medium')
        setNewTaskAssignedTo('')
        setShowAddForm(false)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCreateTask() }
        if (e.key === 'Escape') { setShowAddForm(false) }
    }

    const openForm = () => {
        setShowAddForm(true)
        setTimeout(() => titleInputRef.current?.focus(), 60)
    }

    /* ── Stats ── */
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.completed).length
    const remainingTasks = totalTasks - completedTasks
    const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    /* ── Filter + Search + Sort ── */
    let filtered = tasks.filter(task => {
        if (filter === 'active') return !task.completed
        if (filter === 'completed') return task.completed
        return true
    }).filter(task =>
        search ? task.title.toLowerCase().includes(search.toLowerCase()) : true
    )

    if (sortBy === 'priority') {
        const order = { high: 0, medium: 1, low: 2 }
        filtered = [...filtered].sort((a, b) => (order[a.priority || 'medium'] || 1) - (order[b.priority || 'medium'] || 1))
    } else if (sortBy === 'status') {
        filtered = [...filtered].sort((a, b) => Number(a.completed) - Number(b.completed))
    }

    const filters = [
        { id: 'all',       label: 'All',       count: totalTasks },
        { id: 'active',    label: 'Active',    count: remainingTasks },
        { id: 'completed', label: 'Completed', count: completedTasks },
    ]

    return (
        <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0A0A0B', color: '#E8E8EA' }}>

            {/* ── Page Header ── */}
            <div className="px-4 pt-4 pb-3 shrink-0">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-[15px] font-semibold text-[#E8E8EA]">Tasks</h2>
                    <button
                        onClick={showAddForm ? () => setShowAddForm(false) : openForm}
                        className={`text-[12px] font-medium flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                            showAddForm
                                ? 'text-[#A1A4AC] hover:text-[#E8E8EA] bg-[#15171A]'
                                : 'text-white bg-[#3B82F6] hover:bg-[#2563EB]'
                        }`}
                    >
                        <i className={showAddForm ? 'ri-close-line text-[13px]' : 'ri-add-line text-[13px]'} />
                        {showAddForm ? 'Cancel' : 'New Task'}
                    </button>
                </div>
                <p className="text-[12px] text-[#6B6F78]">
                    Plan, track, and finish the work for this workspace.
                </p>
            </div>

            {/* ── Compact Progress + Stats ── */}
            {totalTasks > 0 && (
                <div className="px-4 pb-3 shrink-0">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-[#6B6F78]">
                            {totalTasks} task{totalTasks !== 1 ? 's' : ''} · {completedTasks} completed · {remainingTasks} remaining
                        </span>
                        <span className={`text-[11px] font-medium ${pct === 100 ? 'text-[#22C55E]' : 'text-[#A1A4AC]'}`}>
                            {pct}%
                        </span>
                    </div>
                    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: '#1A1C20' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: pct === 100 ? '#22C55E' : '#3B82F6' }}
                        />
                    </div>
                </div>
            )}

            {/* ── Search + Filters ── */}
            <div className="px-4 pb-2 shrink-0 flex flex-col gap-2">
                {/* Search */}
                <div className="relative">
                    <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#6B6F78]" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search tasks…"
                        className="w-full pl-7 pr-7 py-1.5 rounded text-[12px] outline-none transition-colors"
                        style={{
                            background: '#101113',
                            border: '1px solid #24262A',
                            color: '#E8E8EA',
                        }}
                        onFocus={e => e.target.style.borderColor = '#3B82F6'}
                        onBlur={e => e.target.style.borderColor = '#24262A'}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B6F78] hover:text-[#E8E8EA] text-[12px]"
                            aria-label="Clear search"
                        >
                            <i className="ri-close-line" />
                        </button>
                    )}
                </div>

                {/* Filter + Sort Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                        {filters.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
                                    filter === f.id
                                        ? 'text-[#E8E8EA] bg-[#1A1C20] font-medium'
                                        : 'text-[#6B6F78] hover:text-[#A1A4AC]'
                                }`}
                            >
                                {f.label}
                                <span className={`ml-1 ${filter === f.id ? 'text-[#A1A4AC]' : 'text-[#3D4047]'}`}>
                                    {f.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="text-[11px] bg-transparent text-[#6B6F78] outline-none cursor-pointer hover:text-[#A1A4AC] transition-colors"
                        title="Sort tasks"
                    >
                        <option value="default">Default</option>
                        <option value="priority">Priority</option>
                        <option value="status">Status</option>
                    </select>
                </div>
            </div>

            {/* ── New Task Form ── */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden shrink-0"
                    >
                        <div className="px-4 py-3 border-y border-[#1A1C20]" style={{ background: '#0D0D0F' }}>
                            <input
                                ref={titleInputRef}
                                type="text"
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="What needs to be done?"
                                className="w-full text-[13px] font-medium bg-transparent text-[#E8E8EA] outline-none placeholder:text-[#6B6F78] mb-2.5"
                            />

                            <div className="flex items-center gap-2">
                                <select
                                    value={newTaskPriority}
                                    onChange={e => setNewTaskPriority(e.target.value)}
                                    className="text-[11px] bg-[#15171A] text-[#A1A4AC] border border-[#24262A] rounded px-2 py-1 outline-none focus:border-[#3B82F6]"
                                >
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>

                                <select
                                    value={newTaskAssignedTo}
                                    onChange={e => setNewTaskAssignedTo(e.target.value)}
                                    className="text-[11px] bg-[#15171A] text-[#A1A4AC] border border-[#24262A] rounded px-2 py-1 outline-none focus:border-[#3B82F6]"
                                >
                                    <option value="">Unassigned</option>
                                    {projectUsers.map(u => (
                                        <option key={u._id} value={u._id}>{u.email}</option>
                                    ))}
                                </select>

                                <div className="flex-1" />

                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="text-[11px] text-[#6B6F78] hover:text-[#A1A4AC] transition-colors px-2 py-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateTask}
                                    disabled={!newTaskTitle.trim()}
                                    className={`text-[11px] font-semibold rounded px-3 py-1 transition-colors ${
                                        newTaskTitle.trim()
                                            ? 'text-white bg-[#3B82F6] hover:bg-[#2563EB]'
                                            : 'text-[#6B6F78] bg-[#15171A] cursor-not-allowed'
                                    }`}
                                >
                                    Create Task
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Task List ── */}
            <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                    {filtered.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-16 px-4 text-center"
                        >
                            <p className="text-[14px] font-medium text-[#A1A4AC] mb-1">
                                {search
                                    ? 'No matching tasks'
                                    : filter === 'completed'
                                    ? 'No completed tasks yet'
                                    : 'No tasks yet'}
                            </p>
                            <p className="text-[12px] text-[#6B6F78] max-w-[240px] leading-relaxed">
                                {search
                                    ? `Nothing matches "${search}"`
                                    : 'Break your project into smaller steps and keep track of what needs to be done.'}
                            </p>
                            {!search && filter === 'all' && (
                                <button
                                    onClick={openForm}
                                    className="mt-4 text-[12px] font-medium text-[#3B82F6] hover:text-[#5B9AFF] transition-colors flex items-center gap-1"
                                >
                                    <i className="ri-add-line text-[13px]" />
                                    Create your first task
                                </button>
                            )}
                        </motion.div>
                    ) : (
                        filtered.map(task => (
                            <TaskItem
                                key={task._id}
                                task={task}
                                projectUsers={projectUsers}
                                onToggle={onToggleTask}
                                onDelete={onDeleteTask}
                                onUpdate={onUpdateTask}
                            />
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* ── AI Helper ── */}
            {totalTasks < 3 && (
                <div className="px-4 py-3 shrink-0 border-t border-[#1A1C20]">
                    <p className="text-[11px] text-[#6B6F78] leading-relaxed">
                        <span className="text-[#A1A4AC]">Tip:</span> Ask NeuraChat AI to break your project into tasks by typing <span className="text-[#3B82F6] font-medium">@ai</span> in the chat.
                    </p>
                </div>
            )}
        </div>
    )
}

export default TaskList
