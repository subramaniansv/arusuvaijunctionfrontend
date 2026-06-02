/**
 * ForgotPassword - request a password reset link by email.
 *
 * POST /api/password-reset { email }
 * The backend always returns a generic success (it never reveals
 * whether the email is registered), so on success we show the same
 * "check your inbox" message regardless.
 *
 * Reuses the Auth.css two-column layout for visual consistency with
 * the sign-in / sign-up screens.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Leaf, Shield, Heart, MailCheck } from 'lucide-react'

import { useRequestPasswordReset } from '../lib/auth'
import { Button, Input, Alert } from '../components'
import './Auth.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)
  const { mutateAsync, isPending } = useRequestPasswordReset()

  const onSubmit = async (ev) => {
    ev.preventDefault()
    setError(null)
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email')
      return
    }
    try {
      await mutateAsync({ email: email.trim() })
      setSent(true)
    } catch (e) {
      setError(
        e.response?.data?.message ||
          e.message ||
          'Could not send the reset link. Please try again.',
      )
    }
  }

  return (
    <div className="auth">
      {/* ---------- brand side ---------- */}
      <aside className="auth__brand" aria-hidden="true">
        <div className="auth__brand-inner">
          <Link to="/" className="auth__logo">
            Arusuvai Junction
          </Link>
          <h2 className="auth__brand-title">
            Forgot your password?<br />We&apos;ve got you.
          </h2>
          <p className="auth__brand-sub">
            Enter your email and we&apos;ll send you a secure link to set a
            new password.
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

      {/* ---------- form side ---------- */}
      <main className="auth__panel">
        <div className="auth__form-wrap">
          <div className="auth__eyebrow">
            <Sparkles size={14} />
            Reset password
          </div>

          {sent ? (
            <>
              <h1 className="auth__title">Check your inbox</h1>
              <p className="auth__sub">
                If an account exists for <strong>{email.trim()}</strong>,
                we&apos;ve sent a link to reset your password. The link is
                valid for 30 minutes.
              </p>
              <Alert variant="success" className="auth__alert">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <MailCheck size={18} /> Reset link sent
                </span>
              </Alert>
              <p className="auth__swap">
                Didn&apos;t get it? Check your spam folder or{' '}
                <a
                  href="#retry"
                  onClick={(e) => {
                    e.preventDefault()
                    setSent(false)
                  }}
                >
                  try again
                </a>
                .
              </p>
              <p className="auth__swap">
                <Link to="/login">Back to sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="auth__title">Reset your password</h1>
              <p className="auth__sub">
                Enter the email associated with your account.
              </p>

              {error && (
                <Alert
                  variant="danger"
                  title="Couldn't send reset link"
                  className="auth__alert"
                >
                  {error}
                </Alert>
              )}

              <form className="auth__form" onSubmit={onSubmit} noValidate>
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" size="lg" fullWidth loading={isPending}>
                  Send reset link
                </Button>
              </form>

              <p className="auth__swap">
                Remembered it? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
