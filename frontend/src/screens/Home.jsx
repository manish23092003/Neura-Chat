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
function StatCard({ icon, label, value, trend, color = '#7C5CFF', index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25 }}
      whileHover={{ y: -2 }}
      className="nc-stat-card"
    >
      <div className="flex items-start justify-between">
        <div
          className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}1A`, border: `1px solid ${color}30` }}
        >
          <i className={`${icon} text-[20px]`} style={{ color }} />
        </div>
        {trend !== undefined && (
          <span
            className="text-[12px] font-[700] px-2 py-1 rounded-full"
            style={{
              background: trend >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              color: trend >= 0 ? '#22C55E' : '#EF4444',
            }}
          >
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[32px] font-[700] text-[var(--nc-text-primary)] leading-none tracking-tight">{value}</p>
        <p className="text-[13px] font-[500] mt-1" style={{ color: 'var(--nc-text-secondary)' }}>{label}</p>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────
   Project Card
───────────────────────────────────────── */
const PROJECT_COLORS = [
  '#7C5CFF', '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2',
]

function getProjectColor(name = '') {
  let hash = 0
  for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length]
}

function ProjectCard({ project, onOpen, onDelete, viewMode, index }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: index * 0.04 }}
        className="flex items-center gap-4 px-5 py-4 rounded-[14px] cursor-pointer group transition-all"
        style={{
          background: 'var(--nc-elevated)',
          border: '1px solid var(--nc-border)',
        }}
        onClick={() => navigate('/project', { state: { project } })}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = `${color}40`
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--nc-border)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}1A`, border: `1px solid ${color}30` }}
        >
          <i className="ri-folder-3-fill text-[18px]" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-[600] text-[var(--nc-text-primary)] truncate">{project.name}</p>
          {project.description && (
            <p className="text-[13px] truncate mt-0.5" style={{ color: 'var(--nc-text-secondary)' }}>
              {project.description}
            </p>
          )}
        </div>
        <div className="hidden md:flex items-center gap-6 flex-shrink-0">
          <div className="w-24">
            <ProgressBar value={progress} size="sm" />
            <p className="text-[11px] mt-1 font-[600]" style={{ color: 'var(--nc-text-muted)' }}>
              {doneTasks}/{totalTasks} tasks
            </p>
          </div>
          <div className="flex -space-x-2">
            {members.slice(0, 3).map((m, i) => m?.email ? (
              <Avatar key={i} email={m.email} size="xs" className="ring-2" style={{ '--tw-ring-color': 'var(--nc-elevated)' }} />
            ) : null)}
            {members.length > 3 && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-[700]"
                style={{ background: 'var(--nc-surface)', border: '2px solid var(--nc-elevated)', color: 'var(--nc-text-secondary)' }}>
                +{members.length - 3}
              </div>
            )}
          </div>
          <span className="text-[12px] font-[500] w-20 text-right" style={{ color: 'var(--nc-text-muted)' }}>
            {formatDate(updatedAt)}
          </span>
        </div>
        <i className="ri-arrow-right-s-line text-[18px] ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--nc-text-secondary)' }} />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className="relative group rounded-[16px] p-6 cursor-pointer transition-all"
      style={{
        background: 'var(--nc-elevated)',
        border: '1px solid var(--nc-border)',
      }}
      onClick={() => navigate('/project', { state: { project } })}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${color}40`
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--nc-border)'
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}1A`, border: `1px solid ${color}30` }}
        >
          <i className="ri-folder-3-fill text-[20px]" style={{ color }} />
        </div>

        {/* Quick actions */}
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(project, e) }}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-all"
            style={{ color: 'var(--nc-text-muted)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
              e.currentTarget.style.color = '#EF4444'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--nc-text-muted)'
            }}
            title="Delete project"
            aria-label="Delete project"
          >
            <i className="ri-delete-bin-line text-[15px]" />
          </button>
        </div>
      </div>

      {/* Name + description */}
      <h3 className="text-[16px] font-[600] text-[var(--nc-text-primary)] mb-1 truncate">{project.name}</h3>
      {project.description && (
        <p className="text-[13px] nc-truncate-2 mb-4" style={{ color: 'var(--nc-text-secondary)' }}>
          {project.description}
        </p>
      )}

      {/* Progress */}
      {totalTasks > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-[600]" style={{ color: 'var(--nc-text-secondary)' }}>Progress</span>
            <span className="text-[12px] font-[700]" style={{ color: 'var(--nc-text-primary)' }}>
              {doneTasks}/{totalTasks}
            </span>
          </div>
          <ProgressBar value={progress} size="sm" />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2">
        {/* Members */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m, i) => m?.email ? (
              <div key={i} className="rounded-full" style={{ border: '2px solid var(--nc-elevated)' }}>
                <Avatar email={m.email} size="xs" />
              </div>
            ) : null)}
            {members.length > 4 && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-[700]"
                style={{ background: 'var(--nc-surface)', border: '2px solid var(--nc-elevated)', color: 'var(--nc-text-secondary)' }}>
                +{members.length - 4}
              </div>
            )}
          </div>
          {members.length > 0 && (
            <span className="text-[12px] font-[500]" style={{ color: 'var(--nc-text-muted)' }}>
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
          )}
        </div>

        {/* Updated time */}
        <span className="text-[12px] font-[500]" style={{ color: 'var(--nc-text-muted)' }}>
          {formatDate(updatedAt)}
        </span>
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
  const [visibility, setVisibility] = useState('private')
  const [aiEnabled, setAiEnabled] = useState(true)
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Project name is required'); return }
    setCreating(true)
    try {
      await onCreate({ name: name.trim(), description: description.trim() })
      setName(''); setDescription(''); setVisibility('private'); setAiEnabled(true)
      onClose()
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    if (!creating) { setName(''); setDescription(''); onClose() }
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

        <Select
          label="Visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          icon={<i className="ri-lock-line" />}
          options={[
            { value: 'private', label: 'Private — only invited members' },
            { value: 'team', label: 'Team — everyone in workspace' },
            { value: 'public', label: 'Public — anyone with link' },
          ]}
        />

        {/* AI Toggle */}
        <div
          className="flex items-center justify-between p-4 rounded-[12px]"
          style={{ background: 'var(--nc-surface)', border: '1px solid var(--nc-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(124,92,255,0.12)', border: '1px solid rgba(124,92,255,0.2)' }}
            >
              <i className="ri-sparkling-2-line text-[16px]" style={{ color: 'var(--nc-primary)' }} />
            </div>
            <div>
              <p className="text-[14px] font-[600] text-[var(--nc-text-primary)]">AI Assistance</p>
              <p className="text-[12px]" style={{ color: 'var(--nc-text-muted)' }}>Auto-suggest tasks and summaries</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAiEnabled(v => !v)}
            className="relative flex-shrink-0"
            style={{ width: 44, height: 24 }}
            aria-pressed={aiEnabled}
          >
            <div
              className="absolute inset-0 rounded-full transition-colors duration-150"
              style={{
                background: aiEnabled ? 'var(--nc-primary)' : 'rgba(255,255,255,0.1)',
                border: `1px solid ${aiEnabled ? 'var(--nc-primary)' : 'rgba(255,255,255,0.12)'}`,
              }}
            />
            <div
              className="absolute rounded-full bg-white transition-transform duration-150"
              style={{ width: 18, height: 18, top: 3, left: 3, transform: aiEnabled ? 'translateX(20px)' : 'translateX(0)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
            />
          </button>
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

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const createProject = useCallback(async ({ name, description }) => {
    const res = await axios.post('/projects/create', { name, description })
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
    <div className="min-h-screen" style={{ background: 'var(--nc-bg)' }}>
      <Header />

      <main className="max-w-[1280px] mx-auto px-6 py-8">

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
          <StatCard icon="ri-folder-3-line"   label="Total projects"   value={stats.totalProjects}    index={0} color="#7C5CFF" />
          <StatCard icon="ri-task-line"        label="Active tasks"     value={stats.activeTasks}      index={1} color="#2563EB" />
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
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg lg:hidden z-30"
        style={{
          background: 'linear-gradient(135deg, #7C5CFF 0%, #5B3FD9 100%)',
          boxShadow: '0 8px 24px rgba(124,92,255,0.5)',
        }}
        onClick={() => setIsModalOpen(true)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Create new project"
      >
        <i className="ri-add-line text-[var(--nc-text-primary)] text-[24px]" />
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
