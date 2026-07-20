import React from 'react'

/**
 * Switch — toggle switch input
 */
const Switch = ({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  className = '',
  size = 'md',    // sm | md
}) => {
  const switchId = id || `switch-${Math.random().toString(36).slice(2)}`

  const trackStyle = size === 'sm'
    ? { width: 36, height: 20 }
    : { width: 44, height: 24 }

  const thumbSize = size === 'sm' ? 14 : 18
  const thumbOffset = size === 'sm' ? 3 : 3
  const translateX = size === 'sm' ? 16 : 20

  return (
    <label
      htmlFor={switchId}
      className={`flex items-center gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <div className="relative flex-shrink-0" style={trackStyle}>
        <input
          type="checkbox"
          id={switchId}
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        {/* Track */}
        <div
          className="absolute inset-0 rounded-full transition-colors duration-150"
          style={{
            background: checked ? 'var(--nc-primary)' : 'var(--nc-elevated)',
            border: `1px solid ${checked ? 'var(--nc-primary)' : 'var(--nc-border)'}`,
          }}
        />
        {/* Thumb */}
        <div
          className="absolute rounded-full bg-white shadow-sm transition-transform duration-150"
          style={{
            width: thumbSize,
            height: thumbSize,
            top: thumbOffset,
            left: thumbOffset,
            transform: checked ? `translateX(${translateX}px)` : 'translateX(0)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
        />
      </div>

      {label && (
        <span
          className="text-[14px] font-[500] leading-snug"
          style={{ color: 'var(--nc-text-secondary)' }}
        >
          {label}
        </span>
      )}
    </label>
  )
}

export default Switch
