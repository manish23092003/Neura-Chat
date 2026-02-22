import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from "../config/axios"
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Modal from '../components/Modal'
import Button from '../components/Button'
import Input from '../components/Input'

const Home = () => {
    const { user } = useContext(UserContext)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [projectName, setProjectName] = useState('')
    const [projectDescription, setProjectDescription] = useState('')
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
    const [sortBy, setSortBy] = useState('name') // 'name', 'date', 'collaborators'
    const [deleteConfirmModal, setDeleteConfirmModal] = useState(false)
    const [projectToDelete, setProjectToDelete] = useState(null)
    const [filterByStatus, setFilterByStatus] = useState('all') // 'all', 'with-tasks', 'no-tasks'

    const navigate = useNavigate()

    function createProject(e) {
        e.preventDefault()

        if (!projectName.trim()) {
            toast.error('Please enter a project name')
            return
        }

        setCreating(true)

        axios.post('/projects/create', {
            name: projectName,
            description: projectDescription
        })
            .then((res) => {
                toast.success('Project created successfully!')
                setIsModalOpen(false)
                setProjectName('')
                setProjectDescription('')
                fetchProjects() // Refresh projects list
            })
            .catch((error) => {
                console.log(error)
                const errorMessage = error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    'Failed to create project. Please check your connection and try again.'
                toast.error(errorMessage)
            })
            .finally(() => {
                setCreating(false)
            })
    }



    const handleDeleteClick = (project, e) => {
        e.stopPropagation()
        setProjectToDelete(project)
        setDeleteConfirmModal(true)
    }

    const confirmDelete = async () => {
        if (!projectToDelete) return

        try {
            await axios.delete(`/projects/${projectToDelete._id}`)
            toast.success('Project deleted successfully')
            setDeleteConfirmModal(false)
            setProjectToDelete(null)
            fetchProjects()
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data || 'Failed to delete project')
        }
    }

    const cancelDelete = () => {
        setDeleteConfirmModal(false)
        setProjectToDelete(null)
    }

    const toggleArchive = async (projectId, e) => {
        e.stopPropagation()
        try {
            const response = await axios.put(`/projects/${projectId}/toggle-archive`)
            const updatedProject = response.data.project

            // Automatically switch to the appropriate view
            if (updatedProject.isArchived) {
                // If project was archived, switch to archived view
                setShowArchived(true)
                toast.success('Project archived! Switched to Archived view.')
            } else {
                // If project was unarchived, switch to active view
                setShowArchived(false)
                toast.success('Project unarchived! Switched to Active view.')
            }

            fetchProjects()
        } catch (error) {
            console.log(error)
            toast.error('Failed to update archive status')
        }
    }

    const fetchProjects = () => {
        setLoading(true)
        axios.get('/projects/all').then((res) => {
            setProjects(res.data.projects)
        }).catch(err => {
            console.log(err)
            toast.error('Failed to load projects')
        }).finally(() => {
            setLoading(false)
        })
    }

    useEffect(() => {
        fetchProjects()
    }, [])

    // Filter and sort projects with safety checks
    const filteredProjects = (projects || [])
        .filter(project => {
            if (!project || !project.name) return false

            // Filter by search query
            const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase())

            // Filter by status
            let matchesStatus = true
            if (filterByStatus === 'with-tasks') {
                matchesStatus = project.tasks && project.tasks.length > 0
            } else if (filterByStatus === 'no-tasks') {
                matchesStatus = !project.tasks || project.tasks.length === 0
            }

            return matchesSearch && matchesStatus
        })
        .sort((a, b) => {
            if (sortBy === 'name') {
                return (a.name || '').localeCompare(b.name || '')
            } else if (sortBy === 'date') {
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
                return dateB - dateA
            } else if (sortBy === 'collaborators') {
                const usersA = a.users ? a.users.length : 0
                const usersB = b.users ? b.users.length : 0
                return usersB - usersA
            }
            return 0
        })

    // Calculate dashboard statistics
    const statistics = {
        totalProjects: projects.length,
        activeTasks: projects.reduce((sum, p) => sum + (p.tasks?.filter(t => !t.completed).length || 0), 0),
        totalCollaborators: new Set(projects.flatMap(p => p.users?.map(u => u._id || u) || [])).size,
        completionRate: (() => {
            const totalTasks = projects.reduce((sum, p) => sum + (p.tasks?.length || 0), 0)
            const completedTasks = projects.reduce((sum, p) => sum + (p.tasks?.filter(t => t.completed).length || 0), 0)
            return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        })()
    }



    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <Header />

            <main className='p-6 max-w-7xl mx-auto'>
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">My Projects</h1>
                    <p className="text-slate-400">Manage and collaborate on your projects</p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Total Projects */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="gradient-border p-4"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Total Projects</p>
                                <p className="text-3xl font-bold text-white">{statistics.totalProjects}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center">
                                <i className="ri-folder-line text-white text-2xl"></i>
                            </div>
                        </div>
                    </motion.div>

                    {/* Active Tasks */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="gradient-border p-4"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Active Tasks</p>
                                <p className="text-3xl font-bold text-white">{statistics.activeTasks}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                                <i className="ri-task-line text-white text-2xl"></i>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Controls Bar */}
                <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input w-full"
                        />
                    </div>

                    {/* View Controls */}
                    <div className="flex gap-3 items-center">

                        {/* Filter by Status */}
                        <select
                            value={filterByStatus}
                            onChange={(e) => setFilterByStatus(e.target.value)}
                            className="px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                        >
                            <option value="all" className="bg-slate-800">All Projects</option>
                            <option value="with-tasks" className="bg-slate-800">With Tasks</option>
                            <option value="no-tasks" className="bg-slate-800">Without Tasks</option>
                        </select>

                        {/* Sort Dropdown */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                        >
                            <option value="name" className="bg-slate-800">Sort by Name</option>
                            <option value="date" className="bg-slate-800">Sort by Date</option>
                            <option value="collaborators" className="bg-slate-800">Sort by Collaborators</option>
                        </select>

                        {/* View Mode Toggle */}
                        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded transition-colors ${viewMode === 'grid'
                                    ? 'bg-purple-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <i className="ri-grid-fill"></i>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded transition-colors ${viewMode === 'list'
                                    ? 'bg-purple-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <i className="ri-list-check"></i>
                            </button>
                        </div>

                        {/* Create Project Button */}
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            variant="primary"
                            icon={<i className="ri-add-line"></i>}
                        >
                            New Project
                        </Button>
                    </div>
                </div>

                {/* Projects Grid/List */}
                {loading ? (
                    <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="skeleton h-48 rounded-xl"></div>
                        ))}
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
                            <i className="ri-folder-open-line text-5xl text-slate-600"></i>
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-2">
                            {searchQuery ? 'No projects found' : 'No projects yet'}
                        </h3>
                        <p className="text-slate-400 mb-6">
                            {searchQuery
                                ? 'Try adjusting your search query'
                                : 'Create your first project to get started'}
                        </p>
                        {!searchQuery && (
                            <Button
                                onClick={() => setIsModalOpen(true)}
                                variant="primary"
                                icon={<i className="ri-add-line"></i>}
                            >
                                Create Project
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <div className={viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                        : 'space-y-4'
                    }>
                        <AnimatePresence>
                            {filteredProjects.map((project, index) => (
                                <motion.div
                                    key={project._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`gradient-border group relative ${viewMode === 'grid' ? 'p-6' : 'p-4 flex items-center gap-4'}`}
                                >
                                    <div
                                        className={`${viewMode === 'grid' ? '' : 'flex-1'} cursor-pointer`}
                                        onClick={() => {
                                            navigate(`/project`, {
                                                state: { project }
                                            })
                                        }}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <i className="ri-folder-line text-white text-xl"></i>
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className='text-xl font-semibold text-white group-hover:text-purple-400 transition-colors'>
                                                        {project.name}
                                                    </h3>
                                                    {project.createdAt ? (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <i className="ri-calendar-line text-slate-400 text-xs"></i>
                                                            <p className="text-xs text-slate-400">
                                                                {formatDate(project.createdAt)}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <i className="ri-calendar-line text-slate-400 text-xs"></i>
                                                            <p className="text-xs text-slate-400">Recently</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {project.description && (
                                            <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                                                {project.description}
                                            </p>
                                        )}

                                        {/* Task Progress */}
                                        {project.tasks && project.tasks.length > 0 && (
                                            <div className="mb-3">
                                                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                                                    <span>Tasks</span>
                                                    <span>
                                                        {project.tasks.filter(t => t.completed).length}/{project.tasks.length} completed
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-purple-600 to-violet-600 transition-all"
                                                        style={{
                                                            width: `${project.tasks.length > 0
                                                                ? (project.tasks.filter(t => t.completed).length / project.tasks.length) * 100
                                                                : 0}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 text-sm text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <i className="ri-user-line"></i>
                                                <span>{project.users.length} {project.users.length === 1 ? 'collaborator' : 'collaborators'}</span>
                                            </div>


                                            {/* Collaborator Avatars */}
                                            {project.users.length > 0 && (
                                                <div className="flex items-center gap-2 mt-4">
                                                    <div className="flex -space-x-2">
                                                        {project.users.slice(0, 3).map((user, idx) => (
                                                            user && user.email ? (
                                                                <div
                                                                    key={idx}
                                                                    className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white text-xs font-semibold border-2 border-slate-900"
                                                                    title={user.email}
                                                                >
                                                                    {user.email.charAt(0).toUpperCase()}
                                                                </div>
                                                            ) : null
                                                        ))}
                                                        {project.users.length > 3 && (
                                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-semibold border-2 border-slate-900">
                                                                +{project.users.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    {/* Delete Button - Absolutely positioned in top-right */}
                                    <button
                                        onClick={(e) => handleDeleteClick(project, e)}
                                        className="absolute top-4 right-4 p-2 rounded-lg transition-all z-10 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                                        title="Delete project"
                                    >
                                        <i className="ri-delete-bin-line text-lg"></i>
                                    </button>

                                    {viewMode === 'list' && (
                                        <i className="ri-arrow-right-line text-slate-600 group-hover:text-purple-400 transition-colors"></i>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Create Project Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setProjectName('')
                    setProjectDescription('')
                }}
                title="Create New Project"
                size="medium"
            >
                <form onSubmit={createProject} className="space-y-5">
                    <Input
                        label="Project Name"
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Enter project name"
                        icon={<i className="ri-folder-line"></i>}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                            placeholder="What is this project about?"
                            className="input w-full min-h-[100px] resize-none"
                            rows={4}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setIsModalOpen(false)
                                setProjectName('')
                                setProjectDescription('')
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={creating}
                            icon={<i className="ri-add-line"></i>}
                        >
                            Create Project
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteConfirmModal} onClose={cancelDelete}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                            <i className="ri-error-warning-line text-2xl text-red-500"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Delete Project</h2>
                            <p className="text-sm text-slate-400">This action cannot be undone</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="text-slate-300 mb-2">
                            Are you sure you want to delete the project:
                        </p>
                        <p className="text-white font-semibold text-lg">
                            "{projectToDelete?.name}"
                        </p>
                        <p className="text-slate-400 text-sm mt-2">
                            All project data, files, and tasks will be permanently deleted.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={cancelDelete}
                            variant="secondary"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Project
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default Home
