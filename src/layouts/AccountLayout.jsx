/* ------------------------------------------------------------------
 * AccountLayout - wraps the signed-in account pages (Profile, Saved
 * Address, Orders, Wishlist) with an in-page tab strip (mirroring the
 * Admin console) instead of a sidebar. Each page renders unchanged in
 * the Outlet. The tab strip scrolls horizontally on small screens.
 * ------------------------------------------------------------------ */
import { NavLink, Outlet } from 'react-router-dom'
import { User, MapPin, Package, Heart } from 'lucide-react'
import { Container } from '../components'
import './AccountLayout.css'

const TABS = [
  { to: '/account', label: 'Profile', icon: User, end: true },
  { to: '/addresses', label: 'Address', icon: MapPin, end: true },
  { to: '/orders', label: 'Orders', icon: Package, end: false },
  { to: '/wishlist', label: 'Wishlist', icon: Heart, end: true },
]

export default function AccountLayout() {
  return (
    <div className="account-area">
      <Container size="xl">
        <header className="account-area__head">
          <h1 className="account-area__title">My Account</h1>
          <p className="account-area__subtitle">
            Manage your profile, saved addresses and orders.
          </p>
        </header>

        <nav className="account-area__tabs" aria-label="Account sections">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                'account-area__tab' + (isActive ? ' is-active' : '')
              }
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <section className="account-area__panel">
          <Outlet />
        </section>
      </Container>
    </div>
  )
}
