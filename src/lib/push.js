/**
 * Web Push + PWA client helper.
 *
 * Flow:
 *   1. Register the service worker (/sw.js) — once per page load.
 *   2. When a LOGGED-IN user opts in, ask Notification permission.
 *   3. Subscribe to PushManager using the backend's VAPID public key.
 *   4. POST the subscription to /api/push/subscribe (JWT-authed), so the
 *      server can push to this device later — even when the tab/browser
 *      is closed.
 *
 * Requirement match:
 *   - "only when logged in": subscribe is JWT-authed; we also unsubscribe
 *     on logout (see authStore wiring note in the guide).
 *   - "online connectivity": push services queue with our TTL=28d and
 *     deliver when the device reconnects.
 */
import { api } from './api'

const SW_URL = '/sw.js'

export function isPushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/** Register the SW. Safe to call repeatedly — returns the active registration. */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register(SW_URL, { scope: '/' })
    await navigator.serviceWorker.ready
    return reg
  } catch (e) {
    console.warn('[push] SW registration failed', e)
    return null
  }
}

/** Fetch the server's VAPID public key (public endpoint). */
async function getVapidPublicKey() {
  const res = await api.get('/api/push/vapidPublicKey')
  const key = res.data?.data?.publicKey
  if (!key) throw new Error('server has no VAPID key configured')
  return key
}

/** base64url string -> Uint8Array (PushManager wants raw bytes). */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

/**
 * Subscribe the current device and send it to the backend.
 * Must be called from a user gesture (click) so the permission prompt is allowed.
 * Returns { ok, reason? }.
 */
export async function enablePush() {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' }

  const reg = await registerServiceWorker()
  if (!reg) return { ok: false, reason: 'sw-failed' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: 'denied' }

  const vapidKey = await getVapidPublicKey()

  // Reuse an existing subscription if present; otherwise create one.
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true, // required by Chrome: every push must show UI
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
  }

  // The PushSubscription serialises to { endpoint, keys: { p256dh, auth } }.
  const payload = sub.toJSON()
  await api.post('/api/push/subscribe', {
    endpoint: payload.endpoint,
    keys: payload.keys,
  })

  return { ok: true }
}

/** Unsubscribe this device locally and tell the backend to forget it. */
export async function disablePush() {
  if (!('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  const endpoint = sub.endpoint
  try {
    await sub.unsubscribe()
  } catch {
    /* ignore */
  }
  try {
    await api.post('/api/push/unsubscribe', { endpoint })
  } catch {
    /* best-effort — the server also prunes dead endpoints on 404/410 */
  }
}

/** Current permission + subscription status, for rendering a toggle. */
export async function getPushStatus() {
  if (!isPushSupported()) return { supported: false, permission: 'unsupported', subscribed: false }
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = reg ? await reg.pushManager.getSubscription() : null
  return {
    supported: true,
    permission: Notification.permission, // 'default' | 'granted' | 'denied'
    subscribed: !!sub,
  }
}
