import React, { useState } from 'react'

/**
 * Tabs — horizontal tab bar
 * items: [{ id, label, icon?, badge? }]
 */
const Tabs = ({
  items = [],
  activeId,
  onChange,
  className = '',
  variant = 'default',  // default | pills | underline
}) => {
  if (variant === 'pills') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {items.map((item) => {
          const isActive = item.id === activeId
          return (
            <button
              key={item.id}
              onClick={() => onChange?.(item.id)}
              className="flex items-center gap-2 px-4 h-9 rounded-[10px] text-[14px] font-[500] transition-all"
              style={{
                background: isActive ? 'var(--nc-primary-muted)' : 'transparent',
                color: isActive ? 'var(--nc-primary)' : 'var(--nc-text-secondary)',
                border: `1px solid ${isActive ? 'var(--nc-primary-border)' : 'transparent'}`,
                fontWeight: isActive ? 600 : 500,
              }}
              aria-selected={isActive}
              role="tab"
            >
              {item.icon && <i className={`${item.icon} text-[15px]`} />}
              {item.label}
              {item.badge !== undefined && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-[11px] font-[700]"
                  style={{
                    background: isActive ? 'rgba(124,92,255,0.2)' : 'rgba(255,255,255,0.08)',
                    color: isActive ? 'var(--nc-primary)' : 'var(--nc-text-muted)',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  if (variant === 'underline') {
    return (
      <div
        className={`flex gap-1 ${className}`}
        style={{ borderBottom: '1px solid var(--nc-border)' }}
      >
        {items.map((item) => {
          const isActive = item.id === activeId
          return (
            <button
              key={item.id}
              onClick={() => onChange?.(item.id)}
              className="flex items-center gap-2 px-4 pb-3 text-[14px] transition-all relative"
              style={{
                color: isActive ? 'var(--nc-text-primary)' : 'var(--nc-text-secondary)',
                fontWeight: isActive ? 600 : 500,
                borderBottom: isActive ? '2px solid var(--nc-primary)' : '2px solid transparent',
                marginBottom: -1,
              }}
              aria-selected={isActive}
              role="tab"
            >
              {item.icon && <i className={`${item.icon} text-[15px]`} />}
              {item.label}
              {item.badge !== undefined && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-[11px] font-[700]"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: 'var(--nc-text-muted)',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // Default: pill container
  return (
    <div className={`nc-tabs ${className}`} role="tablist">
      {items.map((item) => {
        const isActive = item.id === activeId
        return (
          <button
            key={item.id}
            onClick={() => onChange?.(item.id)}
            className={`nc-tab ${isActive ? 'active' : ''}`}
            aria-selected={isActive}
            role="tab"
          >
            {item.icon && <i className={`${item.icon} text-[15px]`} />}
            {item.label}
            {item.badge !== undefined && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[11px] font-[700]"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                  color: isActive ? 'var(--nc-text-primary)' : 'var(--nc-text-muted)',
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
