import React from 'react'

/**
 * Select — styled dropdown select input
 */
const Select = ({
  label,
  value,
  onChange,
  options = [],   // [{ value, label, disabled? }]
  placeholder,
  disabled = false,
  error,
  className = '',
  required = false,
  icon,
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="nc-label">
          {label}
          {required && <span className="ml-1" style={{ color: 'var(--nc-danger)' }}>*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none z-10"
            style={{ color: 'var(--nc-text-muted)' }}
          >
            {icon}
          </span>
        )}

        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={[
            'nc-input nc-select',
            icon ? 'nc-input-icon-left' : '',
            error ? 'nc-input-error' : '',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].filter(Boolean).join(' ')}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--nc-danger)' }}>
          <i className="ri-error-warning-line" />
          {error}
        </p>
      )}
    </div>
  )
}

export default Select
