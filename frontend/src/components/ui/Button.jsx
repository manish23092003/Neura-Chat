import React from 'react'
import { motion } from 'framer-motion'

/**
 * Button — re-export from ui/ for consistent imports
 * All logic in src/components/Button.jsx
 */

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  iconRight = null,
  onClick,
  type = 'button',
  className = '',
  fullWidth = false,
  ...props
}) => {
  const variantClass = {
    primary:   'nc-btn-primary',
    secondary: 'nc-btn-secondary',
    ghost:     'nc-btn-ghost',
    danger:    'nc-btn-danger',
    outline:   'nc-btn-secondary',
  }[variant] || 'nc-btn-primary'

  const sizeClass = {
    xs: 'nc-btn-xs',
    sm: 'nc-btn-sm',
    md: '',
    lg: 'text-base px-6',
  }[size] || ''

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { y: -1 } : {}}
      whileTap={!disabled && !loading ? { y: 0, scale: 0.98 } : {}}
      transition={{ duration: 0.15 }}
      className={[
        'nc-btn',
        variantClass,
        sizeClass,
        fullWidth ? 'w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading ? (
        <>
          <i className="ri-loader-4-line nc-spin text-base" />
          <span>Loading…</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0 text-[16px]">{icon}</span>}
          {children}
          {iconRight && <span className="flex-shrink-0 text-[16px]">{iconRight}</span>}
        </>
      )}
    </motion.button>
  )
}

export default Button
