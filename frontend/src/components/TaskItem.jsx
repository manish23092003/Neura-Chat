import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PRIORITY_CONFIG = {
    high: {
        label: 'High',
        color: '#EF4444',
        bg: 'rgba(239,68,68,0.12)',
        border: 'rgba(239,68,68,0.3)',
        icon: 'ri-arrow-up-double-line',
        dot: '#EF4444',
    },
    medium: {
        label: 'Medium',
        color: '#F59E0B',
        bg: 'rgba(245,158,11,0.12)',
        border: 'rgba(245,158,11,0.3)',
        icon: 'ri-arrow-up-line',
        dot: '#F59E0B',
    },
    low: {
        label: 'Low',
        color: '#22C55E',
        bg: 'rgba(34,197,94,0.12)',
        border: 'rgba(34,197,94,0.3)',
        icon: 'ri-arrow-down-line',
        dot: '#22C55E',
    },
}

function getInitials(email) {
    if (!email) return '?'
    const name = email.split('@')[0]
    return name.slice(0, 2).toUpperCase()
}

function getAvatarColor(email) {
    const colors = [
        ['#7C5CFF', '#5B3FCC'],
        ['#06B6D4', '#0891B2'],
        ['#F59E0B', '#D97706'],
        ['#22C55E', '#16A34A'],
        ['#EF4444', '#DC2626'],
        ['#EC4899', '#DB2777'],
    ]
    let hash = 0
    for (let i = 0; i < (email || '').length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
}

const TaskItem = ({ task, projectUsers = [], onToggle, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(task.title)
    const [editPriority, setEditPriority] = useState(task.priority || 'medium')
    const [editAssignedTo, setEditAssignedTo] = useState(task.assignedTo?._id || task.assignedTo || '')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const inputRef = useRef(null)
    const priority = PRIORITY_CONFIG[task.priority || 'medium']

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    const assignedUser = projectUsers.find(
        u => u._id === (task.assignedTo?._id || task.assignedTo)
    )

    const handleSaveEdit = () => {
        if (!editTitle.trim()) return
        onUpdate(task._id, {
            title: editTitle.trim(),
            priority: editPriority,
            assignedTo: editAssignedTo || null,
        })
        setIsEditing(false)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSaveEdit()
        if (e.key === 'Escape') {
            setEditTitle(task.title)
            setEditPriority(task.priority || 'medium')
            setEditAssignedTo(task.assignedTo?._id || task.assignedTo || '')
            setIsEditing(false)
        }
    }

    const [avatarBg, avatarFg] = getAvatarColor(assignedUser?.email)

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="task-item-card"
            style={{
                background: isHovered
                    ? 'var(--nc-primary-muted)'
                    : task.completed
                        ? 'rgba(34,197,94,0.03)'
                        : 'rgba(255,255,255,0.02)',
                border: `1px solid ${task.completed
                    ? 'rgba(34,197,94,0.15)'
                    : isHovered
                        ? 'var(--nc-primary-border)'
                        : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 14,
                padding: '12px 14px',
                transition: 'all 0.18s ease',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Subtle left accent line for priority */}
            <div style={{
                position: 'absolute',
                left: 0,
                top: 8,
                bottom: 8,
                width: 3,
                borderRadius: '0 3px 3px 0',
                background: priority.dot,
                opacity: task.completed ? 0.3 : 0.7,
                transition: 'opacity 0.2s',
            }} />

            <AnimatePresence mode="wait">
                {isEditing ? (
                    <motion.div
                        key="edit"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-3"
                    >
                        <input
                            ref={inputRef}
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="nc-input w-full"
                            style={{ height: 36, fontSize: 13, paddingLeft: 12 }}
                            placeholder="Task title…"
                        />
                        <div className="flex gap-2">
                            <select
                                value={editPriority}
                                onChange={e => setEditPriority(e.target.value)}
                                className="nc-input flex-1"
                                style={{ height: 32, fontSize: 12, paddingLeft: 10 }}
                            >
                                <option value="high">High Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="low">Low Priority</option>
                            </select>
                            <select
                                value={editAssignedTo}
                                onChange={e => setEditAssignedTo(e.target.value)}
                                className="nc-input flex-1"
                                style={{ height: 32, fontSize: 12, paddingLeft: 10 }}
                            >
                                <option value="">Unassigned</option>
                                {projectUsers.map(u => (
                                    <option key={u._id} value={u._id}>{u.email}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => { setEditTitle(task.title); setIsEditing(false) }}
                                className="task-btn-ghost"
                                style={{ fontSize: 12, padding: '5px 12px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="task-btn-primary"
                                style={{ fontSize: 12, padding: '5px 12px' }}
                            >
                                <i className="ri-check-line mr-1" />
                                Save
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Main Row */}
                        <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <button
                                onClick={() => onToggle(task._id)}
                                className="task-checkbox flex-shrink-0"
                                style={{
                                    marginTop: 1,
                                    width: 20,
                                    height: 20,
                                    borderRadius: 6,
                                    border: `2px solid ${task.completed ? '#22C55E' : 'rgba(255,255,255,0.2)'}`,
                                    background: task.completed ? 'rgba(34,197,94,0.15)' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.18s ease',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                }}
                                title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                            >
                                <AnimatePresence>
                                    {task.completed && (
                                        <motion.i
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="ri-check-line"
                                            style={{ fontSize: 11, color: '#22C55E', lineHeight: 1 }}
                                        />
                                    )}
                                </AnimatePresence>
                            </button>

                            {/* Title + Meta */}
                            <div className="flex-1 min-w-0">
                                <p
                                    className="task-title"
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: task.completed ? 'var(--nc-text-muted)' : 'var(--nc-text-primary)',
                                        textDecoration: task.completed ? 'line-through' : 'none',
                                        lineHeight: 1.4,
                                        wordBreak: 'break-word',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {task.title}
                                </p>

                                {/* Badges row */}
                                <div className="flex items-center flex-wrap gap-1.5 mt-2">
                                    {/* Priority badge */}
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            fontSize: 10,
                                            fontWeight: 700,
                                            padding: '2px 7px',
                                            borderRadius: 999,
                                            background: priority.bg,
                                            border: `1px solid ${priority.border}`,
                                            color: priority.color,
                                            letterSpacing: '0.04em',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        <i className={priority.icon} style={{ fontSize: 9 }} />
                                        {priority.label}
                                    </span>

                                    {/* Assignee badge */}
                                    {assignedUser ? (
                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 5,
                                                fontSize: 10,
                                                fontWeight: 600,
                                                padding: '2px 7px 2px 4px',
                                                borderRadius: 999,
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.09)',
                                                color: 'var(--nc-text-secondary)',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: '50%',
                                                    background: `linear-gradient(135deg, ${avatarBg}, ${avatarFg})`,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 8,
                                                    fontWeight: 800,
                                                    color: '#fff',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {getInitials(assignedUser.email)}
                                            </span>
                                            {assignedUser.email.split('@')[0]}
                                        </span>
                                    ) : (
                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                fontSize: 10,
                                                fontWeight: 600,
                                                padding: '2px 7px',
                                                borderRadius: 999,
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.07)',
                                                color: 'var(--nc-text-muted)',
                                            }}
                                        >
                                            <i className="ri-user-line" style={{ fontSize: 9 }} />
                                            Unassigned
                                        </span>
                                    )}

                                    {/* Completed badge */}
                                    {task.completed && (
                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                fontSize: 10,
                                                fontWeight: 700,
                                                padding: '2px 7px',
                                                borderRadius: 999,
                                                background: 'rgba(34,197,94,0.1)',
                                                border: '1px solid rgba(34,197,94,0.25)',
                                                color: '#22C55E',
                                            }}
                                        >
                                            <i className="ri-check-double-line" style={{ fontSize: 10 }} />
                                            Done
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action buttons — visible on hover */}
                            <AnimatePresence>
                                {isHovered && !showDeleteConfirm && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 6 }}
                                        transition={{ duration: 0.12 }}
                                        className="flex items-center gap-1 flex-shrink-0"
                                    >
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            title="Edit task"
                                            style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: 8,
                                                background: 'var(--nc-primary-muted)',
                                                border: '1px solid var(--nc-primary-border)',
                                                color: 'var(--nc-primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s',
                                                fontSize: 13,
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--nc-primary-border)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'var(--nc-primary-muted)'}
                                        >
                                            <i className="ri-pencil-line" />
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            title="Delete task"
                                            style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: 8,
                                                background: 'rgba(239,68,68,0.08)',
                                                border: '1px solid rgba(239,68,68,0.18)',
                                                color: '#EF4444',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s',
                                                fontSize: 13,
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                                        >
                                            <i className="ri-delete-bin-line" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Delete confirmation inline */}
                        <AnimatePresence>
                            {showDeleteConfirm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="overflow-hidden"
                                >
                                    <div
                                        className="flex items-center justify-between mt-3 px-3 py-2.5 rounded-[10px]"
                                        style={{
                                            background: 'rgba(239,68,68,0.07)',
                                            border: '1px solid rgba(239,68,68,0.2)',
                                        }}
                                    >
                                        <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>
                                            <i className="ri-error-warning-line mr-1.5" />
                                            Delete this task?
                                        </span>
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => setShowDeleteConfirm(false)}
                                                style={{
                                                    fontSize: 11,
                                                    padding: '4px 10px',
                                                    borderRadius: 7,
                                                    background: 'rgba(255,255,255,0.06)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    color: 'var(--nc-text-secondary)',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => { onDelete(task._id); setShowDeleteConfirm(false) }}
                                                style={{
                                                    fontSize: 11,
                                                    padding: '4px 10px',
                                                    borderRadius: 7,
                                                    background: 'rgba(239,68,68,0.2)',
                                                    border: '1px solid rgba(239,68,68,0.35)',
                                                    color: '#EF4444',
                                                    cursor: 'pointer',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                <i className="ri-delete-bin-fill mr-1" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default TaskItem
