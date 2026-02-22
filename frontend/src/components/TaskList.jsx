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
        <div className="flex flex-col h-full">
            {/* Header with Stats */}
            <div className="p-4 border-b border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <i className="ri-task-line text-purple-500"></i>
                            Tasks
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
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
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${completionPercentage}%` }}
                            className="h-full bg-gradient-to-r from-purple-600 to-violet-600"
                        />
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex gap-2 mt-4">
                    {['all', 'active', 'completed'].map((filterType) => (
                        <button
                            key={filterType}
                            onClick={() => setFilter(filterType)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === filterType
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
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

            {/* Add Task Form */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-b border-slate-700 overflow-hidden"
                    >
                        <div className="p-4 space-y-3">
                            <input
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Task title..."
                                className="input w-full"
                                autoFocus
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium">Priority</label>
                                    <select
                                        value={newTaskPriority}
                                        onChange={(e) => setNewTaskPriority(e.target.value)}
                                        className="input w-full bg-slate-900 text-white"
                                    >
                                        <option value="low" className="bg-slate-900 text-white">Low Priority</option>
                                        <option value="medium" className="bg-slate-900 text-white">Medium Priority</option>
                                        <option value="high" className="bg-slate-900 text-white">High Priority</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium">Assign To</label>
                                    <select
                                        value={newTaskAssignedTo}
                                        onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                                        className="input w-full bg-slate-900 text-white"
                                    >
                                        <option value="" className="bg-slate-900 text-white">Unassigned</option>
                                        {projectUsers.map((user) => (
                                            <option key={user._id} value={user._id} className="bg-slate-900 text-white">
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
            <div className="flex-1 overflow-auto p-4 space-y-2">
                <AnimatePresence>
                    {filteredTasks.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                        >
                            <i className="ri-task-line text-5xl text-slate-700 mb-3"></i>
                            <p className="text-slate-500">
                                {filter === 'all' && 'No tasks yet. Add one to get started!'}
                                {filter === 'active' && 'No active tasks'}
                                {filter === 'completed' && 'No completed tasks'}
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
