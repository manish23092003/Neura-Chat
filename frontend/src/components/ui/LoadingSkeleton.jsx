import React from 'react'

/**
 * LoadingSkeleton — animated placeholder for loading states
 */
const LoadingSkeleton = ({
  className = '',
  width,
  height = 20,
  rounded = 'lg',
  count = 1,
  gap = 8,
}) => {
  const borderRadius = { sm: 4, md: 6, lg: 8, xl: 12, full: 999 }[rounded] ?? 8

  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className="nc-skeleton"
      style={{
        width: width || '100%',
        height,
        borderRadius,
      }}
    />
  ))

  if (count === 1) return items[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {items}
    </div>
  )
}

/** Pre-built skeleton layouts */
export const CardSkeleton = () => (
  <div className="nc-card" style={{ padding: 24 }}>
    <div className="flex items-start gap-3 mb-4">
      <div className="nc-skeleton" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
      <div className="flex-1 space-y-2">
        <div className="nc-skeleton" style={{ height: 16, width: '60%', borderRadius: 6 }} />
        <div className="nc-skeleton" style={{ height: 12, width: '40%', borderRadius: 6 }} />
      </div>
    </div>
    <div className="space-y-2">
      <div className="nc-skeleton" style={{ height: 12, width: '100%', borderRadius: 6 }} />
      <div className="nc-skeleton" style={{ height: 12, width: '80%', borderRadius: 6 }} />
    </div>
    <div className="nc-skeleton mt-4" style={{ height: 4, borderRadius: 999 }} />
  </div>
)

export const TableRowSkeleton = ({ cols = 4 }) => (
  <div className="flex items-center gap-4 py-3 px-4">
    {Array.from({ length: cols }, (_, i) => (
      <div key={i} className="nc-skeleton flex-1" style={{ height: 14, borderRadius: 6 }} />
    ))}
  </div>
)

export const AvatarSkeleton = ({ size = 36 }) => (
  <div className="nc-skeleton" style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0 }} />
)

export default LoadingSkeleton
