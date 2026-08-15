import React, { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PresenceBadge } from './PresenceBadge'

/**
 * ProjectHeader
 * Minimal top navigation bar matching professional IDE standards.
 */
const ProjectHeader = memo(function ProjectHeader({
    project,
    inviteCopied,
    isGeneratingInvite,
    onCopyInviteLink,
}) {
    const navigate = useNavigate()

    return (
        <header className="flex items-center justify-between px-4 shrink-0 h-12 bg-[#101113] border-b border-[#24262A] text-[#E8E8EA] select-none z-30">
            {/* Left Section: Back button + Project Name */}
            <div className="flex items-center gap-2.5">
                <button
                    onClick={() => navigate('/home')}
                    className="w-7 h-7 rounded flex items-center justify-center text-[#A1A4AC] hover:text-white hover:bg-[#1A1C20] transition-colors"
                    aria-label="Back to Dashboard"
                    title="Back to Dashboard"
                >
                    <i className="ri-arrow-left-line text-sm" />
                </button>

                <div className="w-px h-4 bg-[#24262A]" />

                <div className="flex items-center gap-2">
                    <i className="ri-folder-3-fill text-[#3B82F6] text-sm" />
                    <h1 className="text-xs font-semibold text-[#E8E8EA] leading-none tracking-tight">
                        {project.name}
                    </h1>
                </div>
            </div>

            {/* Right Section: Presence + Actions */}
            <div className="flex items-center gap-2">
                <PresenceBadge activeUsers={project?.users} roles={project?.roles} />

                {/* Share / Invite Primary Action Button */}
                <button
                    onClick={onCopyInviteLink}
                    disabled={isGeneratingInvite}
                    className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        inviteCopied
                            ? 'bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E]'
                            : 'bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-xs'
                    }`}
                    title="Share invite link"
                >
                    <i className={isGeneratingInvite ? 'ri-loader-4-line animate-spin' : inviteCopied ? 'ri-check-line' : 'ri-user-add-line'} />
                    <span>{inviteCopied ? 'Copied' : 'Invite'}</span>
                </button>
            </div>
        </header>
    )
})

export default ProjectHeader
