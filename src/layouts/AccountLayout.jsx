/* ------------------------------------------------------------------
 * AccountLayout - wraps the signed-in account pages (Profile, Saved
 * Address, Orders, Wishlist, Loyalty).
 *
 * Desktop: an in-page horizontal tab strip (mirroring the Admin
 * console). Mobile: a hamburger button opens an off-canvas drawer with
 * the same sections, so the growing list of tabs stays reachable
 * without overflowing the row. Each page renders unchanged in the
 * Outlet.
 * ------------------------------------------------------------------ */
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { User, MapPin, Package, Heart, /* Stamp, */ Menu, X } from 'lucide-react' // Stamp unused while Loyalty is disabled
import { Container } from '../components'
import './AccountLayout.css'

const TABS = [
  { to: '/account', label: 'Profile', icon: User, end: true },
  { to: '/addresses', label: 'Address', icon: MapPin, end: true },
  { to: '/orders', label: 'Orders', icon: Package, end: false },
  // { to: '/loyalty', label: 'Loyalty', icon: Stamp, end: true }, // temporarily disabled
  { to: '/wishlist', label: 'Wishlist', icon: Heart, end: true },
]

export default function AccountLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  // Label shown next to the hamburger = the active section's label.
  const activeTab =
    TABS.find((t) => (t.end ? pathname === t.to : pathname.startsWith(t.to))) ||
    TABS[0]

  // Close on ESC + lock body scroll while the drawer is open.
  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  return (
    <div className="account-area">
      <Container size="xl">
        {/* Mobile-only hamburger: opens the sections drawer. */}
        <button
          type="button"
          className="account-area__menu-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Open account menu"
          aria-expanded={menuOpen}
          aria-controls="account-tabs-drawer"
        >
          <Menu size={18} aria-hidden="true" focusable="false" />
          <span>{activeTab.label}</span>
        </button>

        {/* Desktop tab strip + mobile off-canvas drawer share this nav. */}
        <nav
          id="account-tabs-drawer"
          className={`account-area__tabs${menuOpen ? ' is-open' : ''}`}
          aria-label="Account sections"
        >
          <div className="account-area__tabs-head">
            <p className="account-area__tabs-title">My Account</p>
            <button
              type="button"
              className="account-area__tabs-close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close account menu"
            >
              <X size={18} aria-hidden="true" focusable="false" />
            </button>
          </div>

          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                'account-area__tab' + (isActive ? ' is-active' : '')
              }
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Dimmed backdrop behind the open mobile drawer. */}
        {menuOpen && (
          <button
            type="button"
            className="account-area__backdrop"
            aria-label="Close account menu"
            onClick={() => setMenuOpen(false)}
          />
        )}

        <section className="account-area__panel">
          <Outlet />
        </section>
      </Container>
    </div>
  )
}
