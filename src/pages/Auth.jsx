/**
 * Auth — customer login page.
 *
 * Google sign-in only. Email / password and register flows are removed
 * for customers; admin staff use /admin/login (email + password).
 *
 * Backend contract:
 *   POST /auth?isGoogle=true  { credential }  → { accessToken, refreshToken }
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Sparkles, Leaf, Shield, Heart } from 'lucide-react'

import { api } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import { Alert } from '../components'
import './Auth.css'

export default function Auth() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)

  const [serverErr, setServerErr] = useState(null)
  const [busy,      setBusy]      = useState(false)

  // Google Identity Services client id (Vercel/.env: VITE_GOOGLE_CLIENT_ID).
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const googleBtnRef = useRef(null)
  const googleCbRef  = useRef(null)

  // Shared success handler — store tokens and go to the intended page.
  const finishAuth = (data) => {
    if (!data?.accessToken) throw new Error('auth response missing tokens')
    setTokens({
      accessToken:  data.accessToken,
      refreshToken: data.refreshToken,
    })
    const to = location.state?.from?.pathname || '/'
    navigate(to, { replace: true })
  }

  // Called by GIS with the Google ID token.
  const onGoogleCredential = async (resp) => {
    setServerErr(null)
    setBusy(true)
    try {
      const res = await api.post(
        '/auth?isGoogle=true',
        { credential: resp.credential },
        { _withAuth: false },
      )
      finishAuth(res.data?.data)
    } catch (e2) {
      const r = e2.response?.data
      setServerErr(
        r?.message ||
          (typeof r?.data === 'string' ? r.data : null) ||
          e2.message ||
          'Google sign-in failed',
      )
    } finally {
      setBusy(false)
    }
  }
  googleCbRef.current = onGoogleCredential

  // Load the GIS script once and render the official Google button.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined
    const SRC = 'https://accounts.google.com/gsi/client'
    let cancelled = false

    const init = () => {
      if (cancelled || !window.google?.accounts?.id || !googleBtnRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp) => googleCbRef.current?.(resp),
      })
      googleBtnRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type:           'standard',
        theme:          'outline',
        size:           'large',
        text:           'continue_with',
        shape:          'pill',
        logo_alignment: 'left',
        width:           320,
      })
    }

    const existing = document.querySelector(`script[src="${SRC}"]`)
    if (existing) {
      if (window.google?.accounts?.id) init()
      else existing.addEventListener('load', init)
    } else {
      const s    = document.createElement('script')
      s.src      = SRC
      s.async    = true
      s.defer    = true
      s.onload   = init
      document.head.appendChild(s)
    }
    return () => { cancelled = true }
  }, [GOOGLE_CLIENT_ID])

  return (
    <div className="auth">
      {/* ---------- brand side ---------- */}
      <aside className="auth__brand" aria-hidden="true">
        <div className="auth__brand-inner">
          <Link to="/" className="auth__logo">
            Arusuvai Junction
          </Link>
          <h2 className="auth__brand-title">
            Homemade Tamil snacks,<br />delivered fresh.
          </h2>
          <p className="auth__brand-sub">
            Sign in to track orders, save favourites, and check out faster.
          </p>
          <ul className="auth__perks">
            <li><Leaf size={18} /> 100% homemade, no preservatives</li>
            <li><Shield size={18} /> Secure checkout</li>
            <li><Heart size={18} /> Loved by 10k+ customers</li>
          </ul>
        </div>
        <div className="auth__blob auth__blob--yellow" />
        <div className="auth__blob auth__blob--green" />
      </aside>

      {/* ---------- sign-in side ---------- */}
      <main className="auth__panel">
        <div className="auth__form-wrap">
          <div className="auth__eyebrow">
            <Sparkles size={14} />
            Welcome back
          </div>

          <h1 className="auth__title">Sign in to your account</h1>
          <p className="auth__sub">
            Use your Google account to continue — no password needed.
          </p>

          {serverErr && (
            <Alert variant="danger" title="Couldn't sign in" className="auth__alert">
              {serverErr}
            </Alert>
          )}

          {/* Google Identity Services button */}
          {GOOGLE_CLIENT_ID ? (
            <div
              className="auth__google"
              ref={googleBtnRef}
              aria-label="Continue with Google"
            />
          ) : (
            <p className="auth__sub" style={{ color: 'var(--color-danger)' }}>
              Google sign-in is not configured. Please contact support.
            </p>
          )}

          {busy && (
            <p className="auth__sub" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              Signing you in…
            </p>
          )}

          <p className="auth__swap" style={{ marginTop: 'var(--space-6)' }}>
            <Shield size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            We never store your password. Authentication is handled securely by Google.
          </p>
        </div>
      </main>
    </div>
  )
}
