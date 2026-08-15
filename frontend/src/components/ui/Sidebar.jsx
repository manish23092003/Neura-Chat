import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useContext } from 'react'
import { UserContext } from '../../context/user.context'
import Avatar from './Avatar'
import NeuraLogo from './NeuraLogo'

/**
 * Sidebar — collapsible navigation sidebar
 * Collapses to icon-only (64px) on toggle
 */
const NAV_ITEMS = [
  { icon: 'ri-dashboard-line',    label: 'Dashboard',  path: '/home' },
  { icon: 'ri-folder-3-line',     label: 'Projects',   path: '/home' },
  { icon: 'ri-message-3-line',    label: 'Chat',       path: '/home' },
  { icon: 'ri-task-line',         label: 'Tasks',      path: '/home' },
  { icon: 'ri-attachment-2',      label: 'Files',      path: '/home' },
  { icon: 'ri-team-line',         label: 'Members',    path: '/home' },
]

const BOTTOM_ITEMS = [
  { icon: 'ri-settings-3-line',   label: 'Settings',   path: '/profile' },
  { icon: 'ri-user-3-line',       label: 'Profile',    path: '/profile' },
]

const Sidebar = ({
  collapsed = false,
  onToggle,
  activeItem,
  onNavClick,
  className = '',
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, setUser } = useContext(UserContext)

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }, [navigate, setUser])

  const handleNav = (item) => {
    onNavClick?.(item)
    navigate(item.path)
  }

  return (
    <aside
      className={`nc-sidebar ${collapsed ? 'nc-sidebar-collapsed' : 'nc-sidebar-expanded'} ${className}`}
      aria-label="Main navigation"
    >
      {/* Top: Logo + Toggle */}
      <div
        className="flex items-center px-4 flex-shrink-0"
        style={{
          height: 72,
          borderBottom: '1px solid var(--nc-border)',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <NeuraLogo size={28} showText animated />
          </div>
        ) : (
          <NeuraLogo size={28} animated />
        )}

        <button
          onClick={onToggle}
          className="nc-btn-icon flex-shrink-0"
          style={{ width: 32, height: 32 }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={`ri-${collapsed ? 'menu-unfold' : 'menu-fold'}-line text-[16px]`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto nc-scrollbar-hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = activeItem === item.label || location.pathname === item.path
          return (
            <button
              key={item.label}
              onClick={() => handleNav(item)}
              className={`nc-nav-item w-full ${isActive ? 'active' : ''}`}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <i className={`${item.icon} text-[18px] flex-shrink-0`} />
              {!collapsed && (
                <motion.span
                  initial={false}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[14px] font-[500] truncate"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom: Settings + Profile */}
      <div
        className="px-3 py-4 space-y-1"
        style={{ borderTop: '1px solid var(--nc-border)' }}
      >
        {BOTTOM_ITEMS.map((item) => (
          <button
            key={item.label}
            onClick={() => handleNav(item)}
            className="nc-nav-item w-full"
            style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            title={collapsed ? item.label : undefined}
            aria-label={item.label}
          >
            <i className={`${item.icon} text-[18px] flex-shrink-0`} />
            {!collapsed && <span className="text-[14px] font-[500] truncate">{item.label}</span>}
          </button>
        ))}

        {/* User row */}
        <button
          onClick={() => navigate('/profile')}
          className="nc-nav-item w-full mt-2"
          style={{
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px' : '8px 12px',
          }}
          title={collapsed ? (user?.name || user?.email) : undefined}
          aria-label="User profile"
        >
          <Avatar email={user?.email} name={user?.name} size="sm" />
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-[600] text-[var(--nc-text-primary)] truncate">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-[11px] truncate" style={{ color: 'var(--nc-text-muted)' }}>
                {user?.email}
              </p>
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
