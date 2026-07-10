import React from 'react'
import { motion } from 'framer-motion'
import Button from './Button'

/**
 * EmptyState — shown when a list/section has no data
 */
const EmptyState = ({
  icon = 'ri-inbox-line',
  title = 'Nothing here yet',
  description,
  primaryAction,     // { label, onClick, icon }
  secondaryAction,   // { label, onClick }
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`nc-empty-state ${className}`}
    >
      {/* Icon */}
      <div className="nc-empty-icon">
        <i className={`${icon} text-[32px]`} />
      </div>

      {/* Text */}
      <div className="space-y-2 max-w-xs">
        <p className="nc-heading-xs" style={{ color: 'var(--nc-text-primary)' }}>{title}</p>
        {description && (
          <p className="nc-body-sm text-center" style={{ color: 'var(--nc-text-secondary)' }}>
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3 mt-2">
          {primaryAction && (
            <Button
              variant="primary"
              onClick={primaryAction.onClick}
              icon={primaryAction.icon ? <i className={primaryAction.icon} /> : null}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default EmptyState
