import React from 'react'

/**
 * Avatar — shows initials or image with optional status dot
 * sizes: xs(24) | sm(28) | md(36) | lg(48) | xl(64) | 2xl(80)
 * shape: circle | square
 */
const sizeMap = {
  xs:  { dim: 24, font: 10, radius: 6 },
  sm:  { dim: 28, font: 11, radius: 8 },
  md:  { dim: 36, font: 13, radius: 10 },
  lg:  { dim: 48, font: 16, radius: 12 },
  xl:  { dim: 64, font: 22, radius: 14 },
  '2xl': { dim: 80, font: 28, radius: 16 },
}

const colorPalette = [
  ['#7C5CFF', '#5B3FD9'],
  ['#2563EB', '#1D4ED8'],
  ['#059669', '#047857'],
  ['#DC2626', '#B91C1C'],
  ['#D97706', '#B45309'],
  ['#7C3AED', '#6D28D9'],
  ['#0891B2', '#0E7490'],
  ['#DB2777', '#BE185D'],
]

function getColorFromEmail(email = '') {
  let hash = 0
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash)
  return colorPalette[Math.abs(hash) % colorPalette.length]
}

const Avatar = ({
  email,
  name,
  src,
  size = 'md',
  shape = 'circle',
  status,     // 'online' | 'away' | 'offline'
  className = '',
  title,
}) => {
  const { dim, font, radius } = sizeMap[size] || sizeMap.md
  const [c1, c2] = getColorFromEmail(email || name)
  const initials = (name || email || 'U').charAt(0).toUpperCase()
  const borderRadius = shape === 'square' ? radius : '50%'

  const statusColor = { online: '#22C55E', away: '#F59E0B', offline: '#64748b' }[status]

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: dim, height: dim }}>
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          width: dim, height: dim,
          borderRadius,
          background: src ? 'transparent' : `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
          fontSize: font,
          fontWeight: 700,
          color: '#fff',
          userSelect: 'none',
        }}
        title={title || name || email}
      >
        {src ? (
          <img src={src} alt={name || email || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius }} />
        ) : initials}
      </div>

      {/* Status dot */}
      {status && (
        <span
          className="absolute bottom-0 right-0 block rounded-full"
          style={{
            width: Math.max(8, dim * 0.22),
            height: Math.max(8, dim * 0.22),
            background: statusColor,
            border: '2px solid var(--nc-surface)',
          }}
        />
      )}
    </div>
  )
}

export default Avatar
