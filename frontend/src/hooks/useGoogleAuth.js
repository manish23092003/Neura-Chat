import { useState, useEffect, useRef, useCallback, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

/**
 * useGoogleAuth — shared hook for Google Sign-In via Google Identity Services.
 *
 * Loads the GIS script once, initializes the Google client, and provides a
 * `triggerGoogleLogin` function that opens the Google popup. On success,
 * sends the ID token to POST /users/google-auth and updates auth context.
 *
 * @returns {{ triggerGoogleLogin, loading, error, scriptReady }}
 */
export default function useGoogleAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scriptReady, setScriptReady] = useState(false)
  const clientRef = useRef(null)
  const initializedRef = useRef(false)

  const { setUser } = useContext(UserContext)
  const navigate = useNavigate()

  // ── Load GIS script (idempotent) ──────────────────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    // Check if the script is already loaded
    if (window.google?.accounts?.id) {
      setScriptReady(true)
      return
    }

    // Check if the script tag already exists (loading in progress)
    const existingScript = document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`)
    if (existingScript) {
      existingScript.addEventListener('load', () => setScriptReady(true))
      return
    }

    const script = document.createElement('script')
    script.src = GIS_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => setScriptReady(true)
    script.onerror = () => {
      console.error('Failed to load Google Identity Services script')
      setError('Failed to load Google Sign-In. Please try again later.')
    }
    document.head.appendChild(script)
  }, [])

  // ── Initialize the Google client once the script is ready ─────────────────
  useEffect(() => {
    if (!scriptReady || !GOOGLE_CLIENT_ID || initializedRef.current) return
    if (!window.google?.accounts?.id) return

    initializedRef.current = true

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    })
  }, [scriptReady])

  // ── Handle the Google credential response ─────────────────────────────────
  const handleCredentialResponse = useCallback(async (response) => {
    if (!response?.credential) {
      setError('Google Sign-In was cancelled')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await axios.post('/users/google-auth', {
        credential: response.credential,
      })

      // Use the same token storage mechanism as existing login
      localStorage.setItem('token', res.data.token)
      setUser(res.data.user)
      toast.success('Signed in with Google!')

      // Handle pending invite redirect (same as existing login flow)
      const pendingInvite = sessionStorage.getItem('pendingInviteToken')
      if (pendingInvite) {
        sessionStorage.removeItem('pendingInviteToken')
        navigate(`/invite/${pendingInvite}`)
      } else {
        navigate('/home')
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        'Google Sign-In failed. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [setUser, navigate])

  // ── Trigger the Google One Tap / popup ─────────────────────────────────────
  const triggerGoogleLogin = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google Sign-In is not configured')
      return
    }

    if (!window.google?.accounts?.id) {
      toast.error('Google Sign-In is still loading. Please wait.')
      return
    }

    setError('')
    // Prompt the Google One Tap popup
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        // Fallback: if One Tap is blocked (e.g. by browser), nothing we can do
        // The user may need to use email/password
        const reason = notification.getNotDisplayedReason()
        if (reason === 'opt_out_or_no_session') {
          setError('No Google session found. Please sign in to Google first.')
          toast.error('No Google session found. Please sign in to Google first.')
        } else if (reason === 'suppressed_by_user') {
          // User previously dismissed, don't show error
        } else {
          console.log('Google One Tap not displayed:', reason)
        }
      }
      if (notification.isSkippedMoment()) {
        // User closed the prompt
        const reason = notification.getSkippedReason()
        if (reason === 'user_cancel') {
          // Intentional dismissal, no error needed
        }
      }
    })
  }, [])

  return {
    triggerGoogleLogin,
    loading,
    error,
    scriptReady: scriptReady && !!GOOGLE_CLIENT_ID,
  }
}
