import React, { memo } from 'react'

/**
 * NeuraLogo
 *
 * Professional brand emblem for NeuraChat.
 * Seamlessly integrates a neural synapse node with coding brackets and quantum chat geometry.
 *
 * @param {'sm' | 'md' | 'lg' | 'xl' | number} size - Dimensions
 * @param {boolean} showText - Whether to render the 'NeuraChat' wordmark alongside icon
 * @param {string} className - Optional container styling
 */
export const NeuraLogo = memo(function NeuraLogo({
    size = 'md',
    showText = false,
    className = '',
    animated = false,
}) {
    const dimension = typeof size === 'number'
        ? size
        : size === 'sm' ? 24
        : size === 'md' ? 32
        : size === 'lg' ? 44
        : 64

    return (
        <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
            <svg
                width={dimension}
                height={dimension}
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`shrink-0 ${animated ? 'transition-transform duration-300 hover:scale-105' : ''}`}
            >
                <defs>
                    {/* Brand Primary Linear Gradient */}
                    <linearGradient id="neura-grad-primary" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#38BDF8" />   {/* Electric Sky */}
                        <stop offset="50%" stopColor="#3B82F6" />  {/* Cobalt Blue */}
                        <stop offset="100%" stopColor="#8B5CF6" /> {/* Cyber Violet */}
                    </linearGradient>

                    {/* Quantum Glow Accent */}
                    <linearGradient id="neura-grad-accent" x1="12" y1="10" x2="36" y2="38" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#C084FC" stopOpacity="0.8" />
                    </linearGradient>

                    {/* Container Surface Bevel */}
                    <linearGradient id="neura-surface" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#1E2028" />
                        <stop offset="100%" stopColor="#0B0C10" />
                    </linearGradient>

                    {/* Filter for subtle neon bloom */}
                    <filter id="neura-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Squircle Badge Background */}
                <rect
                    x="2"
                    y="2"
                    width="44"
                    height="44"
                    rx="12"
                    fill="url(#neura-surface)"
                    stroke="url(#neura-grad-primary)"
                    strokeWidth="1.2"
                    strokeOpacity="0.4"
                />

                {/* Left Code Bracket Node < */}
                <path
                    d="M16 16L10 24L16 32"
                    stroke="url(#neura-grad-primary)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Right Code Bracket Node > */}
                <path
                    d="M32 16L38 24L32 32"
                    stroke="url(#neura-grad-primary)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Neural Synapse Central Core */}
                <g filter="url(#neura-glow)">
                    {/* Interconnecting Axon Paths */}
                    <path
                        d="M24 14V34M16 24H32M19 19L29 29M29 19L19 29"
                        stroke="url(#neura-grad-accent)"
                        strokeWidth="1.4"
                        strokeOpacity="0.7"
                        strokeDasharray="2 2"
                    />

                    {/* Central Nucleus Node */}
                    <circle cx="24" cy="24" r="3.5" fill="#38BDF8" />
                    <circle cx="24" cy="24" r="5" stroke="#60A5FA" strokeWidth="1" strokeOpacity="0.6" />

                    {/* Surrounding Synaptic Orbital Nodes */}
                    <circle cx="24" cy="14" r="2" fill="#818CF8" />
                    <circle cx="24" cy="34" r="2" fill="#A855F7" />
                    <circle cx="16" cy="24" r="2" fill="#38BDF8" />
                    <circle cx="32" cy="24" r="2" fill="#C084FC" />
                </g>
            </svg>

            {showText && (
                <div className="flex flex-col leading-none">
                    <span className="text-[16px] font-[700] tracking-tight text-[var(--nc-text-primary)]">
                        Neura<span className="text-[#3B82F6]">Chat</span>
                    </span>
                    <span className="text-[9px] font-mono tracking-widest text-[var(--nc-text-muted)] uppercase">
                        AI IDE
                    </span>
                </div>
            )}
        </div>
    )
})

export default NeuraLogo
