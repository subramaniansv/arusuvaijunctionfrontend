/**
 * ResetPassword - set a new password using the token from the emailed link.
 *
 * The backend builds links as: APP_HOME_URL/reset-password?token=<raw>
 * We read `token` from the query string and POST it together with the
 * new password to /api/password-reset/confirm. No old password is
 * required - possession of a valid, single-use token proves identity.
 *
 * Reuses the Auth.css two-column layout for visual consistency.
 */
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, Leaf, Shield, Heart, CheckCircle2 } from 'lucide-react'

import { useConfirmPasswordReset } from '../lib/auth'
import { Button, PasswordInput, Alert } from '../components'
import './Auth.css'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = useMemo(() => params.get('token') || '', [params])

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [serverErr, setServerErr] = useState(null)
  const [done, setDone] = useState(false)
  const { mutateAsync, isPending } = useConfirmPasswordReset()

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6)
      e.password = 'Password must be at least 6 characters'
    if (form.confirm !== form.password)
      e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (ev) => {
    ev.preventDefault()
    setServerErr(null)
    if (!validate()) return
    try {
      await mutateAsync({ token, newPassword: form.password })
      setDone(true)
      // Send the user to sign in after a short beat.
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (e2) {
      setServerErr(
        e2.response?.data?.message ||
          e2.message ||
          'Could not reset your password. The link may have expired.',
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
            Almost there.<br />Set a new password.
          </h2>
          <p className="auth__brand-sub">
            Choose a strong password you don&apos;t use anywhere else.
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
            New password
          </div>

          {done ? (
            <>
              <h1 className="auth__title">Password updated</h1>
              <p className="auth__sub">
                Your password has been reset. Redirecting you to sign in...
              </p>
              <Alert variant="success" className="auth__alert">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={18} /> You can now sign in with your new password
                </span>
              </Alert>
              <p className="auth__swap">
                <Link to="/login">Go to sign in</Link>
              </p>
            </>
          ) : !token ? (
            <>
              <h1 className="auth__title">Invalid reset link</h1>
              <p className="auth__sub">
                This link is missing its security token. Request a fresh one
                to continue.
              </p>
              <Alert variant="danger" title="Link is incomplete" className="auth__alert">
                The reset link is invalid or incomplete.
              </Alert>
              <p className="auth__swap">
                <Link to="/forgot-password">Request a new link</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="auth__title">Set a new password</h1>
              <p className="auth__sub">
                Enter and confirm your new password below.
              </p>

              {serverErr && (
                <Alert
                  variant="danger"
                  title="Couldn't reset password"
                  className="auth__alert"
                >
                  {serverErr}
                </Alert>
              )}

              <form className="auth__form" onSubmit={onSubmit} noValidate>
                <PasswordInput
                  label="New password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                  error={errors.password}
                  required
                />
                <PasswordInput
                  label="Confirm new password"
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  error={errors.confirm}
                  required
                />
                <Button type="submit" size="lg" fullWidth loading={isPending}>
                  Reset password
                </Button>
              </form>

              <p className="auth__swap">
                <Link to="/login">Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
