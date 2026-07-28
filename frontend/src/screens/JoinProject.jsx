import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

function fmtDate(d) {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function fmtExpiry(d) {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const JoinProject = () => {
    const { token } = useParams()
    const navigate = useNavigate()
    const { user, loading: authLoading } = useContext(UserContext)

    const [status, setStatus] = useState('loading')
    const [project, setProject] = useState(null)
    const [errorMsg, setErrorMsg] = useState('')
    const [joining, setJoining] = useState(false)
    const [role, setRole] = useState('')

    useEffect(() => {
        if (!token) { setStatus('invalid'); return }
        axios.get(`/projects/invite/${token}/preview`)
            .then(res => { setProject(res.data.project); setStatus('preview') })
            .catch(err => {
                const msg = err.response?.data?.error || 'Invalid invite link'
                setErrorMsg(msg)
                setStatus(msg.toLowerCase().includes('expired') ? 'expired' : 'invalid')
            })
    }, [token])

    useEffect(() => {
        if (authLoading || status === 'loading') return
        if (!user && status === 'preview') {
            sessionStorage.setItem('pendingInviteToken', token)
            navigate(`/login?redirect=/invite/${token}`)
        }
    }, [user, authLoading, status, token, navigate])

    useEffect(() => {
        if (status === 'preview' && user && project) {
            const isMember = project.members?.some(m => m.email === user.email)
            if (isMember) setStatus('already')
        }
    }, [status, user, project])

    const handleJoin = async () => {
        if (!user) {
            sessionStorage.setItem('pendingInviteToken', token)
            navigate(`/login?redirect=/invite/${token}`)
            return
        }
        if (!role.trim()) {
            return
        }
        setJoining(true)
        try {
            const res = await axios.post('/projects/invite/join', { token, role: role.trim() })
            setStatus(res.data.alreadyMember ? 'already' : 'joined')
            if (!res.data.alreadyMember) setTimeout(() => navigate('/home'), 2400)
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to join project'
            setErrorMsg(msg)
            setStatus(msg.toLowerCase().includes('expired') ? 'expired' : 'error')
        } finally {
            setJoining(false)
        }
    }

    const fadeUp = {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] },
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--nc-bg)' }}>
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-2 mb-10"
            >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--nc-primary)' }}>
                    <i className="ri-sparkling-2-line text-[16px]" style={{ color: 'var(--nc-bg)' }} />
                </div>
                <span className="text-[18px] font-[800] text-[var(--nc-text-primary)] tracking-tight">
                    Neura<span style={{ color: 'var(--nc-primary)' }}>Chat</span>
                </span>
            </motion.div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={status}
                    {...fadeUp}
                    className="w-full max-w-[420px] rounded-[16px] p-8"
                    style={{ background: 'var(--nc-surface)', border: '1px solid var(--nc-border)' }}
                >
                    {status === 'loading' && (
                        <div className="text-center py-6">
                            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--nc-primary-muted)', color: 'var(--nc-primary)' }}>
                                <i className="ri-loader-4-line nc-spin text-[24px]" />
                            </div>
                            <h2 className="text-[18px] font-[600] text-[var(--nc-text-primary)] mb-2">Loading invite...</h2>
                            <p className="text-[14px]" style={{ color: 'var(--nc-text-secondary)' }}>Checking invitation details</p>
                        </div>
                    )}

                    {status === 'invalid' && (
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-[14px] mx-auto mb-5 flex items-center justify-center bg-red-50 text-red-500 border border-red-100">
                                <i className="ri-link-unlink-m text-[24px]" />
                            </div>
                            <h2 className="text-[20px] font-[700] text-[var(--nc-text-primary)] mb-2">Link not found</h2>
                            <p className="text-[14px] mb-8" style={{ color: 'var(--nc-text-secondary)' }}>
                                This invite link doesn't exist or has been revoked.<br />Ask a project member for a fresh link.
                            </p>
                            <Button variant="secondary" onClick={() => navigate('/')} fullWidth icon={<i className="ri-arrow-left-line" />}>
                                Back to homepage
                            </Button>
                        </div>
                    )}

                    {status === 'expired' && (
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-[14px] mx-auto mb-5 flex items-center justify-center bg-yellow-50 text-yellow-600 border border-yellow-100">
                                <i className="ri-time-line text-[24px]" />
                            </div>
                            <h2 className="text-[20px] font-[700] text-[var(--nc-text-primary)] mb-2">Invite expired</h2>
                            <p className="text-[14px] mb-8" style={{ color: 'var(--nc-text-secondary)' }}>
                                Invite links are valid for 7 days. This one has expired.<br />Ask a project member to generate a new one.
                            </p>
                            <Button variant="secondary" onClick={() => navigate('/')} fullWidth icon={<i className="ri-arrow-left-line" />}>
                                Back to homepage
                            </Button>
                        </div>
                    )}

                    {status === 'already' && project && (
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-[14px] mx-auto mb-5 flex items-center justify-center bg-green-50 text-green-600 border border-green-100">
                                <i className="ri-shield-check-fill text-[24px]" />
                            </div>
                            <h2 className="text-[20px] font-[700] text-[var(--nc-text-primary)] mb-2">You're already in!</h2>
                            <p className="text-[14px] mb-2" style={{ color: 'var(--nc-text-secondary)' }}>
                                You already have access to
                            </p>
                            <p className="text-[18px] font-[600] text-[var(--nc-primary)] mb-8">
                                {project.name}
                            </p>
                            <Button variant="primary" onClick={() => navigate('/home')} fullWidth icon={<i className="ri-layout-grid-line" />}>
                                Go to Projects
                            </Button>
                        </div>
                    )}

                    {(status === 'preview' || status === 'joining') && project && user && (
                        <div>
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 rounded-[14px] flex items-center justify-center" style={{ background: 'var(--nc-primary-muted)', border: '1px solid var(--nc-primary-border)' }}>
                                    <i className="ri-folder-3-fill text-[32px] text-[var(--nc-primary)]" />
                                </div>
                            </div>
                            
                            <p className="text-[11px] font-[600] tracking-widest uppercase text-center mb-2" style={{ color: 'var(--nc-text-muted)' }}>
                                You've been invited to join
                            </p>
                            <h1 className="text-[24px] font-[700] text-[var(--nc-text-primary)] text-center mb-3">
                                {project.name}
                            </h1>
                            {project.description && (
                                <p className="text-[14px] text-center mb-6" style={{ color: 'var(--nc-text-secondary)' }}>
                                    {project.description}
                                </p>
                            )}

                            <div className="flex flex-wrap justify-center gap-2 mb-6">
                                <div className="px-3 py-1 rounded-full text-[12px] font-[500] flex items-center gap-1.5" style={{ background: 'var(--nc-elevated)', border: '1px solid var(--nc-border)', color: 'var(--nc-text-secondary)' }}>
                                    <i className="ri-group-2-line" /> {project.memberCount} {project.memberCount === 1 ? 'member' : 'members'}
                                </div>
                                <div className="px-3 py-1 rounded-full text-[12px] font-[500] flex items-center gap-1.5" style={{ background: 'var(--nc-elevated)', border: '1px solid var(--nc-border)', color: 'var(--nc-text-secondary)' }}>
                                    <i className="ri-calendar-line" /> Since {fmtDate(project.createdAt)}
                                </div>
                            </div>

                            <div className="h-px w-full my-6" style={{ background: 'var(--nc-border)' }} />

                             <div className="flex items-center gap-3 p-3 rounded-[12px] mb-4" style={{ background: 'var(--nc-elevated)', border: '1px solid var(--nc-border)' }}>
                                <Avatar email={user.email} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-[600] uppercase" style={{ color: 'var(--nc-text-muted)' }}>Joining as</p>
                                    <p className="text-[13px] font-[500] text-[var(--nc-text-primary)] truncate">{user.email}</p>
                                </div>
                                <i className="ri-check-line text-[16px] text-green-500" />
                            </div>

                            <div className="mb-6 text-left">
                                <label className="nc-label block text-left mb-1.5">Your Role in Project <span className="text-red-500">*</span></label>
                                <Input
                                    type="text"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    placeholder="e.g. Frontend Developer, QA Engineer"
                                    icon={<i className="ri-user-star-line" />}
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <Button onClick={handleJoin} loading={joining} disabled={joining || !role.trim()} fullWidth icon={!joining && <i className="ri-user-add-line" />}>
                                    {joining ? 'Joining…' : 'Join Project'}
                                </Button>
                                <Button variant="secondary" onClick={() => navigate('/')} fullWidth>
                                    Maybe later
                                </Button>
                            </div>

                            {project.expiresAt && (
                                <p className="text-[11px] text-center mt-4 flex items-center justify-center gap-1.5" style={{ color: 'var(--nc-text-muted)' }}>
                                    <i className="ri-shield-keyhole-line" />
                                    Link expires {fmtExpiry(project.expiresAt)}
                                </p>
                            )}
                        </div>
                    )}

                    {status === 'joined' && project && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-green-50 border border-green-200">
                                <i className="ri-check-double-line text-[32px] text-green-500" />
                            </div>
                            <h2 className="text-[24px] font-[700] text-[var(--nc-text-primary)] mb-2">Welcome aboard! 🎉</h2>
                            <p className="text-[14px] mb-1" style={{ color: 'var(--nc-text-secondary)' }}>You've successfully joined</p>
                            <p className="text-[18px] font-[600] text-[var(--nc-primary)] mb-8">{project.name}</p>
                            
                            <div className="flex items-center justify-center gap-2 p-3 rounded-[10px]" style={{ background: 'var(--nc-elevated)', border: '1px solid var(--nc-border)' }}>
                                <i className="ri-loader-4-line nc-spin text-[16px]" style={{ color: 'var(--nc-text-secondary)' }} />
                                <span className="text-[13px] font-[500]" style={{ color: 'var(--nc-text-secondary)' }}>Redirecting to workspace...</span>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-[14px] mx-auto mb-5 flex items-center justify-center bg-red-50 text-red-500 border border-red-100">
                                <i className="ri-error-warning-fill text-[24px]" />
                            </div>
                            <h2 className="text-[20px] font-[700] text-[var(--nc-text-primary)] mb-2">Something went wrong</h2>
                            <p className="text-[14px] mb-8" style={{ color: 'var(--nc-text-secondary)' }}>
                                {errorMsg || 'An unexpected error occurred. Please try again.'}
                            </p>
                            <div className="space-y-3">
                                <Button onClick={() => navigate('/home')} fullWidth icon={<i className="ri-layout-grid-line" />}>
                                    Go to Dashboard
                                </Button>
                                <Button variant="secondary" onClick={() => window.location.reload()} fullWidth icon={<i className="ri-refresh-line" />}>
                                    Try again
                                </Button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

export default JoinProject
