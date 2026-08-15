import React, { memo } from 'react'

/**
 * ProjectSummaryCard
 *
 * Rendered after AI finishes project generation.
 * Displays key details: Framework, Entry point, Dependencies, File counts, Status, & Run button.
 */
export const ProjectSummaryCard = memo(function ProjectSummaryCard({ summary, onRun }) {
    if (!summary) return null

    const {
        name = 'AI Generated Project',
        framework = 'React + Vite',
        styling = 'Tailwind CSS',
        packageManager = 'npm',
        entryPoint = 'src/main.jsx',
        startCommand = 'npm run dev',
        dependencies = [],
        totalFiles = 0,
        totalFolders = 0,
        status = 'Ready to Run',
        createdAt = new Date().toISOString(),
    } = summary

    return (
        <div className="p-4 rounded-xl border my-3 space-y-3 font-sans text-xs bg-slate-900 border-slate-800 text-slate-200 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                        <i className="ri-checkbox-circle-fill text-sm" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-slate-100">{name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">Created: {new Date(createdAt).toLocaleTimeString()}</p>
                    </div>
                </div>
                <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900">
                    {status}
                </span>
            </div>

            {/* Grid Metrics */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-500 uppercase font-bold text-[9px] block">Framework</span>
                    <span className="font-medium text-slate-200">{framework}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-500 uppercase font-bold text-[9px] block">Styling</span>
                    <span className="font-medium text-slate-200">{styling}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-500 uppercase font-bold text-[9px] block">Entry Point</span>
                    <span className="font-mono text-sky-400">{entryPoint}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-500 uppercase font-bold text-[9px] block">Start Command</span>
                    <span className="font-mono text-amber-400">{startCommand}</span>
                </div>
            </div>

            {/* Dependencies */}
            {dependencies.length > 0 && (
                <div>
                    <span className="text-slate-500 uppercase font-bold text-[9px] block mb-1">Key Dependencies</span>
                    <div className="flex flex-wrap gap-1">
                        {dependencies.slice(0, 8).map((dep, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                                {dep}
                            </span>
                        ))}
                        {dependencies.length > 8 && (
                            <span className="text-[10px] text-slate-500 self-center">+{dependencies.length - 8} more</span>
                        )}
                    </div>
                </div>
            )}

            {/* Footer / Run CTA */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                <span className="text-slate-400">
                    📊 {totalFiles} Files, {totalFolders} Folders ({packageManager})
                </span>
                {onRun && (
                    <button
                        onClick={onRun}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow hover:scale-105 flex items-center gap-1.5"
                    >
                        <i className="ri-play-fill text-sm" />
                        Run Sandbox Application
                    </button>
                )}
            </div>
        </div>
    )
})
