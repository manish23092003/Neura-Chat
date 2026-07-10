import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from './Button'

/**
 * Modal — ui/ version
 * Sizes: sm | md | lg | xl
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showCloseButton = true,
  footer,
}) => {
  const maxWidth = { sm: 400, md: 520, lg: 680, xl: 860 }[size] || 520

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && isOpen) onClose?.() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="nc-modal relative"
            style={{ maxWidth, width: '100%' }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between p-6 pb-0">
                <div className="flex-1 pr-4">
                  {title && <h2 className="nc-heading-xs text-white">{title}</h2>}
                  {subtitle && <p className="nc-body-sm mt-1" style={{ color: 'var(--nc-text-secondary)' }}>{subtitle}</p>}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="nc-btn-icon flex-shrink-0"
                    style={{ width: 36, height: 36 }}
                    aria-label="Close"
                  >
                    <i className="ri-close-line text-[18px]" />
                  </button>
                )}
              </div>
            )}

            <div className="p-6">{children}</div>

            {footer && (
              <div className="px-6 pb-6 pt-0 flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default Modal
