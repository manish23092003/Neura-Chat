import React, { useState, useContext, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Checkbox from '../components/ui/Checkbox'

/* ── Particle background ── */
function ParticleField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const PARTICLE_COUNT = 60
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(124, 92, 255, ${p.alpha})`
        ctx.fill()
      })

      // Draw connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const dx = a.x - b.x, dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(124,92,255,${0.08 * (1 - dist / 100)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        })
      })

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.6 }}
    />
  )
}

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
      navigate('/home')
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials. Please try again.'
      setFormError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [email, password, emailValid, rememberMe, setUser, navigate])

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--nc-bg)' }}
    >
      {/* Animated particle background */}
      <div className="absolute inset-0">
        <ParticleField />
        {/* Radial glow */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 60% at 50% 40%, rgba(124,92,255,0.08) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full"
        style={{ maxWidth: 420 }}
      >
        <div
          className="rounded-[20px] p-8"
          style={{
            background: 'var(--nc-surface)',
            border: '1px solid var(--nc-border)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
          }}
        >
          {/* Logo mark */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-5"
            >
              <div
                className="w-14 h-14 rounded-[16px] flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #7C5CFF 0%, #5B3FD9 100%)',
                  boxShadow: '0 0 32px rgba(124,92,255,0.4)',
                }}
              >
                <i className="ri-sparkling-2-fill text-white text-[26px]" />
              </div>
            </motion.div>

            <h1 className="text-[28px] font-[700] text-[var(--nc-text-primary)] tracking-tight mb-1">
              Welcome back
            </h1>
            <p className="text-[15px]" style={{ color: 'var(--nc-text-secondary)' }}>
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
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 px-4 py-3 rounded-[12px] mb-5 text-[14px]"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#f87171',
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
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
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
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="nc-label mb-0">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-[13px] font-[600] transition-colors"
                  style={{ color: 'var(--nc-primary)' }}
                >
                  Forgot password?
                </Link>
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
              transition={{ delay: 0.2 }}
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
              transition={{ delay: 0.25 }}
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
            transition={{ delay: 0.3 }}
            className="mt-6 text-center text-[14px]"
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