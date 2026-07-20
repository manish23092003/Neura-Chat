import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TaskItem from './TaskItem'
import toast from 'react-hot-toast'

const PRIORITY_COLORS = {
    high: { dot: '#EF4444', label: 'High' },
    medium: { dot: '#F59E0B', label: 'Medium' },
    low: { dot: '#22C55E', label: 'Low' },
}

const StatCard = ({ label, value, icon, color, bg, border }) => (
    <div
        style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 12,
            background: bg,
            border: `1px solid ${border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--nc-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {label}
            </span>
            <i className={icon} style={{ fontSize: 13, color }} />
        </div>
        <span style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
    </div>
)

const TaskList = ({ tasks = [], projectUsers = [], onCreateTask, onUpdateTask, onDeleteTask, onToggleTask }) => {
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [newTaskPriority, setNewTaskPriority] = useState('medium')
    const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('')
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('default') // 'default', 'priority', 'status'
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

    // Stats
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.completed).length
    const activeTasks = totalTasks - completedTasks
    const highPriorityActive = tasks.filter(t => !t.completed && t.priority === 'high').length
    const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Filter + search + sort
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

    const filterTabs = [
        { id: 'all', label: 'All', count: totalTasks },
        { id: 'active', label: 'Active', count: activeTasks },
        { id: 'completed', label: 'Done', count: completedTasks },
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

            {/* ── Header ── */}
            <div style={{
                padding: '16px 16px 0',
                flexShrink: 0,
                background: 'var(--nc-surface)',
                borderBottom: '1px solid var(--nc-border)',
                paddingBottom: 0,
            }}>
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: 9,
                            background: 'var(--nc-primary-muted)',
                            border: '1px solid var(--nc-primary-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <i className="ri-task-line" style={{ fontSize: 14, color: 'var(--nc-primary)' }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--nc-text-primary)', margin: 0, lineHeight: 1 }}>
                                Task Board
                            </h2>
                            <p style={{ fontSize: 11, color: 'var(--nc-text-muted)', margin: 0, marginTop: 2 }}>
                                {activeTasks} remaining
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={showAddForm ? () => setShowAddForm(false) : openForm}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 14px',
                            borderRadius: 10,
                            background: showAddForm ? 'rgba(255,255,255,0.06)' : 'var(--nc-primary)',
                            border: `1px solid ${showAddForm ? 'var(--nc-border)' : 'transparent'}`,
                            color: showAddForm ? 'var(--nc-text-secondary)' : 'var(--nc-bg)',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.18s ease',
                            boxShadow: 'none',
                        }}
                    >
                        <i className={showAddForm ? 'ri-close-line' : 'ri-add-line'} style={{ fontSize: 14 }} />
                        {showAddForm ? 'Cancel' : 'Add Task'}
                    </button>
                </div>

                {/* Stats row */}
                {totalTasks > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                        <StatCard
                            label="Total" value={totalTasks}
                            icon="ri-list-check-3" color="var(--nc-text-secondary)"
                            bg="rgba(255,255,255,0.03)" border="rgba(255,255,255,0.07)"
                        />
                        <StatCard
                            label="Done" value={completedTasks}
                            icon="ri-check-double-line" color="#22C55E"
                            bg="rgba(34,197,94,0.07)" border="rgba(34,197,94,0.15)"
                        />
                        <StatCard
                            label="Urgent" value={highPriorityActive}
                            icon="ri-alarm-warning-line" color="#EF4444"
                            bg="rgba(239,68,68,0.07)" border="rgba(239,68,68,0.15)"
                        />
                    </div>
                )}

                {/* Progress bar */}
                {totalTasks > 0 && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--nc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                Progress
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 800, color: pct === 100 ? '#22C55E' : 'var(--nc-primary)' }}>
                                {pct}%
                            </span>
                        </div>
                        <div style={{
                            width: '100%', height: 6, borderRadius: 99,
                            background: 'rgba(255,255,255,0.06)',
                            overflow: 'hidden',
                        }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                                style={{
                                    height: '100%',
                                    borderRadius: 99,
                                    background: pct === 100
                                        ? 'linear-gradient(90deg, #22C55E, #16A34A)'
                                        : 'var(--nc-primary)',
                                    boxShadow: 'none',
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Search + Sort + Filter Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: 1 }}>
                        <i className="ri-search-line" style={{
                            position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                            fontSize: 12, color: 'var(--nc-text-muted)', pointerEvents: 'none',
                        }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search tasks…"
                            className="nc-input"
                            style={{ height: 30, paddingLeft: 28, fontSize: 12, width: '100%' }}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                style={{
                                    position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--nc-text-muted)', fontSize: 12, padding: 0, display: 'flex',
                                }}
                            >
                                <i className="ri-close-line" />
                            </button>
                        )}
                    </div>

                    {/* Sort dropdown */}
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="nc-input"
                        style={{ height: 30, fontSize: 11, paddingLeft: 8, paddingRight: 8, flexShrink: 0, width: 'auto' }}
                        title="Sort by"
                    >
                        <option value="default">Default</option>
                        <option value="priority">Priority</option>
                        <option value="status">Status</option>
                    </select>
                </div>

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: 4, marginBottom: -1 }}>
                    {filterTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '6px 12px',
                                borderRadius: '8px 8px 0 0',
                                border: `1px solid ${filter === tab.id ? 'var(--nc-border)' : 'transparent'}`,
                                borderBottom: `2px solid ${filter === tab.id ? 'var(--nc-primary)' : 'transparent'}`,
                                background: filter === tab.id ? 'var(--nc-elevated)' : 'transparent',
                                color: filter === tab.id ? 'var(--nc-text-primary)' : 'var(--nc-text-muted)',
                                fontSize: 12,
                                fontWeight: filter === tab.id ? 700 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            {tab.label}
                            <span style={{
                                fontSize: 10,
                                fontWeight: 800,
                                padding: '1px 5px',
                                borderRadius: 99,
                                background: filter === tab.id ? 'var(--nc-primary-muted)' : 'rgba(255,255,255,0.05)',
                                color: filter === tab.id ? 'var(--nc-primary)' : 'var(--nc-text-muted)',
                            }}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Add Task Form ── */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: 'hidden', flexShrink: 0 }}
                    >
                        <div style={{
                            padding: '14px 16px',
                            background: 'var(--nc-primary-muted)',
                            borderBottom: '1px solid var(--nc-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <i className="ri-add-circle-line" style={{ fontSize: 13, color: 'var(--nc-primary)' }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--nc-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    New Task
                                </span>
                            </div>

                            <input
                                ref={titleInputRef}
                                type="text"
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="What needs to be done?"
                                className="nc-input"
                                style={{ height: 38, fontSize: 13, paddingLeft: 12 }}
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <div>
                                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--nc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                                        Priority
                                    </label>
                                    <select
                                        value={newTaskPriority}
                                        onChange={e => setNewTaskPriority(e.target.value)}
                                        className="nc-input w-full"
                                        style={{ height: 34, fontSize: 12 }}
                                    >
                                        <option value="high">🔴 High Priority</option>
                                        <option value="medium">🟡 Medium Priority</option>
                                        <option value="low">🟢 Low Priority</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--nc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                                        Assign To
                                    </label>
                                    <select
                                        value={newTaskAssignedTo}
                                        onChange={e => setNewTaskAssignedTo(e.target.value)}
                                        className="nc-input w-full"
                                        style={{ height: 34, fontSize: 12 }}
                                    >
                                        <option value="">Unassigned</option>
                                        {projectUsers.map(u => (
                                            <option key={u._id} value={u._id}>{u.email}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    style={{
                                        padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600,
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--nc-border)',
                                        color: 'var(--nc-text-secondary)', cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateTask}
                                    disabled={!newTaskTitle.trim()}
                                    style={{
                                        padding: '7px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                                        background: newTaskTitle.trim() ? 'var(--nc-primary)' : 'var(--nc-primary-muted)',
                                        border: 'none',
                                        color: newTaskTitle.trim() ? 'var(--nc-bg)' : 'var(--nc-text-muted)', cursor: newTaskTitle.trim() ? 'pointer' : 'not-allowed',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        boxShadow: 'none',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <i className="ri-add-line" />
                                    Create Task
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Task List ── */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 12px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
            }}>
                <AnimatePresence mode="popLayout">
                    {filtered.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '48px 24px',
                                textAlign: 'center',
                                flex: 1,
                            }}
                        >
                            <div style={{
                                width: 56, height: 56, borderRadius: 16, marginBottom: 16,
                                background: 'var(--nc-primary-muted)',
                                border: '1px solid var(--nc-primary-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <i
                                    className={
                                        search ? 'ri-search-line' :
                                        filter === 'completed' ? 'ri-checkbox-circle-line' :
                                        filter === 'active' ? 'ri-check-double-fill' :
                                        'ri-task-line'
                                    }
                                    style={{ fontSize: 24, color: 'var(--nc-primary)', opacity: 0.6 }}
                                />
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--nc-text-primary)', margin: '0 0 6px' }}>
                                {search ? 'No matching tasks' :
                                    filter === 'completed' ? 'No completed tasks' :
                                    filter === 'active' ? 'All caught up! 🎉' :
                                    'No tasks yet'}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--nc-text-muted)', margin: 0, maxWidth: 200 }}>
                                {search ? `No tasks matching "${search}"` :
                                    filter === 'all' ? 'Click "Add Task" to get started.' :
                                    filter === 'active' ? 'All tasks are completed.' :
                                    'Complete some tasks to see them here.'}
                            </p>
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    style={{
                                        marginTop: 14, padding: '6px 16px', borderRadius: 9, fontSize: 12,
                                        fontWeight: 600, background: 'var(--nc-primary-muted)',
                                        border: '1px solid var(--nc-primary-border)',
                                        color: 'var(--nc-primary)', cursor: 'pointer',
                                    }}
                                >
                                    Clear search
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

            {/* ── Footer quick-add hint ── */}
            {!showAddForm && totalTasks > 0 && (
                <div style={{
                    padding: '10px 16px',
                    borderTop: '1px solid var(--nc-border)',
                    flexShrink: 0,
                }}>
                    <button
                        onClick={openForm}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 10,
                            background: 'transparent',
                            border: '1px dashed var(--nc-border)',
                            color: 'var(--nc-text-muted)',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--nc-primary-muted)'
                            e.currentTarget.style.color = 'var(--nc-primary)'
                            e.currentTarget.style.borderColor = 'var(--nc-primary-border)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = 'var(--nc-text-muted)'
                            e.currentTarget.style.borderColor = 'var(--nc-border)'
                        }}
                    >
                        <i className="ri-add-line" style={{ fontSize: 14 }} />
                        Add another task…
                        <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.5 }}>Enter</span>
                    </button>
                </div>
            )}
        </div>
    )
}

export default TaskList
