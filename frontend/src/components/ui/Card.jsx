import React from 'react'
import { motion } from 'framer-motion'

/**
 * Card — surface container with optional hover lift
 * variants: default | flat | outline
 */
const Card = ({
  children,
  className = '',
  hover = false,
  onClick,
  padding = true,
  as: Tag = 'div',
}) => {
  const base = `nc-card ${hover ? 'nc-card-hover cursor-pointer' : ''} ${padding ? '' : '!p-0'} ${className}`

  if (onClick || hover) {
    return (
      <motion.div
        className={base}
        onClick={onClick}
        whileHover={hover ? { y: -2 } : {}}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    )
  }

  return <Tag className={base}>{children}</Tag>
}

export default Card
