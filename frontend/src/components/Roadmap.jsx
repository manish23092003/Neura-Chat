import React, { useState } from 'react'
import { motion } from 'framer-motion'

const DEFAULT_ROADMAP_GROUPS = [
    {
        id: 'foundation',
        name: 'Foundation & Core IDE',
        progress: 85,
        items: [
            { id: 'f1', title: 'Multi-workspace file isolation', status: 'completed' },
            { id: 'f2', title: 'IndexedDB + MongoDB dual sync', status: 'completed' },
            { id: 'f3', title: 'Monaco Editor & File Tree tree-view', status: 'completed' },
            { id: 'f4', title: 'Command Palette & Keyboard shortcuts', status: 'in_progress' },
        ],
    },
    {
        id: 'auth',
        name: 'Authentication & Security',
        progress: 100,
        items: [
            { id: 'a1', title: 'Google OAuth 2.0 Sign-In', status: 'completed' },
            { id: 'a2', title: 'JWT Token Session Management', status: 'completed' },
            { id: 'a3', title: 'Project Invite Links & Collaborators', status: 'completed' },
        ],
    },
    {
        id: 'ai_agent',
        name: 'AI Agent & Code Generation',
        progress: 70,
        items: [
            { id: 'ai1', title: 'Gemini 2.5 Flash API Integration', status: 'completed' },
            { id: 'ai2', title: 'Workspace FileTree Context Injection', status: 'completed' },
            { id: 'ai3', title: 'Multi-file Auto Code Generation', status: 'in_progress' },
            { id: 'ai4', title: '1-Click Auto Debugging', status: 'todo' },
        ],
    },
    {
        id: 'runtime',
        name: 'Lifo Sandbox & Live Preview',
        progress: 60,
        items: [
            { id: 'r1', title: 'In-browser HTML/JS Execution', status: 'completed' },
            { id: 'r2', title: 'Real-time Console Log Mirroring', status: 'in_progress' },
            { id: 'r3', title: 'Hot Module Reloading (HMR)', status: 'todo' },
        ],
    },
]

export function Roadmap({ tasks = [] }) {
    const [selectedPeriod, setSelectedPeriod] = useState('Aug 2026')

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#0A0A0B] text-[#E8E8EA] font-sans select-none">
            {/* Header */}
            <div className="p-4 border-b border-[#24262A] shrink-0 bg-[#101113]">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <i className="ri-map-2-line text-[#3B82F6] text-base" />
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-[#E8E8EA]">Engineering Roadmap</h2>
                            <p className="text-[11px] text-[#6B6F78]">Milestones & Sprint Progress</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#15171A] border border-[#24262A] text-[#A1A4AC]">
                        {selectedPeriod}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Engineering Sprint Timeline */}
                <div className="p-3.5 rounded-lg bg-[#101113] border border-[#24262A] space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#6B6F78] uppercase tracking-wider border-b border-[#24262A] pb-2">
                        <span>Sprint Milestone</span>
                        <div className="flex gap-4">
                            <span>AUG 18</span>
                            <span>AUG 20</span>
                            <span>AUG 22</span>
                            <span>AUG 24</span>
                        </div>
                    </div>

                    <div className="space-y-2.5 font-mono text-[11px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[#E8E8EA] font-medium w-28 truncate">Authentication</span>
                            <div className="flex-1 bg-[#15171A] h-2 rounded overflow-hidden relative mx-2 border border-[#24262A]">
                                <div className="absolute left-0 top-0 bottom-0 w-3/4 bg-[#3B82F6] rounded" />
                            </div>
                            <span className="text-[10px] text-[#22C55E]">100%</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-[#E8E8EA] font-medium w-28 truncate">AI Code Agent</span>
                            <div className="flex-1 bg-[#15171A] h-2 rounded overflow-hidden relative mx-2 border border-[#24262A]">
                                <div className="absolute left-1/4 top-0 bottom-0 w-1/2 bg-[#3B82F6] rounded" />
                            </div>
                            <span className="text-[10px] text-[#3B82F6]">70%</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-[#E8E8EA] font-medium w-28 truncate">Lifo Runtime</span>
                            <div className="flex-1 bg-[#15171A] h-2 rounded overflow-hidden relative mx-2 border border-[#24262A]">
                                <div className="absolute left-2/4 top-0 bottom-0 w-1/3 bg-[#3B82F6] rounded" />
                            </div>
                            <span className="text-[10px] text-[#F59E0B]">60%</span>
                        </div>
                    </div>
                </div>

                {/* Milestone Groups */}
                <div className="space-y-4">
                    {DEFAULT_ROADMAP_GROUPS.map((group) => (
                        <div key={group.id} className="p-3.5 rounded-lg bg-[#101113] border border-[#24262A] space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#E8E8EA]">{group.name}</span>
                                <span className="text-[11px] font-mono font-semibold text-[#3B82F6]">{group.progress}%</span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-1.5 rounded bg-[#15171A] overflow-hidden border border-[#24262A]">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${group.progress}%` }}
                                    transition={{ duration: 0.5 }}
                                    className="h-full bg-[#3B82F6] rounded"
                                />
                            </div>

                            {/* Items */}
                            <div className="space-y-1.5 pt-1">
                                {group.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-[#15171A] transition-colors">
                                        <div className="flex items-center gap-2">
                                            {item.status === 'completed' && <i className="ri-checkbox-circle-fill text-[#22C55E] text-xs" />}
                                            {item.status === 'in_progress' && <i className="ri-arrow-right-circle-line text-[#3B82F6] text-xs" />}
                                            {item.status === 'todo' && <i className="ri-checkbox-blank-circle-line text-[#6B6F78] text-xs" />}
                                            <span className={item.status === 'completed' ? 'line-through text-[#6B6F78]' : 'text-[#E8E8EA]'}>
                                                {item.title}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-mono text-[#6B6F78] uppercase">
                                            {item.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Roadmap
