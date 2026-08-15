import React, { memo, useState } from 'react'

/**
 * PresenceBadge Component
 *
 * Renders real-time presence indicators for active workspace collaborators and NeuraChat AI.
 * Clicking toggles a dropdown showing all collaborators and their assigned roles.
 */
export const PresenceBadge = memo(function PresenceBadge({
    activeUsers = [],
    isAiThinking = false,
    roles = {},
}) {
    const [isOpen, setIsOpen] = useState(false)
    const defaultUsers = activeUsers.length > 0 ? activeUsers : [{ _id: 'me', email: 'You', color: '#38bdf8' }]

    return (
        <div className="relative font-sans">
            {/* Clickable Badge Trigger */}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center gap-1.5 text-xs hover:opacity-90 transition-opacity cursor-pointer focus:outline-none bg-transparent border-0 p-0"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <div className="flex items-center -space-x-1.5 overflow-hidden">
                    {defaultUsers.map((u, idx) => (
                        <div
                            key={u._id || idx}
                            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white border-2 border-[var(--nc-border)] shadow-sm uppercase transition-transform hover:scale-110"
                            style={{ background: u.color || '#0284c7' }}
                            title={`${u.email || u.name} (Active)`}
                        >
                            {(u.email || u.name || 'U').charAt(0)}
                        </div>
                    ))}

                    {/* AI Collaborator Badge */}
                    <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-sky-200 border-2 border-[var(--nc-border)] bg-sky-950 shadow-sm ${isAiThinking ? 'animate-pulse ring-2 ring-sky-500' : ''}`}
                        title="🤖 NeuraChat AI"
                    >
                        <i className="ri-robot-2-fill text-sky-400" />
                    </div>
                </div>

                <span className="text-[11px] font-mono text-[var(--nc-text-secondary)] hidden md:inline ml-1.5">
                    {defaultUsers.length + 1} Collaborators
                </span>
                <i className={`ri-arrow-down-s-line text-[var(--nc-text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Click-away backdrop overlay */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setIsOpen(false)}
                    />
                    {/* Collaborators Dropdown Popover */}
                    <div
                        className="absolute right-0 mt-2 w-64 rounded-xl border border-[var(--nc-border)] bg-[var(--nc-surface)] shadow-lg z-50 p-3 font-sans text-left"
                        style={{
                            boxShadow: 'var(--shadow-modal)',
                        }}
                    >
                        <h3 className="text-[12px] font-bold text-[var(--nc-text-primary)] mb-2 px-1">
                            Workspace Members
                        </h3>
                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
                            {/* NeuraChat AI */}
                            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[var(--nc-elevated)]">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-sky-950 text-sky-200 border border-[var(--nc-border)]">
                                    <i className="ri-robot-2-fill text-sky-400 text-sm" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-semibold text-[var(--nc-text-primary)] truncate">NeuraChat AI</p>
                                    <p className="text-[10px] text-[var(--nc-text-muted)]">Assistant</p>
                                </div>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            </div>

                            {/* Human Collaborators */}
                            {defaultUsers.map((pu, idx) => {
                                const role = roles[pu._id] || (idx === 0 ? 'Admin' : 'Member')
                                return (
                                    <div key={pu._id || idx} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[var(--nc-elevated)] transition-colors">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white border border-[var(--nc-border)] uppercase"
                                            style={{ background: pu.color || '#0284c7' }}
                                        >
                                            {(pu.email || 'U').charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-semibold text-[var(--nc-text-primary)] truncate" title={pu.email}>
                                                {pu.email}
                                            </p>
                                            <p className="text-[10px] text-[var(--nc-text-muted)]">{role}</p>
                                        </div>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
})
