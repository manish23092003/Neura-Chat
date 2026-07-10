import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Dropdown — floating menu attached to trigger
 * placement: bottom-right | bottom-left | top-right | top-left
 */
const Dropdown = ({
  trigger,
  items = [],
  placement = 'bottom-right',
  className = '',
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) close()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [close])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [close])

  const placementStyle = {
    'bottom-right': { top: 'calc(100% + 8px)', right: 0 },
    'bottom-left':  { top: 'calc(100% + 8px)', left: 0 },
    'top-right':    { bottom: 'calc(100% + 8px)', right: 0 },
    'top-left':     { bottom: 'calc(100% + 8px)', left: 0 },
  }[placement] || { top: 'calc(100% + 8px)', right: 0 }

  return (
    <div className={`relative inline-flex ${className}`} ref={ref}>
      <div onClick={() => setOpen(v => !v)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: placement.startsWith('top') ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: placement.startsWith('top') ? 4 : -4 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="nc-dropdown"
            style={{ position: 'absolute', ...placementStyle, zIndex: 100 }}
          >
            <div className="p-1.5">
              {items.map((item, i) => {
                if (item.divider) {
                  return <div key={i} className="nc-divider my-1.5 mx-1" />
                }
                return (
                  <button
                    key={i}
                    className={`nc-dropdown-item w-full ${item.danger ? 'danger' : ''}`}
                    onClick={() => { item.onClick?.(); close() }}
                    disabled={item.disabled}
                  >
                    {item.icon && (
                      <span className="text-[16px] flex-shrink-0" style={{ color: item.danger ? 'var(--nc-danger)' : 'var(--nc-text-secondary)' }}>
                        {item.icon}
                      </span>
                    )}
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="nc-badge nc-badge-muted text-[11px] px-2 py-0.5">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Dropdown
