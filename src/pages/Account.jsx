/**
 * Account page.
 *
 * Cards:
 *   1. Profile     - read-only view of the authenticated caller's profile.
 *   2. Email       - verification prompt when the address isn't verified.
 *
 * Password changes are handled via the self-service "Forgot password" flow
 * (/forgot-password), so there's no in-page change-password form here.
 * Saved addresses live on their own page (Addresses.jsx, /addresses).
 */
import toast from 'react-hot-toast'
import {
  Mail,
  Loader2, MailWarning,
} from 'lucide-react'

import { useMyProfile, useResendVerification } from '../lib/me'
import './Account.css'

function fullName(profile) {
  const fn = (profile?.firstName || '').trim()
  const ln = (profile?.lastName || '').trim()
  const combined = `${fn} ${ln}`.trim()
  return combined || '-'
}

function initials(profile) {
  const fn = profile?.firstName?.[0] || ''
  const ln = profile?.lastName?.[0] || ''
  const fromName = (fn + ln).toUpperCase()
  if (fromName) return fromName
  const email = profile?.email || ''
  return email.slice(0, 2).toUpperCase() || 'ME'
}

export default function Account() {
  const { data: profile, isLoading, isError, error } = useMyProfile()
  const resendVerify = useResendVerification()

  const handleResendVerification = async () => {
    try {
      await resendVerify.mutateAsync()
      toast.success('Verification email sent. Check your inbox.')
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not send verification email'
      toast.error(msg)
    }
  }

  if (isLoading) {
    return (
      <section className="account stack">
        <div className="account__skeleton">Loading your profile…</div>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="account stack">
        <div className="account__error">
          {error?.response?.data?.message ||
            error?.message ||
            'Could not load profile'}
        </div>
      </section>
    )
  }

  return (
    <section className="account stack">
      {/* ---------- Profile card ---------- */}
      <div className="account-card account-card--profile">
        <div className="account-avatar" aria-hidden="true">
          {initials(profile)}
        </div>
        <div className="account-card__heading">
          <h2 className="account-card__name">{fullName(profile)}</h2>
          <p className="account-card__email">
            <Mail size={14} aria-hidden="true" />
            <span>{profile?.email || '-'}</span>
          </p>
        </div>
      </div>

      {/* ---------- Email verification card (only when NOT verified) ---------- */}
      {!profile?.emailVerified && (
        <div className="account-card">
          <div className="account-card__header account-card__header--simple">
            <MailWarning size={18} aria-hidden="true" />
            <h2 className="account-card__name">Email verification</h2>
            <span
              className="account-badge account-badge--unverified"
              style={{ marginLeft: 'auto' }}
            >
              Not verified
            </span>
          </div>
          <p className="account-card__hint">
            Please verify your email address to place orders. We sent a
            verification link to <strong>{profile?.email}</strong> when you
            signed up &mdash; if you didn&rsquo;t receive it (or it&rsquo;s
            expired), we can send a fresh one.
          </p>
          <div className="account-form__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleResendVerification}
              disabled={resendVerify.isPending}
            >
              {resendVerify.isPending && (
                <Loader2 size={16} className="spin" aria-hidden="true" />
              )}
              Resend verification email
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
