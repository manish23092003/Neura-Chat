import React, { memo } from 'react'

/**
 * ActivityPanel Component
 *
 * Visual activity feed tracking human edits, AI changes, presence events, and runtime status.
 */
export const ActivityPanel = memo(function ActivityPanel({
    activities = [],
    onClose,
}) {
    const sampleActivities = activities.length > 0 ? activities : [
        { id: 1, type: 'file_edit', user: 'System', text: 'Workspace initialized', time: 'Just now', icon: 'ri-checkbox-circle-line', color: 'text-emerald-400' },
        { id: 2, type: 'ai_edit', user: '🤖 NeuraChat AI', text: 'Extracted project architecture', time: '1m ago', icon: 'ri-robot-2-line', color: 'text-sky-400' },
    ]

    return (
        <div className="w-80 flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-200 font-sans text-xs shrink-0 z-30 shadow-2xl">
            {/* Header */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <i className="ri-history-line text-sky-400 text-sm" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-100">Workspace Activity Feed</h4>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <i className="ri-close-line text-base" />
                    </button>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {sampleActivities.map((act) => (
                    <div key={act.id} className="p-2.5 rounded-xl border bg-slate-950/60 border-slate-800/80 flex items-start gap-2.5 hover:border-slate-700 transition-all">
                        <i className={`${act.icon || 'ri-file-text-line'} text-sm mt-0.5 ${act.color || 'text-slate-400'}`} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-slate-200 text-[11px] truncate">{act.user}</span>
                                <span className="text-[9.5px] font-mono text-slate-500">{act.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 break-words font-mono">{act.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
})
