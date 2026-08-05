import React, { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'

/**
 * ProjectHeader
 * Top navigation bar for the Project page.
 * Memoized to prevent re-renders when chat/editor state changes.
 */
const ProjectHeader = memo(function ProjectHeader({
    project,
    isSidePanelOpen,
    onToggleSidePanel,
    onOpenAddMember,
    inviteCopied,
    isGeneratingInvite,
    onCopyInviteLink,
}) {
    const navigate = useNavigate()

    return (
        <header
            className="flex items-center justify-between px-5 shrink-0 z-20"
            style={{
                height: 56,
                background: 'var(--nc-surface)',
                borderBottom: '1px solid var(--nc-border)',
            }}
        >
            {/* Back + project name */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/home')}
                    className="nc-btn-icon"
                    style={{ width: 34, height: 34 }}
                    aria-label="Back to Dashboard"
                >
                    <i className="ri-arrow-left-line text-[16px]" />
                </button>

                <div className="w-px h-5 flex-shrink-0" style={{ background: 'var(--nc-border)' }} />

                <div
                    className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--nc-primary-muted)', border: '1px solid var(--nc-primary-border)' }}
                >
                    <i className="ri-folder-3-fill text-[14px]" style={{ color: 'var(--nc-primary)' }} />
                </div>

                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-[15px] font-[700] text-[var(--nc-text-primary)] leading-none tracking-tight">
                            {project.name}
                        </h1>
                        {project.githubRepoName && (
                            <a
                                href={project.githubRepoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-[600] transition-colors"
                                style={{
                                    background: project.githubSyncStatus === 'syncing'
                                        ? 'rgba(59,130,246,0.1)'
                                        : project.githubSyncStatus === 'error'
                                        ? 'rgba(239,68,68,0.1)'
                                        : 'rgba(255,255,255,0.06)',
                                    border: `1px solid ${
                                        project.githubSyncStatus === 'syncing'
                                            ? 'rgba(59,130,246,0.2)'
                                            : project.githubSyncStatus === 'error'
                                            ? 'rgba(239,68,68,0.2)'
                                            : 'var(--nc-border)'
                                    }`,
                                    color: project.githubSyncStatus === 'syncing'
                                        ? '#60A5FA'
                                        : project.githubSyncStatus === 'error'
                                        ? '#F87171'
                                        : '#94A3B8',
                                }}
                                title={`Repository: ${project.githubRepoName}`}
                            >
                                <i className="ri-github-fill text-[12px]" />
                                <span>
                                    {project.githubSyncStatus === 'syncing'
                                        ? 'Syncing…'
                                        : project.githubSyncStatus === 'error'
                                        ? 'Sync Error'
                                        : 'Synced'}
                                </span>
                            </a>
                        )}
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--nc-text-muted)' }}>
                        {project.users?.length || 0}{' '}
                        {project.users?.length === 1 ? 'member' : 'members'}
                    </p>
                </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
                {/* Copy Invite Link */}
                <button
                    onClick={onCopyInviteLink}
                    disabled={isGeneratingInvite}
                    title="Share invite link with your team"
                    aria-label="Copy invite link"
                    style={{
                        position: 'relative', overflow: 'hidden',
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '0 14px', height: 36, borderRadius: 10,
                        background: inviteCopied ? 'rgba(34,197,94,0.1)' : 'var(--nc-primary-muted)',
                        border: `1px solid ${inviteCopied ? 'rgba(34,197,94,0.2)' : 'var(--nc-primary-border)'}`,
                        color: inviteCopied ? '#4ADE80' : 'var(--nc-primary)',
                        fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em',
                        cursor: isGeneratingInvite ? 'not-allowed' : 'pointer',
                        opacity: isGeneratingInvite ? 0.65 : 1,
                        transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
                    }}
                >
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
                        borderRadius: '10px 10px 0 0', pointerEvents: 'none',
                    }} />
                    <i
                        className={`${isGeneratingInvite ? 'ri-loader-4-line nc-spin' : inviteCopied ? 'ri-check-double-line' : 'ri-links-line'}`}
                        style={{ fontSize: 13, position: 'relative' }}
                    />
                    <span className="hidden sm:inline" style={{ position: 'relative' }}>
                        {inviteCopied ? 'Copied!' : 'Invite'}
                    </span>
                </button>

                <Button
                    onClick={onOpenAddMember}
                    variant="secondary"
                    size="sm"
                    icon={<i className="ri-user-add-line" />}
                >
                    Add member
                </Button>

                <button
                    onClick={onToggleSidePanel}
                    className="nc-btn-icon"
                    style={isSidePanelOpen ? {
                        background: 'var(--nc-primary-muted)',
                        borderColor: 'var(--nc-primary-border)',
                        color: 'var(--nc-primary)',
                    } : {}}
                    aria-label="Toggle collaborators panel"
                >
                    <i className="ri-group-2-line text-[17px]" />
                </button>
            </div>
        </header>
    )
})

export default ProjectHeader
