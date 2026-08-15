import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PRIORITY_META = {
    high:   { label: 'High',   color: '#EF4444' },
    medium: { label: 'Medium', color: '#A1A4AC' },
    low:    { label: 'Low',    color: '#6B6F78' },
}

function initials(email) {
    if (!email) return '?'
    return email.split('@')[0].slice(0, 2).toUpperCase()
}

const TaskItem = ({ task, projectUsers = [], onToggle, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(task.title)
    const [editPriority, setEditPriority] = useState(task.priority || 'medium')
    const [editAssignedTo, setEditAssignedTo] = useState(task.assignedTo?._id || task.assignedTo || '')
    const [confirmDelete, setConfirmDelete] = useState(false)
    const inputRef = useRef(null)

    const pri = PRIORITY_META[task.priority || 'medium']
    const assignedUser = projectUsers.find(u => u._id === (task.assignedTo?._id || task.assignedTo))

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    const handleSave = () => {
        if (!editTitle.trim()) return
        onUpdate(task._id, {
            title: editTitle.trim(),
            priority: editPriority,
            assignedTo: editAssignedTo || null,
        })
        setIsEditing(false)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSave()
        if (e.key === 'Escape') {
            setEditTitle(task.title)
            setEditPriority(task.priority || 'medium')
            setEditAssignedTo(task.assignedTo?._id || task.assignedTo || '')
            setIsEditing(false)
        }
    }

    /* ── Edit mode ── */
    if (isEditing) {
        return (
            <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 py-3 border-b border-[#1A1C20]"
                style={{ background: '#101113' }}
            >
                <input
                    ref={inputRef}
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Task title…"
                    className="w-full text-[13px] font-medium bg-transparent text-[#E8E8EA] outline-none placeholder:text-[#6B6F78] mb-2.5"
                />
                <div className="flex items-center gap-2">
                    <select
                        value={editPriority}
                        onChange={e => setEditPriority(e.target.value)}
                        className="text-[11px] bg-[#15171A] text-[#A1A4AC] border border-[#24262A] rounded px-2 py-1 outline-none focus:border-[#3B82F6]"
                    >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <select
                        value={editAssignedTo}
                        onChange={e => setEditAssignedTo(e.target.value)}
                        className="text-[11px] bg-[#15171A] text-[#A1A4AC] border border-[#24262A] rounded px-2 py-1 outline-none focus:border-[#3B82F6]"
                    >
                        <option value="">Unassigned</option>
                        {projectUsers.map(u => (
                            <option key={u._id} value={u._id}>{u.email}</option>
                        ))}
                    </select>
                    <div className="flex-1" />
                    <button
                        onClick={() => { setEditTitle(task.title); setIsEditing(false) }}
                        className="text-[11px] text-[#6B6F78] hover:text-[#A1A4AC] transition-colors px-2 py-1"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="text-[11px] font-semibold text-[#0A0A0B] bg-[#3B82F6] hover:bg-[#5B9AFF] rounded px-3 py-1 transition-colors"
                    >
                        Save
                    </button>
                </div>
            </motion.div>
        )
    }

    /* ── View mode ── */
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="task-row relative"
            style={{ opacity: task.completed ? 0.5 : 1 }}
        >
            <div className={`flex items-start gap-3 px-4 py-2.5 border-b border-[#1A1C20] transition-colors cursor-default ${
                task.completed ? '' : 'hover:bg-[#111215]'
            }`}>
                {/* Checkbox */}
                <button
                    onClick={() => onToggle(task._id)}
                    className={`w-[18px] h-[18px] rounded flex items-center justify-center shrink-0 mt-[2px] transition-all border ${
                        task.completed
                            ? 'bg-[#22C55E]/15 border-[#22C55E]/40 text-[#22C55E]'
                            : 'bg-transparent border-[#30333A] hover:border-[#3B82F6] text-transparent hover:text-[#3B82F6]/40'
                    }`}
                    title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                    aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                    <i className="ri-check-line text-[11px]" />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className={`text-[13px] leading-snug transition-colors ${
                        task.completed
                            ? 'line-through text-[#6B6F78]'
                            : 'text-[#E8E8EA] font-medium'
                    }`}>
                        {task.title}
                    </p>

                    {/* Secondary info — compact plain text row */}
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#6B6F78]">
                        <span className="flex items-center gap-1">
                            <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: pri.color }}
                            />
                            {pri.label}
                        </span>

                        <span className="text-[#24262A]">·</span>

                        {assignedUser ? (
                            <span className="truncate max-w-[120px]">
                                {assignedUser.email.split('@')[0]}
                            </span>
                        ) : (
                            <span>Unassigned</span>
                        )}

                        {task.completed && (
                            <>
                                <span className="text-[#24262A]">·</span>
                                <span className="text-[#22C55E]">Completed</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Actions — hidden until hover via CSS */}
                <div className="task-row-actions flex items-center gap-0.5 shrink-0">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="w-7 h-7 rounded flex items-center justify-center text-[#6B6F78] hover:text-[#E8E8EA] hover:bg-[#1A1C20] transition-colors"
                        title="Edit"
                        aria-label="Edit task"
                    >
                        <i className="ri-pencil-line text-[12px]" />
                    </button>
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="w-7 h-7 rounded flex items-center justify-center text-[#6B6F78] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                        title="Delete"
                        aria-label="Delete task"
                    >
                        <i className="ri-delete-bin-7-line text-[12px]" />
                    </button>
                </div>
            </div>

            {/* Delete confirmation — overlay */}
            <AnimatePresence>
                {confirmDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="absolute inset-0 flex items-center justify-end gap-2 px-4 z-10 rounded"
                        style={{ background: 'rgba(10, 10, 11, 0.95)' }}
                    >
                        <span className="text-[12px] text-[#A1A4AC] mr-auto">Delete this task?</span>
                        <button
                            onClick={() => setConfirmDelete(false)}
                            className="text-[11px] text-[#6B6F78] hover:text-[#E8E8EA] px-2.5 py-1 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => { onDelete(task._id); setConfirmDelete(false) }}
                            className="text-[11px] font-semibold text-white bg-[#EF4444] hover:bg-[#DC2626] rounded px-2.5 py-1 transition-colors"
                        >
                            Delete
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default TaskItem
