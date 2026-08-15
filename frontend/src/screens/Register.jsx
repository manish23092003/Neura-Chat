import React, { useState, useContext, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Checkbox from '../components/ui/Checkbox'
import NeuraLogo from '../components/ui/NeuraLogo'
import Confetti from '../components/Confetti'
import { validateEmail } from '../utils/emailValidator'
import { analyzePassword, generateStrongPassword } from '../utils/passwordAnalyzer'
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

/* ── Password Strength Indicator ── */
function PasswordStrength({ analysis }) {
  if (!analysis) return null

  const { score, strength, feedback } = analysis
  const segments = 4
  const filled = Math.ceil((score / 6) * segments)

  const colors = ['#EF4444', '#F59E0B', '#F59E0B', '#22C55E']
  const activeColor = score <= 1 ? colors[0] : score <= 3 ? colors[1] : score <= 4 ? colors[2] : colors[3]
  const labels = { weak: 'Weak', fair: 'Fair', good: 'Good', strong: 'Strong', 'very-strong': 'Very strong' }

  const requirements = [
    { met: score > 0, label: 'At least 8 characters' },
    { met: /[A-Z]/.test(analysis?.password || ''), label: 'Uppercase letter' },
    { met: /[0-9]/.test(analysis?.password || ''), label: 'Number' },
    { met: /[^a-zA-Z0-9]/.test(analysis?.password || ''), label: 'Special character' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 space-y-3"
    >
      {/* Strength bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] font-[600]" style={{ color: 'var(--nc-text-muted)' }}>
            Password strength
          </span>
          <span className="text-[12px] font-[700]" style={{ color: activeColor }}>
            {labels[strength] || strength}
          </span>
        </div>
        <div className="nc-strength-bar">
          {Array.from({ length: segments }, (_, i) => (
            <div
              key={i}
              className="nc-strength-segment transition-colors duration-200"
              style={{ background: i < filled ? activeColor : undefined }}
            />
          ))}
        </div>
      </div>

      {/* Requirements */}
      <div className="grid grid-cols-2 gap-1">
        {requirements.map((req, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <i
              className={`text-[13px] ${req.met ? 'ri-check-circle-fill' : 'ri-circle-line'}`}
              style={{ color: req.met ? 'var(--nc-success)' : 'var(--nc-text-muted)' }}
            />
            <span className="text-[12px] font-[500]" style={{ color: req.met ? 'var(--nc-text-secondary)' : 'var(--nc-text-muted)' }}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ── Register component ── */
const Register = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailValidation, setEmailValidation] = useState(null)
  const [passwordAnalysis, setPasswordAnalysis] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [formError, setFormError] = useState('')
  const googleBtnRef = useRef(null)
  const { loading: googleLoading, error: googleError } = useGoogleAuth(googleBtnRef)

  const { setUser } = useContext(UserContext)
  const navigate = useNavigate()

  // Show Google errors in the form error banner
  useEffect(() => {
    if (googleError) setFormError(googleError)
  }, [googleError])

  useEffect(() => {
    if (email && emailTouched) setEmailValidation(validateEmail(email))
    else setEmailValidation(null)
  }, [email, emailTouched])

  useEffect(() => {
    if (password && passwordTouched) {
      const a = analyzePassword(password)
      // Attach raw password for requirements check
      setPasswordAnalysis({ ...a, password })
    } else {
      setPasswordAnalysis(null)
    }
  }, [password, passwordTouched])

  const handleGeneratePassword = useCallback(() => {
    const pwd = generateStrongPassword(16)
    setPassword(pwd)
    setConfirmPassword(pwd)
    setPasswordTouched(true)
    toast.success('Strong password generated!', { icon: '🔐' })
  }, [])

  const submitHandler = useCallback(async (e) => {
    e.preventDefault()
    setFormError('')

    if (!email || !password || !confirmPassword) { setFormError('Please fill in all fields'); return }

    const emailCheck = validateEmail(email)
    if (!emailCheck.isValid) { setFormError('Please enter a valid email address'); return }
    if (password !== confirmPassword) { setFormError('Passwords do not match'); return }
    if (password.length < 6) { setFormError('Password must be at least 6 characters'); return }

    const pwdAnalysis = analyzePassword(password)
    if (pwdAnalysis.isCommon) { setFormError('Please choose a stronger password'); return }
    if (!agreeTerms) { setFormError('Please accept the terms and conditions'); return }

    setLoading(true)
    try {
      const res = await axios.post('/users/register', { email, password })
      localStorage.setItem('token', res.data.token)
      setUser(res.data.user)
      setShowConfetti(true)
      toast.success('Account created successfully! 🎉')
      // Check if there is a pending invite to redirect to
      const pendingInvite = sessionStorage.getItem('pendingInviteToken')
      if (pendingInvite) {
        sessionStorage.removeItem('pendingInviteToken')
        setTimeout(() => navigate(`/invite/${pendingInvite}`), 1000)
      } else {
        setTimeout(() => navigate('/home'), 2000)
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Registration failed. Please try again.'
      setFormError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [email, password, confirmPassword, agreeTerms, setUser, navigate])

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const isAnyLoading = loading || googleLoading

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--nc-bg)' }}
    >
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        className="relative z-10 w-full"
        style={{ maxWidth: 440 }}
      >
        <div
          className="rounded-[16px] p-8"
          style={{
            background: 'var(--nc-surface)',
            border: '1px solid var(--nc-border)',
            boxShadow: 'var(--shadow-modal)',
          }}
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-7">
            <div className="mb-5">
              <NeuraLogo size={48} animated />
            </div>
            <h1 className="text-[24px] font-[700] text-[var(--nc-text-primary)] tracking-tight mb-1">
              Create your account
            </h1>
            <p className="text-[14px]" style={{ color: 'var(--nc-text-secondary)' }}>
              Join NeuraChat — it's free to start
            </p>
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
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
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                placeholder="you@company.com"
                icon={<i className="ri-mail-line" />}
                success={emailValidation?.isValid === true}
                error={emailTouched && emailValidation?.isValid === false ? 'Invalid email address' : ''}
                validation={emailValidation}
                required
                autoComplete="email"
              />
            </motion.div>

            {/* Password */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center justify-between mb-2">
                <label className="nc-label mb-0">Password</label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="flex items-center gap-1 text-[12px] font-[600] transition-colors"
                  style={{ color: 'var(--nc-primary)' }}
                >
                  <i className="ri-ai-generate-line" />
                  Generate
                </button>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                placeholder="Create a strong password"
                icon={<i className="ri-lock-line" />}
                required
                autoComplete="new-password"
              />
              <PasswordStrength analysis={passwordAnalysis} />
            </motion.div>

            {/* Confirm Password */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Input
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                icon={<i className="ri-lock-password-line" />}
                success={passwordsMatch}
                error={confirmPassword.length > 0 && !passwordsMatch ? "Passwords don't match" : ''}
                required
                autoComplete="new-password"
              />
            </motion.div>

            {/* Terms */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <Checkbox
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                id="agree-terms"
                label={
                  <span>
                    I agree to the{' '}
                    <Link to="/terms" className="font-[600] underline underline-offset-2" style={{ color: 'var(--nc-primary)' }}>
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="font-[600] underline underline-offset-2" style={{ color: 'var(--nc-primary)' }}>
                      Privacy Policy
                    </Link>
                  </span>
                }
              />
            </motion.div>

            {/* Submit */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                fullWidth
                disabled={!agreeTerms || isAnyLoading}
              >
                Create account
              </Button>
            </motion.div>
          </form>

          {/* ── OR divider ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
            className="flex items-center gap-3 my-5"
          >
            <div className="flex-1 h-px" style={{ background: 'var(--nc-border)' }} />
            <span className="text-[12px] font-[600] uppercase tracking-wider" style={{ color: 'var(--nc-text-muted)' }}>
              or
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--nc-border)' }} />
          </motion.div>

          {/* ── Google sign-up button ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full flex justify-center"
          >
            <div
              ref={googleBtnRef}
              className="w-full min-h-[44px] flex justify-center items-center overflow-hidden rounded-[12px]"
            />
          </motion.div>

          {/* Sign in link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center text-[13px]"
            style={{ color: 'var(--nc-text-secondary)' }}
          >
            Already have an account?{' '}
            <Link to="/login" className="font-[600] transition-colors" style={{ color: 'var(--nc-primary)' }}>
              Sign in
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}

export default Register