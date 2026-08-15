import React from 'react'
import Modal from '../ui/Modal'

/**
 * AiContextViewer Component
 *
 * Shows the exact files, dependencies, structured memory, and prompt tokens
 * sent to the AI model.
 */
export function AiContextViewer({
    isOpen,
    onClose,
    memory,
    fileTree,
}) {
    if (!memory) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="AI Memory & Context Inspector"
            subtitle="Transparent view of structured project memory sent to NeuraChat AI"
            size="lg"
        >
            <div className="space-y-4 font-sans text-xs">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Framework</span>
                        <span className="text-sm font-extrabold text-sky-400">{memory.framework}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Files</span>
                        <span className="text-sm font-extrabold text-emerald-400">{memory.totalFiles}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Dependencies</span>
                        <span className="text-sm font-extrabold text-amber-400">{memory.dependencies.length}</span>
                    </div>
                </div>

                {/* Key Components */}
                <div className="space-y-1.5">
                    <h5 className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">Detected Components</h5>
                    <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 max-h-28 overflow-y-auto">
                        {memory.components.length === 0 ? (
                            <span className="text-slate-500 text-[11px]">No custom components detected yet</span>
                        ) : (
                            memory.components.map((comp, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800 font-mono text-[10.5px]">
                                    {comp}
                                </span>
                            ))
                        )}
                    </div>
                </div>

                {/* Installed Packages */}
                <div className="space-y-1.5">
                    <h5 className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">Packages & Dependencies</h5>
                    <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 max-h-28 overflow-y-auto">
                        {memory.dependencies.length === 0 ? (
                            <span className="text-slate-500 text-[11px]">No external packages installed</span>
                        ) : (
                            memory.dependencies.map((pkg, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-mono text-[10.5px]">
                                    {pkg}
                                </span>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    )
}
