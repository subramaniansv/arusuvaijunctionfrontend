/**
 * AdminLogin - email + password sign-in for staff/admins.
 *
 * Mirrors the Auth page's backend contract but *only* exposes the
 * email/password form (no Google button). This exists so admins can
 * still get in while the public /login page shows Google sign-in only.
 *
 * Backend contract (same as Auth.jsx):
 *   POST /auth?isLogin=true   { email, passwordHash }
 * The backend's `passwordHash` field is the RAW password - the server
 * hashes it. Field name is locked by the existing DTO.
 *
 * After a successful login we send the user to wherever they were
 * headed (location.state.from) or, by default, to the admin console.
 */
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sparkles, Leaf, Shield, Heart } from 'lucide-react'

import { api } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import {
  Button,
  Input,
  PasswordInput,
  Alert,
} from '../components'
import './Auth.css'

export default function AdminLogin() {
  const location = useLocation()
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverErr, setServerErr] = useState(null)
  const [busy, setBusy] = useState(false)

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const finishAuth = (data) => {
    if (!data?.accessToken) throw new Error('auth response missing tokens')
    setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    })
    // Default admins into the console; honour an explicit `from` if present.
    const to = location.state?.from?.pathname || '/admin/products'
    navigate(to, { replace: true })
  }

  const validate = () => {
    const e = {}
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (ev) => {
    ev.preventDefault()
    setServerErr(null)
    if (!validate()) return
    setBusy(true)
    try {
      const res = await api.post(
        '/auth?isLogin=true',
        { email: form.email, passwordHash: form.password },
        { _withAuth: false },
      )
      finishAuth(res.data?.data)
    } catch (e2) {
      const resp = e2.response?.data
      const backendReason =
        resp?.message ||
        (typeof resp?.data === 'string' ? resp.data : null)
      setServerErr(backendReason || e2.message || 'Sign in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      {/* ---------- brand side ---------- */}
      <aside className="auth__brand" aria-hidden="true">
        <div className="auth__brand-inner">
          <span className="auth__logo">Arusuvai Junction</span>
          <h2 className="auth__brand-title">
            Admin console.<br />Sign in to continue.
          </h2>
          <p className="auth__brand-sub">
            Manage products, orders, users and more.
          </p>
          <ul className="auth__perks">
            <li><Leaf size={18} /> Products &amp; inventory</li>
            <li><Shield size={18} /> Secure staff access</li>
            <li><Heart size={18} /> Customer messages</li>
          </ul>
        </div>
        <div className="auth__blob auth__blob--yellow" />
        <div className="auth__blob auth__blob--green" />
      </aside>

      {/* ---------- form side ---------- */}
      <main className="auth__panel">
        <div className="auth__form-wrap">
          <div className="auth__eyebrow">
            <Sparkles size={14} />
            Staff access
          </div>
          <h1 className="auth__title">Admin sign in</h1>
          <p className="auth__sub">Enter your credentials to continue.</p>

          {serverErr && (
            <Alert
              variant="danger"
              title="Couldn't sign in"
              className="auth__alert"
            >
              {serverErr}
            </Alert>
          )}

          <form className="auth__form" onSubmit={onSubmit} noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
              required
            />

            <PasswordInput
              label="Password"
              autoComplete="current-password"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              required
            />

            <Button type="submit" size="lg" fullWidth loading={busy}>
              Sign in
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
