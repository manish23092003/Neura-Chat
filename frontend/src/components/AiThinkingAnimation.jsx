import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Minimal Neural Orb for the avatar
function NeuralOrb() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 24, height: 24 }}>
      {/* Pulsing glow */}
      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.4, 0.15, 0.4],
        }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
        }}
      />
      {/* Core */}
      <div
        className="relative rounded-full flex items-center justify-center z-10"
        style={{
          width: 18,
          height: 18,
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)',
        }}
      >
        <i className="ri-sparkling-2-fill text-[9px] text-white" />
      </div>
    </div>
  )
}

export default function AiThinkingAnimation() {
  const phrases = useMemo(() => [
    'Thinking',
    'Analyzing codebase',
    'Mapping dependencies',
    'Generating response',
  ], [])

  const [phraseIndex, setPhraseIndex] = useState(0)

  // Rotate phrases
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(i => (i + 1) % phrases.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [phrases])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex items-start gap-2.5 pl-1 py-1"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        <NeuralOrb />
      </div>

      {/* Message Bubble */}
      <div className="max-w-[85%]">
        {/* Header Label */}
        <div className="flex items-center gap-1.5 mb-1 pl-0.5">
          <span
            className="text-[11px] font-[600]"
            style={{ color: 'var(--nc-text-secondary)' }}
          >
            NeuraChat AI
          </span>
          <span
            className="text-[9px] font-[700] uppercase tracking-wider px-1.5 py-0.5 rounded-full"
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              color: '#3B82F6',
              fontSize: 8,
            }}
          >
            thinking
          </span>
        </div>

        {/* Shimmering Bubble Body */}
        <div
          className="relative overflow-hidden px-4 py-2.5 rounded-[16px] rounded-tl-[4px] flex items-center gap-3"
          style={{
            background: 'var(--nc-elevated)',
            border: '1px solid var(--nc-border)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Shimmering gradient overlay */}
          <motion.div
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)',
            }}
          />

          {/* Bouncing Dots Indicator */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -4, 0]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut'
                }}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
                }}
              />
            ))}
          </div>

          {/* Rotating Status Phrase */}
          <div style={{ minWidth: 140 }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={phraseIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="text-[13px] font-[500]"
                style={{ color: 'var(--nc-text-secondary)' }}
              >
                {phrases[phraseIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
