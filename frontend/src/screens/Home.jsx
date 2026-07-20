import React, { useContext, useState, useEffect, useCallback } from 'react'
import { UserContext } from '../context/user.context'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from '../config/axios'
import { useNavigate } from 'react-router-dom'

// UI Components
import Header from '../components/ui/Header'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import ProgressBar from '../components/ui/ProgressBar'
import SearchBar from '../components/ui/SearchBar'
import Select from '../components/ui/Select'
import EmptyState from '../components/ui/EmptyState'
import { CardSkeleton } from '../components/ui/LoadingSkeleton'
import Modal from '../components/ui/Modal'

/* ─────────────────────────────────────────
   Stat Card
───────────────────────────────────────── */
function StatCard({ icon, label, value, color = '#2563EB', index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      className="p-5 rounded-[14px] flex items-center gap-4"
      style={{
        background: 'var(--nc-surface)',
        border: '1px solid var(--nc-border)',
      }}
    >
      <div
        className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
        style={{ 
          background: `${color}12`, 
          color: color,
        }}
      >
        <i className={`${icon} text-[20px]`} />
      </div>
      <div>
        <p className="text-[11px] font-[600] tracking-wider uppercase" style={{ color: 'var(--nc-text-muted)' }}>{label}</p>
        <p className="text-[24px] font-[700] text-[var(--nc-text-primary)] mt-0.5 leading-none tracking-tight">{value}</p>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────
   Project Card
───────────────────────────────────────── */
const PROJECT_COLORS = [
  '#2563EB', '#059669', '#D97706', '#DC2626', '#0891B2', '#7C3AED', '#BE185D',
]

function getProjectColor(name = '') {
  let hash = 0
  for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length]
}

function ProjectCard({ project, onDelete, viewMode, index }) {
  const navigate = useNavigate()
  const totalTasks = project.tasks?.length || 0
  const doneTasks = project.tasks?.filter(t => t.completed).length || 0
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const color = getProjectColor(project.name)
  const members = project.users || []
  const updatedAt = project.updatedAt || project.createdAt

  const formatDate = (d) => {
    if (!d) return 'Recently'
    const date = new Date(d)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: index * 0.03, ease: [0.25, 1, 0.5, 1] }}
        className="flex items-center gap-4 px-5 py-4 rounded-[14px] cursor-pointer group transition-all"
        style={{
          background: 'var(--nc-surface)',
          border: '1px solid var(--nc-border)',
        }}
        onClick={() => navigate('/project', { state: { project } })}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--nc-border-hover)'
          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = ''
          e.currentTarget.style.boxShadow = ''
        }}
      >
        <div
          className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0"
          style={{ 
            background: `${color}12`,
          }}
        >
          <i className="ri-folder-3-fill text-[16px]" style={{ color }} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-[600] text-[var(--nc-text-primary)] truncate group-hover:text-[var(--nc-primary)] transition-colors">
            {project.name}
          </p>
          {project.description ? (
            <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--nc-text-secondary)' }}>
              {project.description}
            </p>
          ) : (
            <p className="text-[12px] truncate mt-0.5 italic" style={{ color: 'var(--nc-text-muted)' }}>
              No description
            </p>
          )}
        </div>

        <div className="hidden md:flex items-center gap-6 flex-shrink-0">
          <div className="w-28">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-[600]" style={{ color: 'var(--nc-text-muted)' }}>PROGRESS</span>
              <span className="text-[10px] font-[700]" style={{ color: 'var(--nc-text-secondary)' }}>{progress}%</span>
            </div>
            <ProgressBar value={progress} size="sm" />
          </div>

          <div className="flex items-center gap-1.5 min-w-[70px] justify-center">
            <i className="ri-checkbox-circle-line text-[14px]" style={{ color: progress === 100 ? 'var(--nc-success)' : 'var(--nc-text-muted)' }} />
            <span className="text-[12px] font-[600]" style={{ color: 'var(--nc-text-secondary)' }}>
              {doneTasks}/{totalTasks}
            </span>
          </div>

          <div className="flex -space-x-2">
            {members.slice(0, 3).map((m, i) => m?.email ? (
              <Avatar key={i} email={m.email} size="xs" className="ring-2" style={{ '--tw-ring-color': 'var(--nc-surface)' }} />
            ) : null)}
            {members.length > 3 && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-[700] ring-2"
                style={{ background: 'var(--nc-elevated)', color: 'var(--nc-text-secondary)' }}>
                +{members.length - 3}
              </div>
            )}
          </div>
          
          <span className="text-[12px] font-[500] w-20 text-right" style={{ color: 'var(--nc-text-muted)' }}>
            {formatDate(updatedAt)}
          </span>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150" onClick={e => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(project, e) }}
            className="nc-btn-icon"
            style={{ width: 30, height: 30 }}
            title="Delete project"
          >
            <i className="ri-delete-bin-line text-[13px]" />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.04, ease: [0.25, 1, 0.5, 1] }}
      className="relative group rounded-[14px] p-5 cursor-pointer transition-all flex flex-col h-full"
      style={{
        background: 'var(--nc-surface)',
        border: '1px solid var(--nc-border)',
      }}
      onClick={() => navigate('/project', { state: { project } })}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--nc-border-hover)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = ''
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = ''
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}12` }}
        >
          <i className="ri-folder-3-fill text-[18px]" style={{ color }} />
        </div>

        {/* Quick actions */}
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(project, e) }}
            className="nc-btn-icon"
            style={{ width: 30, height: 30 }}
            title="Delete project"
            aria-label="Delete project"
          >
            <i className="ri-delete-bin-line text-[13px]" />
          </button>
        </div>
      </div>

      {/* Name + description */}
      <h3 className="text-[15px] font-[600] text-[var(--nc-text-primary)] mb-1 truncate group-hover:text-[var(--nc-primary)] transition-colors">
        {project.name}
      </h3>
      {project.description ? (
        <p className="text-[13px] nc-truncate-2 mb-5 leading-relaxed" style={{ color: 'var(--nc-text-secondary)' }}>
          {project.description}
        </p>
      ) : (
        <p className="text-[13px] italic mb-5 leading-relaxed" style={{ color: 'var(--nc-text-muted)' }}>
          No description provided.
        </p>
      )}

      {/* Progress / Tasks Stats */}
      <div className="mt-auto">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-[600] tracking-wider" style={{ color: 'var(--nc-text-muted)' }}>PROGRESS</span>
            <span className="text-[12px] font-[700]" style={{ color: 'var(--nc-text-secondary)' }}>
              {doneTasks}/{totalTasks} Tasks ({progress}%)
            </span>
          </div>
          <ProgressBar value={progress} size="sm" />
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--nc-border)' }}>
          {/* Members */}
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1.5">
              {members.slice(0, 4).map((m, i) => m?.email ? (
                <div key={i} className="rounded-full ring-2" style={{ '--tw-ring-color': 'var(--nc-surface)' }}>
                  <Avatar email={m.email} size="xs" />
                </div>
              ) : null)}
              {members.length > 4 && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-[700] ring-2"
                  style={{ background: 'var(--nc-elevated)', color: 'var(--nc-text-secondary)' }}>
                  +{members.length - 4}
                </div>
              )}
            </div>
          </div>

          {/* Updated time */}
          <span className="text-[11px] font-[500]" style={{ color: 'var(--nc-text-muted)' }}>
            {formatDate(updatedAt)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────
   Create Project Modal
───────────────────────────────────────── */
function CreateProjectModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [role, setRole] = useState('')
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Project name is required'); return }
    if (!role.trim()) { toast.error('Your role is required'); return }
    setCreating(true)
    try {
      await onCreate({ name: name.trim(), description: description.trim(), role: role.trim() })
      setName(''); setDescription(''); setRole('')
      onClose()
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    if (!creating) { setName(''); setDescription(''); setRole(''); onClose() }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New project"
      subtitle="Create a workspace for your team"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Project name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Marketing Website Redesign"
          icon={<i className="ri-folder-3-line" />}
          required
          autoFocus
        />

        <div>
          <label className="nc-label">Description <span className="font-[400]" style={{ color: 'var(--nc-text-muted)' }}>(optional)</span></label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
            rows={3}
            className="nc-input nc-textarea w-full"
            style={{ resize: 'none' }}
          />
        </div>

        <div>
          <label className="nc-label">Your Role <span className="text-red-500">*</span></label>
          <Input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Frontend Developer, Project Manager"
            icon={<i className="ri-user-star-line" />}
            required
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} fullWidth disabled={creating}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={creating} fullWidth icon={<i className="ri-add-line" />}>
            Create project
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/* ─────────────────────────────────────────
   Delete Confirm Modal
───────────────────────────────────────── */
function DeleteModal({ isOpen, project, onConfirm, onCancel }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      showCloseButton={false}
    >
      <div className="text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <i className="ri-delete-bin-line text-[24px]" style={{ color: '#EF4444' }} />
        </div>
        <h3 className="text-[18px] font-[700] text-[var(--nc-text-primary)] mb-2">Delete project?</h3>
        <p className="text-[14px] mb-1" style={{ color: 'var(--nc-text-secondary)' }}>
          This will permanently delete
        </p>
        <p className="text-[16px] font-[700] text-[var(--nc-text-primary)] mb-2">"{project?.name}"</p>
        <p className="text-[13px] mb-6" style={{ color: 'var(--nc-text-muted)' }}>
          All tasks, files, and messages will be lost. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} fullWidth>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} fullWidth>Delete project</Button>
        </div>
      </div>
    </Modal>
  )
}

/* ─────────────────────────────────────────
   HOME SCREEN
───────────────────────────────────────── */
const Home = () => {
  const { user } = useContext(UserContext)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projects, setProjects] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('date')
  const [filterByStatus, setFilterByStatus] = useState('all')
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)

  const navigate = useNavigate()

  const fetchProjects = useCallback(() => {
    setLoading(true)
    axios.get('/projects/all')
      .then((res) => setProjects(res.data.projects || []))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false))
  }, [])

  const fetchInvitations = useCallback(() => {
    axios.get('/projects/invitations')
      .then((res) => setInvitations(res.data.invitations || []))
      .catch(() => console.error('Failed to load invitations'))
  }, [])

  useEffect(() => { 
    fetchProjects()
    fetchInvitations()
  }, [fetchProjects, fetchInvitations])

  const handleRespondInvitation = async (projectId, accept) => {
    try {
      const res = await axios.post('/projects/invitations/respond', { projectId, accept })
      toast.success(res.data.message || (accept ? 'Invitation accepted! 🎉' : 'Invitation declined.'))
      fetchInvitations()
      fetchProjects()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to respond to invitation')
    }
  }

  const createProject = useCallback(async ({ name, description, role }) => {
    const res = await axios.post('/projects/create', { name, description, role })
    toast.success('Project created!')
    fetchProjects()
  }, [fetchProjects])

  const handleDeleteClick = (project, e) => {
    e?.stopPropagation()
    setProjectToDelete(project)
    setDeleteConfirmModal(true)
  }

  const confirmDelete = async () => {
    if (!projectToDelete) return
    try {
      await axios.delete(`/projects/${projectToDelete._id}`)
      toast.success('Project deleted')
      setDeleteConfirmModal(false)
      setProjectToDelete(null)
      fetchProjects()
    } catch {
      toast.error('Failed to delete project')
    }
  }

  // Computed stats
  const stats = {
    totalProjects: projects.length,
    activeTasks: projects.reduce((s, p) => s + (p.tasks?.filter(t => !t.completed).length || 0), 0),
    totalCollaborators: new Set(projects.flatMap(p => p.users?.map(u => u._id || u) || [])).size,
    completionRate: (() => {
      const total = projects.reduce((s, p) => s + (p.tasks?.length || 0), 0)
      const done = projects.reduce((s, p) => s + (p.tasks?.filter(t => t.completed).length || 0), 0)
      return total > 0 ? Math.round((done / total) * 100) : 0
    })(),
  }

  // Filtered + sorted projects
  const filteredProjects = projects
    .filter(p => {
      if (!p?.name) return false
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchFilter = filterByStatus === 'all'
        ? true
        : filterByStatus === 'with-tasks'
          ? (p.tasks?.length || 0) > 0
          : (p.tasks?.length || 0) === 0
      return matchSearch && matchFilter
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
      if (sortBy === 'date') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      if (sortBy === 'collaborators') return (b.users?.length || 0) - (a.users?.length || 0)
      return 0
    })

  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening'
  const userName = user?.name || user?.email?.split('@')[0] || 'there'

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--nc-bg)' }}>
      <Header />

      {/* Clean background — no ambient glows */}

      <main className="max-w-[1280px] mx-auto px-6 py-8 relative z-10">

        {/* ── Top greeting ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-8 flex-wrap gap-4"
        >
          <div>
            <h1 className="text-[32px] font-[700] text-[var(--nc-text-primary)] tracking-tight">
              {greeting}, {userName} 👋
            </h1>
            <p className="text-[15px] mt-1" style={{ color: 'var(--nc-text-secondary)' }}>{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              icon={<i className="ri-add-line" />}
              onClick={() => setIsModalOpen(true)}
            >
              New project
            </Button>
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon="ri-folder-3-line"   label="Total projects"   value={stats.totalProjects}    index={0} color="#2563EB" />
          <StatCard icon="ri-task-line"        label="Active tasks"     value={stats.activeTasks}      index={1} color="#0891B2" />
          <StatCard icon="ri-team-line"        label="Collaborators"    value={stats.totalCollaborators} index={2} color="#059669" />
          <StatCard icon="ri-pie-chart-2-line" label="Completion rate"  value={`${stats.completionRate}%`} index={3} color="#D97706" />
        </div>

        {/* ── Projects section ── */}
        <div>
          {/* Controls row */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <h2 className="text-[20px] font-[700] text-[var(--nc-text-primary)] mr-auto">Projects</h2>

            {/* Search */}
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search projects…"
              className="w-56"
            />

            {/* Filter */}
            <select
              value={filterByStatus}
              onChange={(e) => setFilterByStatus(e.target.value)}
              className="nc-input nc-select"
              style={{ height: 40, width: 160, fontSize: 14 }}
              aria-label="Filter projects"
            >
              <option value="all">All projects</option>
              <option value="with-tasks">With tasks</option>
              <option value="no-tasks">No tasks</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="nc-input nc-select"
              style={{ height: 40, width: 140, fontSize: 14 }}
              aria-label="Sort projects"
            >
              <option value="date">Latest first</option>
              <option value="name">By name</option>
              <option value="collaborators">By members</option>
            </select>

            {/* View toggle */}
            <div
              className="flex gap-1 p-1 rounded-[10px]"
              style={{ background: 'var(--nc-surface)', border: '1px solid var(--nc-border)' }}
            >
              {['grid', 'list'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-all"
                  style={{
                    background: viewMode === mode ? 'var(--nc-elevated)' : 'transparent',
                    color: viewMode === mode ? 'var(--nc-text-primary)' : 'var(--nc-text-muted)',
                    boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                  }}
                  aria-label={`${mode} view`}
                  aria-pressed={viewMode === mode}
                >
                  <i className={`ri-${mode === 'grid' ? 'grid-fill' : 'list-check'} text-[15px]`} />
                </button>
              ))}
            </div>
          </div>

          {/* Pending Invitations list */}
          {invitations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 rounded-[14px]"
              style={{
                background: 'var(--nc-primary-muted)',
                border: '1px solid var(--nc-primary-border)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <i className="ri-mail-unread-line text-[20px]" style={{ color: 'var(--nc-primary)' }} />
                <h3 className="text-[16px] font-[700] text-[var(--nc-text-primary)]" style={{ margin: 0 }}>
                  Pending Invitations ({invitations.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invitations.map((inv) => (
                  <div
                    key={inv._id}
                    className="p-4 rounded-[12px] flex flex-col justify-between"
                    style={{
                      background: 'var(--nc-surface)',
                      border: '1px solid var(--nc-border)',
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <i className="ri-folder-3-line text-[16px]" style={{ color: 'var(--nc-primary)' }} />
                        <span className="text-[15px] font-[600] text-[var(--nc-text-primary)] truncate">
                          {inv.name}
                        </span>
                      </div>
                      {inv.description && (
                        <p className="text-[12px] nc-truncate-2 mb-3" style={{ color: 'var(--nc-text-secondary)', fontStyle: 'italic' }}>
                          "{inv.description}"
                        </p>
                      )}
                      <p className="text-[11px] mb-4" style={{ color: 'var(--nc-text-muted)' }}>
                        Invited by: {inv.users?.map(u => u.email).join(', ') || 'Project Members'}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Button
                        onClick={() => handleRespondInvitation(inv._id, false)}
                        variant="secondary"
                        size="xs"
                        fullWidth
                        style={{ height: 32 }}
                      >
                        Decline
                      </Button>
                      <Button
                        onClick={() => handleRespondInvitation(inv._id, true)}
                        variant="primary"
                        size="xs"
                        fullWidth
                        style={{
                          height: 32,
                        }}
                        icon={<i className="ri-check-line" />}
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Project list/grid */}
          {loading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
              {Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : filteredProjects.length === 0 ? (
            <EmptyState
              icon={searchQuery ? 'ri-search-line' : 'ri-folder-add-line'}
              title={searchQuery ? 'No matching projects' : 'No projects yet'}
              description={
                searchQuery
                  ? `No projects match "${searchQuery}". Try a different search.`
                  : 'Create your first project and start collaborating with your team.'
              }
              primaryAction={!searchQuery ? {
                label: 'Create project',
                onClick: () => setIsModalOpen(true),
                icon: 'ri-add-line',
              } : undefined}
              secondaryAction={searchQuery ? {
                label: 'Clear search',
                onClick: () => setSearchQuery(''),
              } : undefined}
            />
          ) : (
            <AnimatePresence mode="sync">
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
              }>
                {filteredProjects.map((project, i) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    onDelete={handleDeleteClick}
                    viewMode={viewMode}
                    index={i}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Floating create button (mobile) */}
      <motion.button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center lg:hidden z-30"
        style={{
          backgroundColor: 'var(--nc-primary)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
        onClick={() => setIsModalOpen(true)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        aria-label="Create new project"
      >
        <i className="ri-add-line text-[24px]" style={{ color: 'var(--nc-bg)' }} />
      </motion.button>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={createProject}
      />

      <DeleteModal
        isOpen={deleteConfirmModal}
        project={projectToDelete}
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteConfirmModal(false); setProjectToDelete(null) }}
      />
    </div>
  )
}

export default Home
