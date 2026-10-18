import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Design tokens (variables for color / font / spacing / etc.)
import './css/main.css'
import './index.css'

import App from './App.jsx'

// One QueryClient for the whole app. Defaults tuned for an
// e-commerce read-heavy workload: cache product lists for a
// minute, don't refetch on every window focus (annoying), retry
// once on transient network blips.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)

// Register the service worker (PWA install + Web Push). Kept out of the
// React tree so it runs exactly once per page load, after paint.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((e) => {
      console.warn('[pwa] service worker registration failed', e)
    })
  })
}
