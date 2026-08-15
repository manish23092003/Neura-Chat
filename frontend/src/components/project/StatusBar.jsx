import React, { memo } from 'react'

/**
 * StatusBar Component
 * Minimal dark neutral status bar matching VS Code / Cursor IDE.
 */
export const StatusBar = memo(function StatusBar({
    activeLanguage = 'JavaScript',
    activeWorkspaceName = 'Main Workspace',
    runtimeStatus = 'Idle',
    isRunning = false,
    aiDockPosition = 'right',
    onToggleAiDock,
    onToggleWorkspaceSidebar,
    onRunProject,
    onOpenCommandPalette,
    memoryUsage = '42 MB',
}) {
    return (
        <footer className="h-6 w-full shrink-0 flex items-center justify-between px-3 text-[11px] font-mono bg-[#0A0A0B] border-t border-[#24262A] text-[#A1A4AC] select-none z-40">
            {/* Left status controls */}
            <div className="flex items-center gap-3">
                {/* Workspace indicator */}
                <button
                    onClick={onToggleWorkspaceSidebar}
                    className="hover:text-[#E8E8EA] flex items-center gap-1.5 transition-colors font-medium text-[#E8E8EA]"
                    title="Click to manage workspaces"
                >
                    <i className="ri-layout-grid-line text-[#3B82F6] text-xs" />
                    <span>{activeWorkspaceName}</span>
                </button>

                <div className="w-px h-3 bg-[#24262A]" />

                {/* Lifo Runtime status */}
                <button
                    onClick={onRunProject}
                    className="hover:text-[#E8E8EA] flex items-center gap-1.5 transition-colors"
                    title="Click to run/restart Lifo sandbox"
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-[#22C55E] animate-pulse' : 'bg-[#6B6F78]'}`} />
                    <span className={isRunning ? 'text-[#22C55E] font-medium' : 'text-[#6B6F78]'}>
                        {isRunning ? `Running (${runtimeStatus})` : 'Sandbox Idle'}
                    </span>
                </button>

                <div className="w-px h-3 bg-[#24262A]" />

                {/* Command palette trigger */}
                <button
                    onClick={onOpenCommandPalette}
                    className="hover:text-[#E8E8EA] hidden sm:flex items-center gap-1 text-[10px] text-[#A1A4AC] bg-[#101113] px-1.5 py-0.2 rounded border border-[#24262A]"
                    title="Command Palette (Ctrl+Shift+P)"
                >
                    <i className="ri-command-line text-[#3B82F6]" />
                    <span>⌘ Cmd + Shift + P</span>
                </button>
            </div>

            {/* Right status controls */}
            <div className="flex items-center gap-3">
                <span className="text-[#6B6F78]">{memoryUsage}</span>

                <span className="text-[#6B6F78] hover:text-[#E8E8EA] cursor-pointer" title="Tab Size">
                    Spaces: 4
                </span>

                <span className="text-[#6B6F78] hover:text-[#E8E8EA] cursor-pointer hidden md:inline" title="File Encoding">
                    UTF-8
                </span>

                <span className="text-[#3B82F6] font-medium cursor-pointer flex items-center gap-1" title="Active Language">
                    <i className="ri-code-line text-xs" />
                    {activeLanguage}
                </span>

                <button
                    onClick={onToggleAiDock}
                    className="hover:text-white flex items-center gap-1 text-[#A1A4AC] bg-[#15171A] px-2 py-0.2 rounded text-[10.5px] border border-[#24262A] transition-colors"
                    title="Toggle AI Dock Position"
                >
                    <i className="ri-robot-line text-[#3B82F6]" />
                    <span className="capitalize">{aiDockPosition} Dock</span>
                </button>
            </div>
        </footer>
    )
})

export default StatusBar
