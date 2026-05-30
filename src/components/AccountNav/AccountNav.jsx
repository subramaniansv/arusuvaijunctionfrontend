/* ------------------------------------------------------------------
 * AccountNav - shared sidebar for the signed-in "account area" pages.
 * Grouped, plain-row navigation (matching the Figma reference): a bold
 * "My Account" title, then labelled groups of links. The active link is
 * filled solid green.
 *
 * Sticky on desktop; collapses to a horizontal scrolling pill strip on
 * mobile.
 * ------------------------------------------------------------------ */
import { NavLink } from 'react-router-dom'
import { Package, Heart, PhoneCall, User, MapPin, X } from 'lucide-react'
import './AccountNav.css'

const GROUPS = [
  {
    title: 'Orders & Favorites',
    links: [
      { to: '/orders', label: 'Orders', icon: Package, end: false },
      { to: '/wishlist', label: 'Wishlist', icon: Heart, end: true },
      { to: '/contact', label: 'Contact us', icon: PhoneCall, end: true },
    ],
  },
  {
    title: 'Profile',
    links: [
      { to: '/account', label: 'Personal Information', icon: User, end: true },
      { to: '/addresses', label: 'Saved Address', icon: MapPin, end: true },
    ],
  },
]

export default function AccountNav({ open = false, onClose }) {
  return (
    <aside
      className={`account-nav${open ? ' is-open' : ''}`}
      aria-label="Account"
    >
      <div className="account-nav__head">
        <p className="account-nav__title">My Account</p>
        <button
          type="button"
          className="account-nav__close"
          onClick={onClose}
          aria-label="Close account menu"
        >
          <X size={18} aria-hidden="true" focusable="false" />
        </button>
      </div>

      {GROUPS.map((group) => (
        <div key={group.title} className="account-nav__group">
          <p className="account-nav__group-title">{group.title}</p>
          <nav className="account-nav__list" aria-label={group.title}>
            {group.links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onClose}
                className={({ isActive }) =>
                  `account-nav__item${isActive ? ' is-active' : ''}`
                }
              >
                <Icon
                  size={17}
                  aria-hidden="true"
                  className="account-nav__icon"
                />
                <span className="account-nav__label">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      ))}
    </aside>
  )
}
