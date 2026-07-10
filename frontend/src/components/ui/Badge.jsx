import React from 'react'

/**
 * Badge — status/label chip
 * variants: primary | success | warning | danger | muted | outline
 * sizes: sm | md
 */
const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  dot = false,
  className = '',
}) => {
  const variantClass = {
    primary: 'nc-badge-primary',
    success: 'nc-badge-success',
    warning: 'nc-badge-warning',
    danger:  'nc-badge-danger',
    muted:   'nc-badge-muted',
    outline: 'nc-badge-muted',
  }[variant] || 'nc-badge-muted'

  const dotColor = {
    primary: '#7C5CFF',
    success: '#22C55E',
    warning: '#F59E0B',
    danger:  '#EF4444',
    muted:   '#64748b',
    outline: '#64748b',
  }[variant]

  const sizeStyle = size === 'sm'
    ? { fontSize: 11, padding: '2px 8px' }
    : {}

  return (
    <span
      className={`nc-badge ${variantClass} ${className}`}
      style={sizeStyle}
    >
      {dot && (
        <span
          className="flex-shrink-0 rounded-full"
          style={{ width: 6, height: 6, background: dotColor }}
        />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

export default Badge
