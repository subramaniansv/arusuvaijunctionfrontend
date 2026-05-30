/* ------------------------------------------------------------------
 * AccountLayout - wraps the signed-in account pages (Profile, Orders,
 * Order detail, Wishlist, Cart) with a shared sidebar nav so users can
 * move between them easily. Each page renders unchanged in the Outlet.
 *
 * On mobile the sidebar collapses into an off-canvas drawer (like the
 * Products filter): a hamburger button slides it in from the left, with
 * a dimmed backdrop. On desktop it is a static sticky column.
 * ------------------------------------------------------------------ */
import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import AccountNav from '../components/AccountNav/AccountNav'
import '../components/AccountNav/AccountNav.css'

export default function AccountLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!navOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [navOpen])

  return (
    <div className="account-shell">
      <AccountNav open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="account-shell__main">
        <button
          type="button"
          className="account-shell__menu-btn"
          onClick={() => setNavOpen(true)}
          aria-label="Open account menu"
          aria-expanded={navOpen}
        >
          <Menu size={18} aria-hidden="true" />
          <span>My Account</span>
        </button>

        <Outlet />
      </div>

      {navOpen && (
        <div
          className="account-shell__backdrop"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
