import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import ProgressBar from '../ui/ProgressBar'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'

const PROJECT_COLORS = [
  '#2563EB', '#059669', '#D97706', '#DC2626', '#0891B2', '#7C3AED', '#BE185D',
]

export function getProjectColor(name = '') {
  let hash = 0
  for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length]
}

export function ProjectCard({ project, onDelete, viewMode, index }) {
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
      >
        <div className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: `${color}12` }}>
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

          <span className="text-[12px] min-w-[80px] text-right" style={{ color: 'var(--nc-text-muted)' }}>
            {formatDate(updatedAt)}
          </span>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(project._id) }}
          className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 rounded-lg transition-all"
          title="Delete project"
        >
          <i className="ri-delete-bin-line text-[15px]" />
        </button>
      </motion.div>
    )
  }

  // Grid view mode
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.04, ease: [0.25, 1, 0.5, 1] }}
      className="p-5 rounded-[16px] cursor-pointer group flex flex-col justify-between transition-all relative overflow-hidden"
      style={{
        background: 'var(--nc-surface)',
        border: '1px solid var(--nc-border)',
        minHeight: 210,
      }}
      onClick={() => navigate('/project', { state: { project } })}
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${color}12` }}>
            <i className="ri-folder-3-fill text-[18px]" style={{ color }} />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(project._id) }}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-all"
            title="Delete project"
          >
            <i className="ri-delete-bin-line text-[15px]" />
          </button>
        </div>

        <h3 className="text-[15px] font-[700] text-[var(--nc-text-primary)] truncate group-hover:text-[var(--nc-primary)] transition-colors mb-1">
          {project.name}
        </h3>

        {project.description ? (
          <p className="text-[12.5px] line-clamp-2 leading-relaxed" style={{ color: 'var(--nc-text-secondary)' }}>
            {project.description}
          </p>
        ) : (
          <p className="text-[12.5px] italic" style={{ color: 'var(--nc-text-muted)' }}>
            No description provided.
          </p>
        )}
      </div>

      <div className="pt-4 border-t" style={{ borderColor: 'var(--nc-border)' }}>
        <div className="flex items-center justify-between text-[11px] mb-2 font-[600]" style={{ color: 'var(--nc-text-secondary)' }}>
          <span>Tasks: {doneTasks}/{totalTasks}</span>
          <span>{progress}%</span>
        </div>
        <ProgressBar value={progress} size="sm" />
      </div>
    </motion.div>
  )
}
