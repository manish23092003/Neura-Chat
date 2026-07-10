import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TaskItem from './TaskItem'
import Button from './Button'
import toast from 'react-hot-toast'

const TaskList = ({ tasks = [], projectUsers = [], onCreateTask, onUpdateTask, onDeleteTask, onToggleTask }) => {
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [newTaskPriority, setNewTaskPriority] = useState('medium')
    const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('')
    const [filter, setFilter] = useState('all') // 'all', 'active', 'completed'
    const [showAddForm, setShowAddForm] = useState(false)

    const handleCreateTask = () => {
        if (!newTaskTitle.trim()) {
            toast.error('Please enter a task title')
            return
        }

        const taskData = {
            title: newTaskTitle,
            priority: newTaskPriority,
            assignedTo: newTaskAssignedTo || null
        }

        onCreateTask(taskData)
        setNewTaskTitle('')
        setNewTaskPriority('medium')
        setNewTaskAssignedTo('')
        setShowAddForm(false)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleCreateTask()
        }
    }

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        if (filter === 'active') return !task.completed
        if (filter === 'completed') return task.completed
        return true
    })

    // Calculate stats
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.completed).length
    const activeTasks = totalTasks - completedTasks
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header with Stats */}
            <div className="p-5 border-b border-purple-500/20 bg-black/40">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2 tracking-tight glow-text">
                            <div className="w-7 h-7 rounded border border-cyan-500/30 flex items-center justify-center bg-cyan-900/30">
                                <i className="ri-task-line text-cyan-300"></i>
                            </div>
                            Tasks
                        </h3>
                        <p className="text-xs text-purple-300 font-medium mt-1">
                            {completedTasks} of {totalTasks} completed
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAddForm(!showAddForm)}
                        variant="primary"
                        size="small"
                        icon={<i className={showAddForm ? "ri-close-line" : "ri-add-line"}></i>}
                    >
                        {showAddForm ? 'Cancel' : 'Add Task'}
                    </Button>
                </div>

                {/* Progress Bar */}
                {totalTasks > 0 && (
                    <div className="w-full bg-indigo-950/50 rounded-full h-1.5 overflow-hidden border border-purple-500/20 mt-4 shadow-inner">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${completionPercentage}%` }}
                            className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                        />
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex gap-2 mt-5">
                    {['all', 'active', 'completed'].map((filterType) => (
                        <button
                            key={filterType}
                            onClick={() => setFilter(filterType)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filter === filterType
                                ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                                : 'text-purple-300 hover:text-white hover:bg-purple-900/40 border border-transparent hover:border-purple-500/30'
                                }`}
                        >
                            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                            {filterType === 'all' && ` (${totalTasks})`}
                            {filterType === 'active' && ` (${activeTasks})`}
                            {filterType === 'completed' && ` (${completedTasks})`}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-b border-purple-500/20 overflow-hidden bg-black/60 backdrop-blur-md"
                    >
                        <div className="p-5 space-y-4">
                            <input
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Task title..."
                                className="galaxy-input w-full rounded-lg px-4 py-2 text-sm"
                                autoFocus
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-purple-300 font-bold uppercase tracking-widest glow-text">Priority</label>
                                    <select
                                        value={newTaskPriority}
                                        onChange={(e) => setNewTaskPriority(e.target.value)}
                                        className="galaxy-input w-full rounded-lg text-sm px-3 py-2 shadow-sm [&>option]:bg-[#050511] [&>option]:text-purple-100"
                                    >
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-purple-300 font-bold uppercase tracking-widest glow-text">Assign To</label>
                                    <select
                                        value={newTaskAssignedTo}
                                        onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                                        className="galaxy-input w-full rounded-lg text-sm px-3 py-2 shadow-sm [&>option]:bg-[#050511] [&>option]:text-purple-100"
                                    >
                                        <option value="">Unassigned</option>
                                        {projectUsers.map((user) => (
                                            <option key={user._id} value={user._id}>
                                                {user.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    onClick={() => setShowAddForm(false)}
                                    variant="secondary"
                                    size="small"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateTask}
                                    variant="primary"
                                    size="small"
                                    icon={<i className="ri-add-line"></i>}
                                >
                                    Add Task
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Task List */}
            <div className="flex-1 overflow-auto p-5 space-y-3 z-0 relative bg-black/20">
                <AnimatePresence>
                    {filteredTasks.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16 mt-8 galaxy-glass max-w-sm mx-auto shadow-[0_0_20px_rgba(139,92,246,0.1)] border-purple-500/20"
                        >
                            <div className="w-16 h-16 mx-auto bg-purple-900/30 rounded-xl flex items-center justify-center mb-6 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                                <i className="ri-task-line text-4xl text-cyan-400"></i>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 tracking-tight glow-text">Clean Slate</h3>
                            <p className="text-sm font-medium text-purple-300">
                                {filter === 'all' && 'No tasks yet. Plan your next milestone!'}
                                {filter === 'active' && 'All caught up. Great job!'}
                                {filter === 'completed' && 'No completed tasks yet.'}
                            </p>
                        </motion.div>
                    ) : (
                        filteredTasks.map((task) => (
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
        </div>
    )
}

export default TaskList
