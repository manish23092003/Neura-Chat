import { useState, useEffect, useRef, useCallback, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'

// Fallback to configured Google Client ID if env variable is not injected during build
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '931307926069-ocaftvtmfaiiil49gkev35g28nti1vc0.apps.googleusercontent.com'

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

/**
 * useGoogleAuth — robust Google Sign-In hook using Google Identity Services OAuth 2.0 Web Popup.
 *
 * Uses `window.google.accounts.oauth2.initTokenClient` to open the standard
 * Google account chooser popup. Sends the verified access token to the backend.
 *
 * @returns {{ triggerGoogleLogin, loading, error, scriptReady }}
 */
export default function useGoogleAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scriptReady, setScriptReady] = useState(false)
  const tokenClientRef = useRef(null)
  const callbackRef = useRef(null) // stable ref for the callback

  const { setUser, setLoading: setContextLoading } = useContext(UserContext)
  const navigate = useNavigate()

  // ── Keep callbackRef always pointing to latest handler (avoids stale closures) ──
  callbackRef.current = async (tokenResponse) => {
    if (tokenResponse.error) {
      console.error('Google OAuth error:', tokenResponse.error)
      const msg = tokenResponse.error_description || 'Google Sign-In was cancelled'
      setError(msg)
      toast.error(msg)
      setLoading(false)
      return
    }

    if (!tokenResponse.access_token) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('[Google Auth] Exchanging access token with backend...')
      const res = await axios.post('/users/google-auth', {
        accessToken: tokenResponse.access_token,
      })
      console.log('[Google Auth] Successfully authenticated user:', res.data?.user?.email)

      // Raise the context loading flag BEFORE setting user + navigating.
      // React batches this with the setUser() and navigate() calls below, so
      // UserAuth mounts at /home seeing loading=true (spinner) rather than
      // loading=false + user=null (redirect guard). The UserContext useEffect
      // automatically resets loading to false once the user value is committed.
      setContextLoading(true)
      localStorage.setItem('token', res.data.token)
      setUser(res.data.user)
      toast.success('Signed in with Google!')

      const pendingInvite = sessionStorage.getItem('pendingInviteToken')
      if (pendingInvite) {
        sessionStorage.removeItem('pendingInviteToken')
        navigate(`/invite/${pendingInvite}`)
      } else {
        navigate('/home')
      }
    } catch (err) {
      console.error('[Google Auth Error]:', err?.response?.data || err.message)
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
  }

  // ── Load GIS script (idempotent) ──────────────────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    // Check if the script is already loaded
    if (window.google?.accounts?.oauth2) {
      setScriptReady(true)
      return
    }

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

  // ── Initialize OAuth2 Token Client once script is ready ───────────────────
  useEffect(() => {
    if (!scriptReady || !GOOGLE_CLIENT_ID) return
    if (!window.google?.accounts?.oauth2) return
    if (tokenClientRef.current) return // already initialized

    try {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        // Use a stable wrapper that delegates to callbackRef.current
        // This avoids the stale closure issue with React's useCallback
        callback: (response) => callbackRef.current(response),
      })
    } catch (err) {
      console.error('Failed to initialize Google OAuth2 client:', err)
    }
  }, [scriptReady])

  // ── Trigger the Google OAuth2 popup ───────────────────────────────────────
  const triggerGoogleLogin = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google Sign-In is not configured.')
      return
    }

    // Lazy init if ref is not populated yet
    if (!tokenClientRef.current && window.google?.accounts?.oauth2) {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: (response) => callbackRef.current(response),
      })
    }

    if (!tokenClientRef.current) {
      toast.error('Google Sign-In is still loading. Please try again in a moment.')
      return
    }

    setError('')
    // Opens the authentic Google account chooser popup window
    tokenClientRef.current.requestAccessToken({ prompt: 'select_account' })
  }, [])

  return {
    triggerGoogleLogin,
    loading,
    error,
    scriptReady: scriptReady && !!GOOGLE_CLIENT_ID,
  }
}
