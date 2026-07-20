import React, { useState, useContext, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Checkbox from '../components/ui/Checkbox'

/* ── Main Login component ── */
const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [emailValid, setEmailValid] = useState(null)
  const [formError, setFormError] = useState('')

  const { setUser } = useContext(UserContext)
  const navigate = useNavigate()

  // Email validation
  useEffect(() => {
    if (!email) { setEmailValid(null); return }
    const timer = setTimeout(() => {
      setEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    }, 400)
    return () => clearTimeout(timer)
  }, [email])

  const submitHandler = useCallback(async (e) => {
    e.preventDefault()
    setFormError('')

    if (!email || !password) { setFormError('Please fill in all fields'); return }
    if (emailValid === false) { setFormError('Please enter a valid email address'); return }

    setLoading(true)
    try {
      const res = await axios.post('/users/login', { email, password })
      localStorage.setItem('token', res.data.token)
      if (rememberMe) localStorage.setItem('rememberMe', 'true')
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
  }, [email, password, emailValid, rememberMe, setUser, navigate])

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
              <div
                className="w-12 h-12 rounded-[12px] flex items-center justify-center"
                style={{ backgroundColor: 'var(--nc-primary)' }}
              >
                <i className="ri-sparkling-2-line text-[22px]" style={{ color: 'var(--nc-bg)' }} />
              </div>
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

            {/* Remember me */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                label="Keep me signed in for 30 days"
                id="remember-me"
              />
            </motion.div>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                fullWidth
                size="md"
              >
                Sign in
              </Button>
            </motion.div>
          </form>

          {/* Sign up link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
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