/*
 * Service worker for Arusuvai Junction.
 *
 * Responsibilities:
 *   1. PWA install/offline shell (minimal — just enough to be installable).
 *   2. Web Push: receive the encrypted push, show the OS notification, and
 *      focus/open the right URL when the user taps it.
 *
 * This file is served from the site ROOT (/sw.js) on purpose so its scope
 * covers the whole origin. Do NOT move it into /src or /assets.
 */

const CACHE = 'aj-shell-v1'

// Take control immediately on install/activate so pushes work on first load.
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop old shell caches on version bump.
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

/*
 * PUSH: fired by the browser's push service even when the site/tab is closed
 * (browser process must be alive — on desktop that means Chrome/Edge running
 * in the background; on Android the OS wakes the browser). The payload is the
 * JSON our PushService encrypted.
 */
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'Arusuvai Junction', body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'Arusuvai Junction'
  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.png',
    badge: data.badge || '/favicon.png',
    data: { url: data.url || '/' },
    // Re-alert if a newer notification with the same tag arrives.
    renotify: !!data.tag,
    tag: data.tag || undefined,
    // Keep the notification until the user interacts (good for order updates).
    requireInteraction: false,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

/*
 * CLICK: focus an existing tab on the target URL, or open a new one.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      // Focus a tab already on the target path if we have one.
      for (const client of allClients) {
        const url = new URL(client.url)
        if (url.pathname === new URL(targetUrl, self.location.origin).pathname && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise reuse any open tab and navigate it, else open fresh.
      if (allClients.length > 0 && 'navigate' in allClients[0]) {
        await allClients[0].focus()
        return allClients[0].navigate(targetUrl)
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })()
  )
})
