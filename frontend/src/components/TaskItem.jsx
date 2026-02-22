import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const TaskItem = ({ task, onToggle, onDelete, onUpdate, projectUsers }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editedTitle, setEditedTitle] = useState(task.title)

    const priorityColors = {
        low: 'text-green-400 bg-green-400/10 border-green-400/30',
        medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
        high: 'text-red-400 bg-red-400/10 border-red-400/30'
    }

    const handleSave = () => {
        if (!editedTitle.trim()) {
            toast.error('Task title cannot be empty')
            return
        }
        onUpdate(task._id, { title: editedTitle })
        setIsEditing(false)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSave()
        } else if (e.key === 'Escape') {
            setEditedTitle(task.title)
            setIsEditing(false)
        }
    }

    const formatDueDate = (date) => {
        if (!date) return null
        const dueDate = new Date(date)
        const today = new Date()
        const diffTime = dueDate - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return { text: 'Overdue', color: 'text-red-400' }
        if (diffDays === 0) return { text: 'Today', color: 'text-orange-400' }
        if (diffDays === 1) return { text: 'Tomorrow', color: 'text-yellow-400' }
        if (diffDays <= 7) return { text: `${diffDays} days`, color: 'text-blue-400' }
        return { text: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'text-slate-400' }
    }

    const dueInfo = formatDueDate(task.dueDate)

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`group flex items-start gap-3 p-3 rounded-lg border transition-all ${task.completed
                    ? 'bg-slate-800/50 border-slate-700'
                    : 'bg-slate-800 border-slate-700 hover:border-purple-500/50'
                }`}
        >
            {/* Checkbox */}
            <button
                onClick={() => onToggle(task._id)}
                className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${task.completed
                        ? 'bg-purple-600 border-purple-600'
                        : 'border-slate-600 hover:border-purple-500'
                    }`}
            >
                {task.completed && <i className="ri-check-line text-white text-xs"></i>}
            </button>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onBlur={handleSave}
                        className="input w-full py-1 px-2 text-sm"
                        autoFocus
                    />
                ) : (
                    <h4
                        className={`text-sm font-medium transition-all ${task.completed
                                ? 'text-slate-500 line-through'
                                : 'text-white'
                            }`}
                    >
                        {task.title}
                    </h4>
                )}

                {/* Task Meta */}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {/* Priority Badge */}
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}>
                        {task.priority}
                    </span>

                    {/* Assigned User */}
                    {task.assignedTo && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white text-xs font-semibold">
                                {task.assignedTo.email?.charAt(0).toUpperCase()}
                            </div>
                            <span>{task.assignedTo.email}</span>
                        </div>
                    )}

                    {/* Due Date */}
                    {dueInfo && (
                        <div className={`flex items-center gap-1 text-xs ${dueInfo.color}`}>
                            <i className="ri-calendar-line"></i>
                            <span>{dueInfo.text}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
                    title="Edit task"
                >
                    <i className="ri-edit-line text-sm"></i>
                </button>
                <button
                    onClick={() => onDelete(task._id)}
                    className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-slate-400 hover:text-red-400"
                    title="Delete task"
                >
                    <i className="ri-delete-bin-line text-sm"></i>
                </button>
            </div>
        </motion.div>
    )
}

export default TaskItem
