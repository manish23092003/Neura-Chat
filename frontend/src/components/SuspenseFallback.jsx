import React from 'react'

const SuspenseFallback = () => {
  return (
    <div
      className="h-screen w-screen flex items-center justify-center"
      style={{ background: 'var(--nc-bg)' }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Animated logo mark */}
        <div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center"
          style={{
            background: 'var(--nc-primary-muted)',
            border: '1px solid var(--nc-primary-border)',
            animation: 'nc-pulse 1.5s ease-in-out infinite',
          }}
        >
          <i className="ri-robot-2-fill text-[22px]" style={{ color: 'var(--nc-primary)' }} />
        </div>
        {/* Skeleton bars */}
        <div className="flex flex-col items-center gap-2 w-48">
          <div
            className="h-2 w-full rounded-full"
            style={{
              background: 'var(--nc-elevated)',
              animation: 'nc-shimmer 1.5s ease-in-out infinite',
            }}
          />
          <div
            className="h-2 w-3/4 rounded-full"
            style={{
              background: 'var(--nc-elevated)',
              animation: 'nc-shimmer 1.5s ease-in-out 0.2s infinite',
            }}
          />
          <div
            className="h-2 w-1/2 rounded-full"
            style={{
              background: 'var(--nc-elevated)',
              animation: 'nc-shimmer 1.5s ease-in-out 0.4s infinite',
            }}
          />
        </div>
        <p className="text-[12px] font-[600]" style={{ color: 'var(--nc-text-muted)' }}>
          Loading…
        </p>
      </div>
    </div>
  )
}

export default SuspenseFallback
