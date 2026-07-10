import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * Tooltip — on hover/focus label
 * placement: top | bottom | left | right
 */
const Tooltip = ({
  children,
  content,
  placement = 'top',
  delay = 300,
  className = '',
}) => {
  const [visible, setVisible] = useState(false)
  const [timeoutId, setTimeoutId] = useState(null)

  const show = () => {
    const id = setTimeout(() => setVisible(true), delay)
    setTimeoutId(id)
  }

  const hide = () => {
    clearTimeout(timeoutId)
    setVisible(false)
  }

  const positionStyle = {
    top:    { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' },
    bottom: { top: 'calc(100% + 8px)',    left: '50%', transform: 'translateX(-50%)' },
    left:   { right: 'calc(100% + 8px)', top: '50%',  transform: 'translateY(-50%)' },
    right:  { left: 'calc(100% + 8px)',  top: '50%',  transform: 'translateY(-50%)' },
  }[placement]

  if (!content) return children

  return (
    <div
      className={`nc-tooltip-wrap ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12 }}
            className="nc-tooltip"
            style={positionStyle}
            role="tooltip"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Tooltip
