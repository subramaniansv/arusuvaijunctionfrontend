/**
 * Root shell: top nav + outlet.
 *
 * Layout
 * ------
 *   Desktop (>= 960px):
 *     [logo] [search] [Products] [Wishlist] [Orders] [Account] [Admin] [Cart] [Logout]
 *     Each nav item is icon + label.
 *
 *   Tablet / mobile (< 960px):
 *     [hamburger] [logo] ............................. [search] [cart]
 *     The full menu collapses into a slide-in drawer (YouTube-mobile style)
 *     opened by the hamburger; search becomes a toggle that reveals an
 *     inline row below the bar.
 */
import { useEffect, useRef, useState } from 'react'
import {
  Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams,
} from 'react-router-dom'
import {
  Search, ShoppingBag, ShoppingCart, LayoutDashboard,
  LogOut, LogIn, X, UserCircle, Heart, Menu, MailWarning, Loader2,
  Home,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Arusuvaijunction from '../assets/ArusuvaiJunction.png'
import { useAuthStore } from '../stores/authStore'
import { useCartItemCount } from '../lib/cart'
import { useMyProfile, useResendVerification } from '../lib/me'
import Avatar from '../components/Avatar/Avatar.jsx'
import SiteFooter from '../components/SiteFooter/SiteFooter.jsx'
import './RootLayout.css'

export default function RootLayout() {
  const user = useAuthStore((s) => s.user)
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  const clear = useAuthStore((s) => s.clear)
  const cartCount = useCartItemCount()
  // Profile is loaded only when signed in - drives the unverified-email
  // CTA in the navbar. Failures fail silently (the CTA simply won't show).
  const { data: profile } = useMyProfile()
  const resendVerify = useResendVerification()
  const navigate = useNavigate()
  const location = useLocation()

  const path = location.pathname
  const isAuth = path === '/login' || path === '/register'
  const isBare = path === '/' || isAuth
  const isSearchPage = path === '/search'

  // Global page heading shown on every page except Home / auth.
  const pageTitle = getPageTitle(path)

  // ---- search state ----
  // The header field mirrors the URL query whenever we're on a page
  // that reads it (the dedicated search page or the catalogue).
  const onSearchPage = path === '/search' || path === '/products'
  const [urlParams] = useSearchParams()
  const [query, setQuery] = useState(onSearchPage ? (urlParams.get('q') || '') : '')
  useEffect(() => {
    if (onSearchPage) setQuery(urlParams.get('q') || '')
  }, [onSearchPage, urlParams])

  // ---- mobile UI state ----
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef(null)

  // close drawer on route change
  useEffect(() => { setDrawerOpen(false); setAccountMenuOpen(false) }, [path])

  // click-away + ESC to close account dropdown
  useEffect(() => {
    if (!accountMenuOpen) return undefined
    const onDown = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setAccountMenuOpen(false)
      }
    }
    const onKey = (e) => { if (e.key === 'Escape') setAccountMenuOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [accountMenuOpen])

  // close drawer on ESC + lock body scroll while open
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [drawerOpen])

  const submitSearch = (e) => {
    e?.preventDefault()
    const q = query.trim()
    const target = q ? `/search?q=${encodeURIComponent(q)}` : '/search'
    navigate(target)
  }

  const onLogout = () => {
    clear()
    setDrawerOpen(false)
    navigate('/login', { replace: true })
  }

  const isAdmin = user?.roles?.includes('admin')
  const needsVerify = isAuthed && profile && profile.emailVerified === false

  const handleResendVerify = async (closeDrawer) => {
    closeDrawer?.()
    try {
      await resendVerify.mutateAsync()
      toast.success('Verification email sent. Check your inbox.')
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        'Could not send verification email',
      )
    }
  }

  /* Shared nav items - rendered both in the desktop cluster and inside
     the mobile drawer.  When closeDrawer is provided, it's called on click. */
  const renderNavItems = (closeDrawer) => (
    <>
      <NavLink
        to="/"
        end
        className={({ isActive }) => `nav__item${isActive ? ' is-active' : ''}`}
        onClick={closeDrawer}
      >
        <Home size={20} aria-hidden="true" />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/products"
        end
        className={({ isActive }) => `nav__item${isActive ? ' is-active' : ''}`}
        onClick={closeDrawer}
      >
        <ShoppingBag size={20} aria-hidden="true" />
        <span>Products</span>
      </NavLink>

      {isAuthed && (
        <NavLink
          to="/wishlist"
          className={({ isActive }) => `nav__item${isActive ? ' is-active' : ''}`}
          onClick={closeDrawer}
        >
          <Heart size={20} aria-hidden="true" />
          <span>Wishlist</span>
        </NavLink>
      )}

      {needsVerify && (
        <button
          type="button"
          className="nav__item nav__item--verify"
          onClick={() => handleResendVerify(closeDrawer)}
          disabled={resendVerify.isPending}
          title={`Resend verification email to ${profile?.email || 'your inbox'}`}
        >
          {resendVerify.isPending
            ? <Loader2 size={18} className="spin" aria-hidden="true" />
            : <MailWarning size={18} aria-hidden="true" />}
          <span>Verify email</span>
        </button>
      )}

      {isAuthed && (
        <NavLink
          to="/account"
          className={({ isActive }) => `nav__item${isActive ? ' is-active' : ''}`}
          onClick={closeDrawer}
        >
          <UserCircle size={20} aria-hidden="true" />
          <span>Account</span>
        </NavLink>
      )}

      {isAdmin && (
        <NavLink
          to="/admin"
          className={({ isActive }) => `nav__item${isActive ? ' is-active' : ''}`}
          onClick={closeDrawer}
        >
          <LayoutDashboard size={20} aria-hidden="true" />
          <span>Admin</span>
        </NavLink>
      )}

      {isAuthed ? (
        <button
          type="button"
          className="nav__item nav__item--btn"
          onClick={() => { closeDrawer?.(); onLogout() }}
        >
          <LogOut size={20} aria-hidden="true" />
          <span>Logout</span>
        </button>
      ) : (
        <Link
          to="/login"
          className="nav__item nav__item--cta"
          onClick={closeDrawer}
        >
          <LogIn size={18} aria-hidden="true" />
          <span>Login</span>
        </Link>
      )}
    </>
  )

  return (
    <>
      {!isAuth && (
        <header className="nav">
          <div className="nav__inner container">
            {/* hamburger - visible only below desktop breakpoint */}
            <button
              type="button"
              className="nav__icon nav__hamburger"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              aria-controls="nav-drawer"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={22} aria-hidden="true" />
            </button>

            {/* logo */}
            <Link to="/" className="nav__logo" aria-label="Arusuvai Junction home">
              <span className="nav__logo-mark" aria-hidden="true"><img src={Arusuvaijunction} alt="Arusuvai Junction logo" /></span>
              <span className="nav__logo-text">
                <span className="nav__logo-en">Arusuvai Junction</span>
                <span className="nav__logo-ta" lang="ta">அறுசுவை ஜங்ஷன்</span>
              </span>
            </Link>

            {/* inline search (collapses below 720px to mobile toggle).
                Hidden on the dedicated search page where the page itself
                renders the field. */}
            {!isSearchPage && (
              <form
                className="nav__search"
                role="search"
                onSubmit={submitSearch}
                aria-label="Search products"
              >
                <Search size={16} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search murukku, sweets, mixture..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search products"
                />
                {query && (
                  <button
                    type="button"
                    className="nav__search-clear"
                    aria-label="Clear search"
                    onClick={() => setQuery('')}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </form>
            )}

            {/* desktop nav cluster (>= 960px):
                 Products + Cart + Avatar dropdown. Everything else
                 (Wishlist, Orders, Account, Admin, Verify, Logout)
                 lives inside the avatar menu to keep the bar tidy. */}
            <nav className="nav__cluster" aria-label="Primary">
              <NavLink
                to="/"
                end
                className={({ isActive }) => `nav__item${isActive ? ' is-active' : ''}`}
              >
                <Home size={20} aria-hidden="true" />
                <span>Home</span>
              </NavLink>

              <NavLink
                to="/products"
                end
                className={({ isActive }) => `nav__item${isActive ? ' is-active' : ''}`}
              >
                <ShoppingBag size={20} aria-hidden="true" />
                <span>Products</span>
              </NavLink>

              <NavLink
                to="/cart"
                className={({ isActive }) => `nav__item nav__item--cart${isActive ? ' is-active' : ''}`}
                aria-label={
                  isAuthed && cartCount > 0
                    ? `Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`
                    : 'Cart'
                }
              >
                <span className="nav__item-icon">
                  <ShoppingCart size={20} aria-hidden="true" />
                  {isAuthed && cartCount > 0 && (
                    <span className="nav__badge" aria-hidden="true">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </span>
                <span>Cart</span>
              </NavLink>

              {isAuthed ? (
                <div className="nav__account" ref={accountMenuRef}>
                  <button
                    type="button"
                    className="nav__avatar-btn"
                    aria-haspopup="menu"
                    aria-expanded={accountMenuOpen}
                    aria-label="Account menu"
                    onClick={() => setAccountMenuOpen((v) => !v)}
                  >
                    <Avatar
                      name={user?.firstName || user?.email || 'User'}
                      size="sm"
                    />
                  </button>

                  {accountMenuOpen && (
                    <div
                      className="nav__menu"
                      role="menu"
                      aria-label="Account"
                    >
                      {user && user.email && (
                        <div className="nav__menu-head">
                          <div className="nav__menu-email">{user.email}</div>
                        </div>
                      )}

                      <NavLink
                        to="/account"
                        className="nav__menu-item"
                        role="menuitem"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <UserCircle size={18} aria-hidden="true" />
                        <span>User profile</span>
                      </NavLink>

                      <NavLink
                        to="/wishlist"
                        className="nav__menu-item"
                        role="menuitem"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <Heart size={18} aria-hidden="true" />
                        <span>Wishlist</span>
                      </NavLink>

                      <NavLink
                        to="/orders"
                        className="nav__menu-item"
                        role="menuitem"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <ShoppingBag size={18} aria-hidden="true" />
                        <span>Orders</span>
                      </NavLink>

                      <NavLink
                        to="/cart"
                        className="nav__menu-item"
                        role="menuitem"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <ShoppingCart size={18} aria-hidden="true" />
                        <span>Cart</span>
                      </NavLink>

                      {isAdmin && (
                        <NavLink
                          to="/admin"
                          className="nav__menu-item"
                          role="menuitem"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <LayoutDashboard size={18} aria-hidden="true" />
                          <span>Admin</span>
                        </NavLink>
                      )}

                      {needsVerify && (
                        <button
                          type="button"
                          className="nav__menu-item nav__menu-item--verify"
                          role="menuitem"
                          onClick={() => handleResendVerify(() => setAccountMenuOpen(false))}
                          disabled={resendVerify.isPending}
                        >
                          {resendVerify.isPending
                            ? <Loader2 size={16} className="spin" aria-hidden="true" />
                            : <MailWarning size={16} aria-hidden="true" />}
                          <span>Verify email</span>
                        </button>
                      )}

                      <div className="nav__menu-sep" role="separator" />

                      <button
                        type="button"
                        className="nav__menu-item"
                        role="menuitem"
                        onClick={() => { setAccountMenuOpen(false); onLogout() }}
                      >
                        <LogOut size={18} aria-hidden="true" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="nav__item nav__item--cta">
                  <LogIn size={18} aria-hidden="true" />
                  <span>Login</span>
                </Link>
              )}
            </nav>

            {/* mobile right-side cluster: search link + cart */}
            <div className="nav__cluster-mobile">
              <NavLink
                to="/search"
                className={({ isActive }) =>
                  `nav__icon${isActive ? ' is-active' : ''}`
                }
                aria-label="Search"
              >
                <Search size={20} aria-hidden="true" />
              </NavLink>

              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `nav__icon${isActive ? ' is-active' : ''}`
                }
                aria-label={
                  isAuthed && cartCount > 0
                    ? `Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`
                    : 'Cart'
                }
              >
                <ShoppingCart size={20} aria-hidden="true" />
                {isAuthed && cartCount > 0 && (
                  <span className="nav__badge" aria-hidden="true">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </NavLink>
            </div>
          </div>
        </header>
      )}

      {/* slide-in drawer (mobile / tablet) */}
      {!isAuth && (
        <>
          <div
            className={`nav__backdrop${drawerOpen ? ' is-open' : ''}`}
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            id="nav-drawer"
            className={`nav__drawer${drawerOpen ? ' is-open' : ''}`}
            aria-label="Menu"
            aria-hidden={!drawerOpen}
          >
            <div className="nav__drawer-head">
              <Link
                to="/"
                className="nav__logo"
                onClick={() => setDrawerOpen(false)}
              >
                <span className="nav__logo-mark" aria-hidden="true">A</span>
                <span>Arusuvai Junction</span>
              </Link>
              <button
                type="button"
                className="nav__icon"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {isAuthed && user && user.email && (
              <div className="nav__drawer-user">
                <UserCircle size={28} aria-hidden="true" />
                <div className="nav__drawer-user-email">{user.email}</div>
              </div>
            )}

            <nav className="nav__drawer-list" aria-label="Primary">
              {renderNavItems(() => setDrawerOpen(false))}
            </nav>
          </aside>
        </>
      )}

      <main
        className={isBare ? undefined : 'container page-main'}
      >
        {!isBare && pageTitle && (
          <div className="page-head">
            <h1 className="page-heading">{pageTitle}</h1>
          </div>
        )}
        <Outlet />
      </main>

      {!isAuth && <SiteFooter />}
    </>
  )
}

/* Map a route pathname to a human page heading. Pages are added here
 * as we converge each screen onto the unified heading (and remove that
 * page's old inline title). Returns null for home/auth and any screen
 * not yet converted. */
const PAGE_TITLES = {
  '/products': 'Products',
  '/cart': 'My Cart',
  '/account': 'User profile',
  '/orders': 'Orders',
  '/wishlist': 'Wishlist',
  '/addresses': 'Saved addresses',
}

function getPageTitle(path) {
  if (PAGE_TITLES[path]) return PAGE_TITLES[path]
  // Single product page (/products/:id) reuses the Products heading.
  if (path.startsWith('/products/')) return 'Products'
  return null
}
