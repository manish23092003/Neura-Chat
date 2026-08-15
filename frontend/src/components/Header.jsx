              border: '1px solid var(--nc-border)',
            }}
          >
            ⌘K
          </kbd>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">

          {/* AI Command */}
          <button
            className="hidden md:flex items-center gap-2 px-3 h-9 rounded-[10px] text-[13px] font-[600] transition-all"
            style={{
              background: 'rgba(124,92,255,0.1)',
              color: '#A78BFA',
              border: '1px solid rgba(124,92,255,0.2)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(124,92,255,0.18)'
              e.currentTarget.style.borderColor = 'rgba(124,92,255,0.35)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(124,92,255,0.1)'
              e.currentTarget.style.borderColor = 'rgba(124,92,255,0.2)'
            }}
            aria-label="AI Assistant"
          >
            <i className="ri-sparkling-2-line text-[15px]" />
            <span>AI</span>
          </button>


          {/* Profile */}
          {user && (
            <Dropdown
              trigger={
                <button
                  className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-[12px] transition-colors"
                  style={{ border: '1px solid var(--nc-border)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--nc-border-hover)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--nc-border)'}
                  aria-label="User menu"
                >
                  <Avatar email={user.email} name={user.name} size="sm" />
                  <span className="hidden md:block text-[13px] font-[600] text-[var(--nc-text-primary)]">
                    {user.name || user.email?.split('@')[0] || 'User'}
                  </span>
                  <i className="ri-arrow-down-s-line text-[14px] hidden md:block" style={{ color: 'var(--nc-text-muted)' }} />
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
