import React from 'react'

/**
 * Checkbox — accessible styled checkbox
 */
const Checkbox = ({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  className = '',
}) => {
  const checkId = id || `checkbox-${Math.random().toString(36).slice(2)}`

  return (
    <label
      htmlFor={checkId}
      className={`flex items-start gap-3 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <input
        type="checkbox"
        id={checkId}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="nc-checkbox mt-0.5"
      />
      {label && (
        <span
          className="text-[14px] font-[500] leading-snug select-none"
          style={{ color: 'var(--nc-text-secondary)' }}
        >
          {label}
        </span>
      )}
    </label>
  )
}

export default Checkbox
