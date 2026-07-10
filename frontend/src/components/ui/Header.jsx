import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { UserContext } from '../../context/user.context'
import Avatar from './Avatar'
import Dropdown from './Dropdown'

/**
 * Header — 72px sticky top navbar
 * Includes: Logo, Search, Notifications, AI Command Bar, Profile Menu
 */
const Header = ({ onMenuToggle, showMenuButton = false }) => {
  const { user, setUser } = useContext(UserContext)
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }, [navigate, setUser])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cmd+K search shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('nc-global-search')?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const profileItems = [
    {
      icon: <i className="ri-user-3-line" />,
      label: 'Profile & Settings',
      onClick: () => navigate('/profile'),
    },
    {
      icon: <i className="ri-home-4-line" />,
      label: 'Dashboard',
      onClick: () => navigate('/home'),
    },
    { divider: true },
    {
      icon: <i className="ri-logout-box-r-line" />,
      label: 'Sign out',
      onClick: handleLogout,
      danger: true,
    },
  ]

  return (
    <header
      className={`nc-header ${scrolled ? 'nc-header-scrolled' : ''}`}
      style={{
        background: 'var(--nc-surface)',
        borderBottom: '1px solid var(--nc-border)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        height: 72,
        display: 'flex',
        alignItems: 'center',
      }}
      role="banner"
    >
      <div
        className="w-full h-full flex items-center px-6 gap-4"
        style={{ maxWidth: '100%' }}
      >
        {/* Mobile menu button */}
        {showMenuButton && (
          <button
            onClick={onMenuToggle}
            className="nc-btn-icon lg:hidden"
            aria-label="Toggle sidebar"
          >
            <i className="ri-menu-line text-[18px]" />
          </button>
        )}

        {/* Logo */}
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-3 flex-shrink-0 group"
          aria-label="NeuraChat home"
        >
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #7C5CFF 0%, #5B3FD9 100%)',
              boxShadow: '0 0 20px rgba(124,92,255,0.35)',
            }}
          >
            <i className="ri-sparkling-2-fill text-white text-[18px]" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span
              className="text-[17px] font-[700] tracking-tight"
              style={{
                background: 'linear-gradient(135deg, var(--nc-text-primary) 0%, var(--nc-primary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              NeuraChat
            </span>
            <span className="text-[9px] font-[600] tracking-[0.2em] uppercase" style={{ color: 'var(--nc-text-muted)' }}>
              AI Platform
            </span>
          </div>
        </button>

        {/* Divider */}
        <div className="w-px h-6 flex-shrink-0" style={{ background: 'var(--nc-divider)' }} />

        {/* Global Search */}
        <div className={`flex-1 max-w-md relative ${searchFocused ? '' : ''}`}>
          <i
            className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px]"
            style={{ color: 'var(--nc-text-muted)', pointerEvents: 'none' }}
          />
          <input
            id="nc-global-search"
            type="text"
            placeholder="Search projects, tasks, files…"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="nc-search-input"
            style={{ paddingLeft: 38 }}
            aria-label="Global search"
          />
          <kbd
            className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-[600]"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--nc-text-muted)',
              border: '1px solid var(--nc-border)',
            }}
          >
            ⌘K
          </kbd>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">

          {/* Profile */}
          {user && (
            <Dropdown
              trigger={
                <button
                  className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-[12px] transition-colors"
                  style={{
                    background: 'var(--nc-elevated)',
                    border: '1px solid var(--nc-border)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--nc-border-hover)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--nc-border)'}
                  aria-label="User menu"
                >
                  <Avatar email={user.email} name={user.name} size="sm" />
                  <div className="hidden md:flex flex-col items-start leading-none">
                    <span className="text-[13px] font-[600] text-[var(--nc-text-primary)]">
                      {user.name || user.email?.split('@')[0] || 'User'}
                    </span>
                    <span className="text-[11px] truncate max-w-[100px]" style={{ color: 'var(--nc-text-secondary)' }}>
                      {user.email}
                    </span>
                  </div>
                  <i className="ri-arrow-down-s-line text-[14px] hidden md:block" style={{ color: 'var(--nc-text-secondary)' }} />
                </button>
              }
              items={profileItems}
              placement="bottom-right"
            />
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
