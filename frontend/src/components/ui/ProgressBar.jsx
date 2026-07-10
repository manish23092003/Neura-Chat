import React from 'react'

/**
 * ProgressBar — linear progress indicator
 * variants: primary | success | warning | danger
 */
const ProgressBar = ({
  value = 0,       // 0–100
  variant = 'primary',
  size = 'md',     // sm | md | lg
  showLabel = false,
  animated = true,
  className = '',
}) => {
  const clampedValue = Math.max(0, Math.min(100, value))

  const height = { sm: 3, md: 4, lg: 6 }[size] || 4

  const gradients = {
    primary: 'linear-gradient(90deg, #7C5CFF 0%, #8C6FFF 100%)',
    success: 'linear-gradient(90deg, #22C55E 0%, #4ade80 100%)',
    warning: 'linear-gradient(90deg, #F59E0B 0%, #fbbf24 100%)',
    danger:  'linear-gradient(90deg, #EF4444 0%, #f87171 100%)',
  }[variant] || 'linear-gradient(90deg, #7C5CFF 0%, #8C6FFF 100%)'

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="nc-caption" style={{ color: 'var(--nc-text-secondary)' }}>Progress</span>
          <span className="nc-caption" style={{ color: 'var(--nc-text-primary)' }}>{clampedValue}%</span>
        </div>
      )}
      <div
        className="nc-progress"
        style={{ height }}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`nc-progress-bar ${animated ? 'transition-all duration-500' : ''}`}
          style={{ width: `${clampedValue}%`, background: gradients }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
