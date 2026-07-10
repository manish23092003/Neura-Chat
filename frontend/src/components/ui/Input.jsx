import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Input — ui/ version for consistent imports
 */
const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  error,
  helperText,
  icon,
  className = '',
  required = false,
  disabled = false,
  success = false,
  loading = false,
  validation,
  onSuggestionClick,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  const borderClass = error
    ? 'nc-input-error'
    : success
      ? 'nc-input-success'
      : ''

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="nc-label">
          {label}
          {required && <span className="text-[var(--nc-danger)] ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none z-10" style={{ color: 'var(--nc-text-muted)' }}>
            {icon}
          </span>
        )}

        <input
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={[
            'nc-input',
            icon ? 'nc-input-icon-left' : '',
            (isPassword || success || loading) ? 'nc-input-icon-right' : '',
            borderClass,
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].filter(Boolean).join(' ')}
          {...props}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <AnimatePresence>
            {success && !loading && !isPassword && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
                className="text-[18px]" style={{ color: 'var(--nc-success)' }}
              >
                <i className="ri-checkbox-circle-fill" />
              </motion.span>
            )}
          </AnimatePresence>

          {loading && (
            <span className="text-[16px]" style={{ color: 'var(--nc-primary)' }}>
              <i className="ri-loader-4-line nc-spin" />
            </span>
          )}

          {isPassword && !loading && (
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="p-1 transition-colors"
              style={{ color: 'var(--nc-text-muted)' }}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <i className={`ri-eye${showPassword ? '-off' : ''}-line text-[16px]`} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {validation?.suggestion && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="mt-2 flex items-center gap-2 text-[13px]" style={{ color: 'var(--nc-text-secondary)' }}
          >
            <i className="ri-information-line" style={{ color: 'var(--nc-primary)' }} />
            Did you mean{' '}
            <button type="button" onClick={() => onSuggestionClick?.(validation.suggestion)}
              className="font-[600] underline underline-offset-2" style={{ color: 'var(--nc-primary)' }}>
              {validation.suggestion}
            </button>?
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--nc-danger)' }}
          >
            <i className="ri-error-warning-line" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {helperText && !error && (
        <p className="mt-2 text-[13px]" style={{ color: 'var(--nc-text-muted)' }}>{helperText}</p>
      )}
    </div>
  )
}

export default Input
