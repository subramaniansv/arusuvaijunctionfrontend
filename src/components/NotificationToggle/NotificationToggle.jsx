/**
 * A self-contained opt-in control for Web Push notifications.
 *
 * Drop it anywhere inside an authenticated area (e.g. the Account page).
 * It:
 *   - hides itself on browsers that don't support push,
 *   - shows the current state (off / on / blocked),
 *   - subscribes on click (triggers the permission prompt from a gesture),
 *   - lets the user turn it back off.
 *
 * Only a logged-in user can get here (it's rendered on protected pages) and
 * the subscribe call is JWT-authed, so this matches the "logged-in only"
 * requirement exactly.
 */
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Bell, BellOff, BellRing } from 'lucide-react'
import {
  isPushSupported,
  getPushStatus,
  enablePush,
  disablePush,
} from '../../lib/push'

export default function NotificationToggle() {
  const [status, setStatus] = useState({ supported: true, permission: 'default', subscribed: false })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    getPushStatus().then((s) => alive && setStatus(s))
    return () => {
      alive = false
    }
  }, [])

  if (!isPushSupported() || !status.supported) return null

  const blocked = status.permission === 'denied'

  async function handleEnable() {
    setBusy(true)
    try {
      const res = await enablePush()
      if (res.ok) {
        toast.success('Notifications on — we\u2019ll ping you about your orders')
        setStatus(await getPushStatus())
      } else if (res.reason === 'denied') {
        toast.error('Notifications blocked. Enable them in your browser settings.')
        setStatus(await getPushStatus())
      } else if (res.reason === 'unsupported') {
        toast.error('This browser doesn\u2019t support notifications')
      } else {
        toast.error('Could not enable notifications')
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Could not enable notifications')
    } finally {
      setBusy(false)
    }
  }

  async function handleDisable() {
    setBusy(true)
    try {
      await disablePush()
      toast.success('Notifications turned off')
      setStatus(await getPushStatus())
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="notif-toggle" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {status.subscribed ? (
        <>
          <BellRing size={18} aria-hidden />
          <span>Order notifications are on</span>
          <button type="button" onClick={handleDisable} disabled={busy} className="btn btn--ghost">
            <BellOff size={16} /> Turn off
          </button>
        </>
      ) : blocked ? (
        <>
          <BellOff size={18} aria-hidden />
          <span>Notifications are blocked in your browser settings</span>
        </>
      ) : (
        <>
          <Bell size={18} aria-hidden />
          <span>Get notified about your orders</span>
          <button type="button" onClick={handleEnable} disabled={busy} className="btn btn--primary">
            {busy ? 'Enabling…' : 'Enable'}
          </button>
        </>
      )}
    </div>
  )
}
