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
 * Google account chooser popup (`accounts.google.com/o/oauth2/v2/auth`).
 * Sends the verified access token to POST /users/google-auth.
 *
 * @returns {{ triggerGoogleLogin, loading, error, scriptReady }}
 */
export default function useGoogleAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scriptReady, setScriptReady] = useState(false)
  const tokenClientRef = useRef(null)

  const { setUser } = useContext(UserContext)
  const navigate = useNavigate()

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

  // ── Handle Token Response from Google OAuth2 Popup ────────────────────────
  const handleTokenResponse = useCallback(
    async (tokenResponse) => {
      if (tokenResponse.error) {
        console.error('Google OAuth error:', tokenResponse.error)
        setError(tokenResponse.error_description || 'Google Sign-In was cancelled')
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
        const res = await axios.post('/users/google-auth', {
          accessToken: tokenResponse.access_token,
        })

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
    },
    [setUser, navigate]
  )

  // ── Initialize OAuth2 Token Client once script is ready ───────────────────
  useEffect(() => {
    if (!scriptReady || !GOOGLE_CLIENT_ID) return
    if (!window.google?.accounts?.oauth2) return

    try {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: handleTokenResponse,
      })
    } catch (err) {
      console.error('Failed to initialize Google OAuth2 client:', err)
    }
  }, [scriptReady, handleTokenResponse])

  // ── Trigger the Google OAuth2 popup ───────────────────────────────────────
  const triggerGoogleLogin = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google Sign-In is not configured. Please check VITE_GOOGLE_CLIENT_ID.')
      return
    }

    // Lazy init if ref is not populated yet
    if (!tokenClientRef.current && window.google?.accounts?.oauth2) {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: handleTokenResponse,
      })
    }

    if (!tokenClientRef.current) {
      toast.error('Google Sign-In is still loading. Please try again in a moment.')
      return
    }

    setError('')
    // Opens the authentic Google account chooser popup window
    tokenClientRef.current.requestAccessToken({ prompt: 'select_account' })
  }, [handleTokenResponse])

  return {
    triggerGoogleLogin,
    loading,
    error,
    scriptReady: scriptReady && !!GOOGLE_CLIENT_ID,
  }
}
