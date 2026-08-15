import React, { useState, useContext, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import NeuraLogo from '../components/ui/NeuraLogo'
import useGoogleAuth from '../hooks/useGoogleAuth'

/* ── Google icon (official branded SVG) ── */
function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  )
}

/* ── Main Login component ── */
const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailValid, setEmailValid] = useState(null)
  const [formError, setFormError] = useState('')

  const { setUser } = useContext(UserContext)
  const navigate = useNavigate()
  const googleBtnRef = useRef(null)
  const { loading: googleLoading, error: googleError } = useGoogleAuth(googleBtnRef)

  // Email validation
  useEffect(() => {
    if (!email) { setEmailValid(null); return }
    const timer = setTimeout(() => {
      setEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    }, 400)
    return () => clearTimeout(timer)
  }, [email])

  // Show Google errors in the form error banner
  useEffect(() => {
    if (googleError) setFormError(googleError)
  }, [googleError])

  const submitHandler = useCallback(async (e) => {
    e.preventDefault()
    setFormError('')

    if (!email || !password) { setFormError('Please fill in all fields'); return }
    if (emailValid === false) { setFormError('Please enter a valid email address'); return }

    setLoading(true)
    try {
      const res = await axios.post('/users/login', { email, password })
      localStorage.setItem('token', res.data.token)
      setUser(res.data.user)
      toast.success('Welcome back!')
      // Check if there is a pending invite to redirect to
      const pendingInvite = sessionStorage.getItem('pendingInviteToken')
      if (pendingInvite) {
        sessionStorage.removeItem('pendingInviteToken')
        navigate(`/invite/${pendingInvite}`)
      } else {
        navigate('/home')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Invalid credentials. Please try again.'
      setFormError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [email, password, emailValid, setUser, navigate])

  const isAnyLoading = loading || googleLoading

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--nc-bg)' }}
    >
      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        className="relative z-10 w-full"
        style={{ maxWidth: 420 }}
      >
        <div
          className="rounded-[16px] p-8"
          style={{
            background: 'var(--nc-surface)',
            border: '1px solid var(--nc-border)',
            boxShadow: 'var(--shadow-modal)',
          }}
        >
          {/* Logo mark */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-5">
              <NeuraLogo size={48} animated />
            </div>

            <h1 className="text-[24px] font-[700] text-[var(--nc-text-primary)] tracking-tight mb-1">
              Welcome back
            </h1>
            <p className="text-[14px]" style={{ color: 'var(--nc-text-secondary)' }}>
              Sign in to your NeuraChat workspace
            </p>
          </div>

          {/* Form error banner */}
          <AnimatePresence>
            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3 px-4 py-3 rounded-[10px] mb-5 text-[13px]"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  color: '#EF4444',
                }}
              >
                <i className="ri-error-warning-line flex-shrink-0" />
                {formError}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={submitHandler} className="space-y-5" noValidate>
            {/* Email */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                icon={<i className="ri-mail-line" />}
                success={emailValid === true}
                error={emailValid === false && email.length > 0 ? 'Invalid email address' : ''}
                required
                autoComplete="email"
              />
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="nc-label mb-0">Password</label>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<i className="ri-lock-line" />}
                required
                autoComplete="current-password"
              />
            </motion.div>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={isAnyLoading}
                fullWidth
                size="md"
              >
                Sign in
              </Button>
            </motion.div>
          </form>

          {/* ── OR divider ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 my-5"
          >
            <div className="flex-1 h-px" style={{ background: 'var(--nc-border)' }} />
            <span className="text-[12px] font-[600] uppercase tracking-wider" style={{ color: 'var(--nc-text-muted)' }}>
              or
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--nc-border)' }} />
          </motion.div>

          {/* ── Google sign-in button ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="w-full flex justify-center"
          >
            <div
              ref={googleBtnRef}
              className="w-full min-h-[44px] flex justify-center items-center overflow-hidden rounded-[12px]"
            />
          </motion.div>

          {/* Sign up link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
            className="mt-6 text-center text-[13px]"
            style={{ color: 'var(--nc-text-secondary)' }}
          >
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-[600] transition-colors"
              style={{ color: 'var(--nc-primary)' }}
            >
              Create one free
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}

export default Login