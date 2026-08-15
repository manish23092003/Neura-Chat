import React from 'react'
import { motion } from 'framer-motion'

export function StatCard({ icon, label, value, color = '#2563EB', index = 0 }) {
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

export function StatCardGrid({ totalProjects, completedTasks, activeCollaborators, totalFiles }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard icon="ri-folder-3-line" label="Projects" value={totalProjects} color="#2563EB" index={0} />
      <StatCard icon="ri-task-line" label="Tasks Completed" value={completedTasks} color="#16A34A" index={1} />
      <StatCard icon="ri-team-line" label="Collaborators" value={activeCollaborators} color="#7C3AED" index={2} />
      <StatCard icon="ri-file-code-line" label="Total Files" value={totalFiles} color="#D97706" index={3} />
    </div>
  )
}
