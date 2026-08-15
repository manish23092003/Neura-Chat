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
 * useGoogleAuth — shared hook for Google Sign-In via Google Identity Services.
 *
 * Loads the GIS script once, initializes the Google client, and renders the
 * official Google button directly into `buttonContainerRef` (if provided) or
 * provides `triggerGoogleLogin` for programmatic One Tap.
 *
 * @param {React.RefObject} [buttonContainerRef] - Optional ref to mount the official Google button into
 * @returns {{ triggerGoogleLogin, loading, error, scriptReady }}
 */
export default function useGoogleAuth(buttonContainerRef = null) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scriptReady, setScriptReady] = useState(false)

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

  // ── Handle the Google credential response ─────────────────────────────────
  const handleCredentialResponse = useCallback(
    async (response) => {
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

  // ── Initialize GIS & Render Button ─────────────────────────────────────────
  useEffect(() => {
    if (!scriptReady || !GOOGLE_CLIENT_ID) return
    if (!window.google?.accounts?.id) return

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    })

    // If a button container ref is provided, render the official Google button into it
    if (buttonContainerRef?.current) {
      buttonContainerRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        width: '100%',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      })
    }
  }, [scriptReady, handleCredentialResponse, buttonContainerRef])

  // ── Programmatic Fallback ──────────────────────────────────────────────────
  const triggerGoogleLogin = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google Sign-In is not configured. Please check VITE_GOOGLE_CLIENT_ID.')
      return
    }

    if (!window.google?.accounts?.id) {
      toast.error('Google Sign-In is still loading. Please wait a moment.')
      return
    }

    setError('')

    // Standard prompt
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        const reason = notification.getNotDisplayedReason()
        if (reason === 'opt_out_or_no_session') {
          toast.error('Please make sure you are signed in to Google.')
        } else {
          console.log('Google One Tap not displayed:', reason)
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
