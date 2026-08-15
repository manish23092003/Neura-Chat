import React, { useContext, useState, useEffect, useCallback } from 'react'
import { UserContext } from '../context/user.context'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from '../config/axios'

// UI Components
import Header from '../components/ui/Header'
import Button from '../components/ui/Button'
import SearchBar from '../components/ui/SearchBar'
import EmptyState from '../components/ui/EmptyState'
import { CardSkeleton } from '../components/ui/LoadingSkeleton'
import Modal from '../components/ui/Modal'

// Decomposed Home Sub-Components
import { StatCardGrid } from '../components/home/StatCards'
import { ProjectCard } from '../components/home/ProjectCard'
import { CreateProjectModal } from '../components/home/CreateProjectModal'

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
  const [projects, setProjects] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('date')
  const [filterByStatus, setFilterByStatus] = useState('all')
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)

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
      let role = ''
      if (accept) {
        const input = window.prompt("What will be your role in this project? (e.g. Frontend Developer, Designer):")
        if (input === null) return
        if (!input.trim()) {
          toast.error("Role is required to accept the invitation")
          return
        }
        role = input.trim()
      }
      const res = await axios.post('/projects/invitations/respond', { projectId, accept, role })
      toast.success(res.data.message || (accept ? 'Invitation accepted! 🎉' : 'Invitation declined.'))
      fetchInvitations()
      fetchProjects()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to respond to invitation')
    }
  }

  const createProject = useCallback(async ({ name, description, role, createGitRepo, isPrivate }) => {
    await axios.post('/projects/create', { name, description, role, createGitRepo, isPrivate })
    toast.success('Project created!')
    fetchProjects()
  }, [fetchProjects])

  const handleDeleteClick = (projectId) => {
    const proj = projects.find(p => p._id === projectId)
    setProjectToDelete(proj)
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
  const totalProjects = projects.length
  const completedTasks = projects.reduce((s, p) => s + (p.tasks?.filter(t => t.completed).length || 0), 0)
  const activeCollaborators = new Set(projects.flatMap(p => p.users?.map(u => u._id || u) || [])).size
  const totalFiles = projects.reduce((s, p) => s + (p.fileTree ? Object.keys(p.fileTree).length : 0), 0)

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

      <main className="max-w-[1280px] mx-auto px-6 py-8 relative z-10">
        {/* Top greeting */}
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

        {/* Stats */}
        <StatCardGrid
          totalProjects={totalProjects}
          completedTasks={completedTasks}
          activeCollaborators={activeCollaborators}
          totalFiles={totalFiles}
        />

        {/* Projects section */}
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

          {/* Pending Invitations */}
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
                        style={{ height: 32 }}
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

          {/* Project Grid / List */}
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

      {/* Floating create button */}
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
