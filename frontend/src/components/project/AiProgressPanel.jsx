import React, { memo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export const DEFAULT_AGENT_STAGES = [
    { id: 'analysis', label: 'Requirement Analysis', icon: 'ri-brain-line' },
    { id: 'architecture', label: 'Architecture Planning', icon: 'ri-ruler-2-line' },
    { id: 'framework', label: 'Framework Selection', icon: 'ri-stack-line' },
    { id: 'structure', label: 'Structure Planning', icon: 'ri-folder-zip-line' },
    { id: 'generation', label: 'Writing Code Files', icon: 'ri-code-s-slash-line' },
    { id: 'dependencies', label: 'Validating Dependencies', icon: 'ri-box-3-line' },
    { id: 'execution', label: 'Runtime Sandbox Execution', icon: 'ri-play-line' },
    { id: 'validation', label: 'Testing & Error Detection', icon: 'ri-shield-check-line' },
    { id: 'ready', label: 'Preview Ready', icon: 'ri-checkbox-circle-fill' },
]

/**
 * AiProgressPanel
 *
 * Visual multi-stage progress component for the AI Agent pipeline.
 * Displays step-by-step progress, active file writing counter, elapsed timer, & cancel button.
 */
export const AiProgressPanel = memo(function AiProgressPanel({
    currentStageId = 'analysis',
    fileProgress = { current: 0, total: 0 },
    onCancel,
}) {
    const [elapsedSeconds, setElapsedSeconds] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => setElapsedSeconds(s => s + 1), 1000)
        return () => clearInterval(timer)
    }, [])

    const activeIndex = DEFAULT_AGENT_STAGES.findIndex(s => s.id === currentStageId)

    return (
        <div className="p-4 rounded-xl border bg-[#08080d] border-slate-800 text-slate-200 shadow-2xl space-y-4 my-3 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                        <i className="ri-robot-2-fill text-base animate-pulse" />
                    </div>
                    <div>
                        <h4 className="font-bold text-xs text-slate-100 uppercase tracking-wider">NeuraChat AI Engineering Agent</h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                            Orchestrating • Elapsed: {elapsedSeconds}s
                        </p>
                    </div>
                </div>

                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800 transition-colors flex items-center gap-1"
                    >
                        <i className="ri-close-circle-line" />
                        Cancel
                    </button>
                )}
            </div>

            {/* Stages List */}
            <div className="space-y-2">
                {DEFAULT_AGENT_STAGES.map((stage, idx) => {
                    const isDone = idx < activeIndex
                    const isCurrent = idx === activeIndex
                    const isPending = idx > activeIndex

                    let statusBadge = null
                    if (isDone) {
                        statusBadge = <span className="text-emerald-400 text-xs flex items-center gap-1 font-semibold"><i className="ri-check-line" /> Done</span>
                    } else if (isCurrent) {
                        statusBadge = (
                            <span className="text-sky-400 text-xs flex items-center gap-1 font-semibold">
                                <i className="ri-loader-4-line nc-spin" />
                                {stage.id === 'generation' && fileProgress.total > 0
                                    ? `Writing (${fileProgress.current}/${fileProgress.total})`
                                    : 'Processing...'}
                            </span>
                        )
                    } else {
                        statusBadge = <span className="text-slate-600 text-[11px]">Pending</span>
                    }

                    return (
                        <div
                            key={stage.id}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-xs ${
                                isCurrent
                                    ? 'bg-sky-950/40 border-sky-500/40 text-sky-200'
                                    : isDone
                                    ? 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                                    : 'bg-slate-950/30 border-transparent text-slate-600'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <i className={`${stage.icon} text-sm ${isCurrent ? 'text-sky-400' : isDone ? 'text-emerald-400' : 'text-slate-600'}`} />
                                <span className="font-medium">{stage.label}</span>
                            </div>
                            {statusBadge}
                        </div>
                    )
                })}
            </div>
        </div>
    )
})
