import React, { useContext, useState, useCallback, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import { useTheme } from '../context/theme.context'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from '../config/axios'
import toast from 'react-hot-toast'
import Header from '../components/ui/Header'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import Switch from '../components/ui/Switch'
import Tabs from '../components/ui/Tabs'

/* ─── Section Card ─── */
function SectionCard({ title, description, children, className = '' }) {
  return (
    <div
      className={`rounded-[16px] overflow-hidden ${className}`}
      style={{ background: 'var(--nc-elevated)', border: '1px solid var(--nc-border)' }}
    >
      {(title || description) && (
        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--nc-border)' }}>
          {title && <h3 className="text-[16px] font-[700] text-[var(--nc-text-primary)]">{title}</h3>}
          {description && <p className="text-[13px] mt-0.5" style={{ color: 'var(--nc-text-secondary)' }}>{description}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}

/* ─── Profile Tab ─── */
function ProfileTab({ user, onSave }) {
  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ name, bio, avatar: user?.avatar || '' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Avatar card */}
      <SectionCard title="Profile picture">
        <div className="flex items-center gap-5">
          <Avatar email={user?.email} name={user?.name} size="2xl" shape="square" />
          <div>
            <p className="text-[15px] font-[600] text-[var(--nc-text-primary)] mb-0.5">
              {name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-[13px] mb-4" style={{ color: 'var(--nc-text-secondary)' }}>
              {user?.email}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" icon={<i className="ri-upload-2-line" />}>
                Upload photo
              </Button>
              <Button variant="ghost" size="sm">Remove</Button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Info form */}
      <SectionCard title="Personal information" description="Update your display name and bio">
        <form onSubmit={handleSave} className="space-y-5">
          <Input
            label="Display name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your display name"
            icon={<i className="ri-user-3-line" />}
            maxLength={50}
          />

          <div>
            <label className="nc-label">Email address</label>
            <div
              className="flex items-center gap-3 h-12 px-4 rounded-[12px]"
              style={{ background: 'var(--nc-surface)', border: '1px solid var(--nc-border)' }}
            >
              <i className="ri-mail-line text-[16px]" style={{ color: 'var(--nc-text-muted)' }} />
              <span className="flex-1 text-[15px] font-[500]" style={{ color: 'var(--nc-text-muted)' }}>
                {user?.email}
              </span>
              <Badge variant="success" size="sm">Verified</Badge>
            </div>
            <p className="mt-1.5 text-[12px]" style={{ color: 'var(--nc-text-muted)' }}>
              Email cannot be changed for security reasons
            </p>
          </div>

          <div>
            <label className="nc-label">Bio <span style={{ color: 'var(--nc-text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell your team a little about yourself…"
              maxLength={200}
              rows={3}
              className="nc-input nc-textarea w-full"
              style={{ resize: 'none' }}
            />
            <p className="mt-1.5 text-[12px] text-right" style={{ color: 'var(--nc-text-muted)' }}>
              {bio.length}/200
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={saving} icon={<i className="ri-save-3-line" />}>
              Save changes
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}

function AppearanceTab() {
  const { theme, toggleTheme } = useTheme()
  const [compactDensity, setCompactDensity] = useState(() => localStorage.getItem('prefs-compact') === 'true')
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('prefs-motion') === 'true')
  const [showSidebarLabels, setShowSidebarLabels] = useState(() => {
    const val = localStorage.getItem('prefs-sidebar-labels')
    return val === null ? true : val === 'true'
  })

  const handleCompactChange = (checked) => {
    setCompactDensity(checked)
    localStorage.setItem('prefs-compact', String(checked))
    if (checked) {
      document.body.classList.add('nc-compact')
    } else {
      document.body.classList.remove('nc-compact')
    }
  }

  const handleMotionChange = (checked) => {
    setReducedMotion(checked)
    localStorage.setItem('prefs-motion', String(checked))
  }

  const handleSidebarLabelsChange = (checked) => {
    setShowSidebarLabels(checked)
    localStorage.setItem('prefs-sidebar-labels', String(checked))
  }

  const themeOptions = [
    {
      id: 'dark',
      label: 'Dark',
      sub: 'Easy on the eyes',
      icon: 'ri-moon-fill',
      preview: '#09090F',
    },
    {
      id: 'light',
      label: 'Light',
      sub: 'Clean and bright',
      icon: 'ri-sun-fill',
      preview: '#F8FAFC',
    },
  ]

  return (
    <div className="space-y-5">
      <SectionCard title="Theme" description="Choose how NeuraChat looks for you">
        <div className="grid grid-cols-2 gap-3">
          {themeOptions.map((opt) => {
            const isActive = theme === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => theme !== opt.id && toggleTheme()}
                className="p-5 rounded-[14px] text-left transition-all"
                style={{
                  background: isActive ? 'var(--nc-primary-muted)' : 'var(--nc-surface)',
                  border: `1px solid ${isActive ? 'var(--nc-primary-border)' : 'var(--nc-border)'}`,
                }}
              >
                {/* Color preview */}
                <div
                  className="w-full h-16 rounded-[10px] mb-4 flex items-end p-2"
                  style={{ background: opt.preview, border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex gap-1.5">
                    {[40, 60, 80].map((w) => (
                      <div key={w} className="h-2 rounded-full" style={{ width: w, background: isActive ? 'var(--nc-primary)' : 'rgba(100,116,139,0.4)' }} />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-[700] text-[var(--nc-text-primary)]">{opt.label}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--nc-text-secondary)' }}>{opt.sub}</p>
                  </div>
                  {isActive && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--nc-primary)' }}
                    >
                      <i className="ri-check-line text-[11px]" style={{ color: 'var(--nc-bg)' }} />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard title="Preferences">
        <div className="space-y-4">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-[14px] font-[600] text-[var(--nc-text-primary)]">Compact density</p>
              <p className="text-[12px]" style={{ color: 'var(--nc-text-secondary)' }}>Show more content with smaller spacing</p>
            </div>
            <Switch checked={compactDensity} onChange={handleCompactChange} size="sm" />
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-[14px] font-[600] text-[var(--nc-text-primary)]">Reduced motion</p>
              <p className="text-[12px]" style={{ color: 'var(--nc-text-secondary)' }}>Minimize animations for accessibility</p>
            </div>
            <Switch checked={reducedMotion} onChange={handleMotionChange} size="sm" />
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-[14px] font-[600] text-[var(--nc-text-primary)]">Show sidebar labels</p>
              <p className="text-[12px]" style={{ color: 'var(--nc-text-secondary)' }}>Always show navigation labels in sidebar</p>
            </div>
            <Switch checked={showSidebarLabels} onChange={handleSidebarLabelsChange} size="sm" />
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

/* ─── Security Tab ─── */
function SecurityTab() {
  const { setUser } = useContext(UserContext)
  const navigate = useNavigate()
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPwd !== confirmPwd) { toast.error("New passwords don't match"); return }
    if (newPwd.length < 8) { toast.error("Password must be at least 8 characters"); return }
    setSaving(true)
    try {
      await axios.put('/users/change-password', { currentPassword: currentPwd, newPassword: newPwd })
      toast.success('Password changed successfully!')
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Failed to change password'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.");
    if (!confirmed) return

    setDeleting(true)
    try {
      await axios.delete('/users/profile')
      toast.success('Account deleted successfully')
      localStorage.removeItem('token')
      setUser(null)
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Failed to delete account'
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Change password">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            value={currentPwd}
            onChange={e => setCurrentPwd(e.target.value)}
            placeholder="Enter current password"
            icon={<i className="ri-lock-line" />}
            required
          />
          <Input
            label="New password"
            type="password"
            value={newPwd}
            onChange={e => setNewPwd(e.target.value)}
            placeholder="Create new password"
            icon={<i className="ri-lock-password-line" />}
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirmPwd}
            onChange={e => setConfirmPwd(e.target.value)}
            placeholder="Repeat new password"
            icon={<i className="ri-lock-password-line" />}
            success={confirmPwd.length > 0 && confirmPwd === newPwd}
            error={confirmPwd.length > 0 && confirmPwd !== newPwd ? "Passwords don't match" : ''}
            required
          />
          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" loading={saving} icon={<i className="ri-shield-check-line" />}>
              Update password
            </Button>
          </div>
        </form>
      </SectionCard>

      {/* Danger zone */}
      <SectionCard title="Danger zone">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-[600] text-[var(--nc-text-primary)]">Delete account</p>
            <p className="text-[12px]" style={{ color: 'var(--nc-text-secondary)' }}>
              Permanently delete your account and all data
            </p>
          </div>
          <Button variant="danger" size="sm" loading={deleting} onClick={handleDeleteAccount} icon={<i className="ri-delete-bin-line" />}>
            Delete account
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}

/* ─── Integrations Tab ─── */
function IntegrationsTab({ user, setUser }) {
  const [token, setToken] = useState('')
  const [linking, setLinking] = useState(false)

  const handleOAuth = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!clientId) {
      toast.error('GitHub OAuth Client ID is not configured in .env. Please use the Personal Access Token option below.');
      return;
    }
    const jwt = localStorage.getItem('token');
    const authorizeUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user&state=${jwt}`;
    window.location.href = authorizeUrl;
  }

  const handleLinkToken = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error('Please enter a GitHub Personal Access Token');
      return;
    }
    setLinking(true);
    try {
      const res = await axios.post('/github/link-token', { token: token.trim() });
      toast.success(res.data.message || 'GitHub linked successfully!');
      
      // Update user state
      const profileRes = await axios.get('/users/profile');
      setUser(profileRes.data.user);
      setToken('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to verify and link GitHub token');
    } finally {
      setLinking(false);
    }
  }

  const handleDisconnect = async () => {
    const confirmed = window.confirm("Are you sure you want to disconnect your GitHub account?");
    if (!confirmed) return;

    try {
      await axios.post('/github/disconnect');
      toast.success('GitHub account disconnected successfully.');
      
      // Update user state
      const profileRes = await axios.get('/users/profile');
      setUser(profileRes.data.user);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to disconnect GitHub');
    }
  }

  const isConnected = !!user?.github?.accessToken;
  const isGoogleConnected = !!user?.google?.id;

  return (
    <div className="space-y-5">
      {/* Google Authentication */}
      <SectionCard title="Google Authentication" description="Sign in to NeuraChat using your Google account.">
        {isGoogleConnected ? (
          <div className="flex items-center justify-between p-4 rounded-[12px]" style={{ background: 'var(--nc-surface)', border: '1px solid var(--nc-border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <svg width={20} height={20} viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-[600] text-[var(--nc-text-primary)]">Google Connected</p>
                <p className="text-[12px]" style={{ color: 'var(--nc-text-secondary)' }}>Signed in as <span className="font-[600]" style={{ color: 'var(--nc-primary)' }}>{user?.google?.email}</span></p>
              </div>
            </div>
            <Badge variant="success" size="sm">Connected</Badge>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-[12px]" style={{ background: 'var(--nc-surface)', border: '1px solid var(--nc-border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', opacity: 0.5 }}>
                <svg width={20} height={20} viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-[600] text-[var(--nc-text-primary)]">Google</p>
                <p className="text-[12px]" style={{ color: 'var(--nc-text-secondary)' }}>Sign in with Google on the login page to link your account</p>
              </div>
            </div>
            <Badge variant="default" size="sm">Not connected</Badge>
          </div>
        )}
      </SectionCard>

      <SectionCard title="GitHub Integration" description="Connect your GitHub account to enable automatic repository creation and file synchronization.">
        {isConnected ? (
          <div className="flex items-center justify-between p-4 rounded-[12px]" style={{ background: 'var(--nc-surface)', border: '1px solid var(--nc-border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[20px]" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--nc-text-primary)' }}>
                <i className="ri-github-fill" />
              </div>
              <div>
                <p className="text-[14px] font-[600] text-[var(--nc-text-primary)]">Connected to GitHub</p>
                <p className="text-[12px]" style={{ color: 'var(--nc-text-secondary)' }}>Logged in as <span className="font-[600]" style={{ color: 'var(--nc-primary)' }}>@{user?.github?.username}</span></p>
              </div>
            </div>
            <Button variant="danger" size="sm" onClick={handleDisconnect} icon={<i className="ri-logout-box-r-line" />}>
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-[14px] font-[600] text-[var(--nc-text-primary)] mb-2">Option 1: Connect via GitHub OAuth</p>
              <p className="text-[12px] mb-4" style={{ color: 'var(--nc-text-secondary)' }}>
                Grant permission securely using GitHub's official authentication page.
              </p>
              <Button onClick={handleOAuth} icon={<i className="ri-github-fill" />}>
                Connect GitHub Account
              </Button>
            </div>

            <div className="h-px w-full" style={{ background: 'var(--nc-border)' }} />

            <div>
              <p className="text-[14px] font-[600] text-[var(--nc-text-primary)] mb-2">Option 2: Connect via Personal Access Token</p>
              <p className="text-[12px] mb-4" style={{ color: 'var(--nc-text-secondary)' }}>
                Generate a GitHub Token with <code className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--nc-primary)' }}>repo</code> and <code className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--nc-primary)' }}>user</code> scopes and paste it here.
              </p>
              <form onSubmit={handleLinkToken} className="space-y-4">
                <Input
                  type="password"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  icon={<i className="ri-key-line" />}
                />
                <Button type="submit" variant="secondary" loading={linking} icon={<i className="ri-link" />}>
                  Verify & Link Token
                </Button>
              </form>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

/* ─────────────────────────────────────────
   PROFILE SCREEN
───────────────────────────────────────── */
const Profile = () => {
  const { user, setUser } = useContext(UserContext)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'github_connected') {
      toast.success('GitHub account connected successfully!')
      // Fetch fresh user profile
      axios.get('/users/profile')
        .then(res => {
          setUser(res.data.user)
          // Clean URL params
          window.history.replaceState({}, document.title, window.location.pathname)
        })
    } else if (params.get('error')) {
      toast.error(`Failed to connect GitHub: ${params.get('error').replace(/_/g, ' ')}`)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [setUser])

  const handleSave = useCallback(async (data) => {
    try {
      const res = await axios.put('/users/profile', data)
      setUser(res.data.user)
      toast.success('Profile updated!')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Failed to update profile'
      toast.error(msg)
    }
  }, [setUser])

  const TABS = [
    { id: 'profile',       label: 'Profile',       icon: 'ri-user-3-line' },
    { id: 'appearance',    label: 'Appearance',     icon: 'ri-palette-line' },
    { id: 'security',      label: 'Security',       icon: 'ri-shield-keyhole-line' },
    { id: 'integrations',  label: 'Integrations',   icon: 'ri-github-fill' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--nc-bg)' }}>
      <Header />

      <main className="max-w-[900px] mx-auto px-6 py-8">
        {/* Back */}
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-[14px] font-[500] mb-6 transition-colors"
          style={{ color: 'var(--nc-text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--nc-text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--nc-text-secondary)'}
        >
          <i className="ri-arrow-left-line" />
          Back to Dashboard
        </button>

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-[28px] font-[700] text-[var(--nc-text-primary)]">Settings</h1>
          <p className="text-[15px] mt-1" style={{ color: 'var(--nc-text-secondary)' }}>
            Manage your account preferences
          </p>
        </div>

        {/* Tabs */}
        <Tabs
          items={TABS}
          activeId={activeTab}
          onChange={setActiveTab}
          variant="pills"
          className="mb-6"
        />

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'profile' && <ProfileTab user={user} onSave={handleSave} />}
            {activeTab === 'appearance' && <AppearanceTab />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'integrations' && <IntegrationsTab user={user} setUser={setUser} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default Profile
