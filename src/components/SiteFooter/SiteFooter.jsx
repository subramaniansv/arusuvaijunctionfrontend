/* ------------------------------------------------------------------
 * SiteFooter - global footer rendered on every page (via RootLayout).
 * Extracted from the Home page so the brand footer is consistent across
 * the whole app.
 * ------------------------------------------------------------------ */
import { Link } from 'react-router-dom'
import { Phone, Mail } from 'lucide-react'
import Container from '../Container/Container.jsx'
import Arusuvaijunction from '../../assets/ArusuvaiJunction.png'
import './SiteFooter.css'

/* Instagram SVG - lucide-react 1.x ships without it */
function InstagramIcon({ size = 18 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

const QUICK_LINKS = [
  { label: 'About us',                 to: '/about' },
  { label: 'Track an Order',           to: '/orders' },
  { label: 'Return Policy',            to: '/policy/returns' },
  { label: 'Bulk / Corporate Orders',  to: '/contact' },
  { label: 'Privacy Policy',           to: '/policy/privacy' },
]

const FOOTER_CATEGORIES = [
  { label: 'Pickles',   to: '/products?category=pickles' },
  { label: 'Podi',      to: '/products?category=podi' },
  { label: 'Ladoo',     to: '/products?category=ladoo' },
  { label: 'Nuts',      to: '/products?category=nuts' },
  { label: 'Kulambu Mix', to: '/products?category=kulambu+mix' },
]

export default function SiteFooter() {
  return (
    <footer className="home-footer">
      <Container size="xl">
        <div className="home-footer__grid">
          {/* Brand column */}
          <div className="home-footer__brand">
            <Link to="/" className="home-footer__logo-link">
              <img
                src={Arusuvaijunction}
                alt="Arusuvai Junction logo"
                className="home-footer__logo"
              />
              <div className="home-footer__brand-text">
                <span className="home-footer__brand-name">Arusuvai Junction</span>
                <span className="home-footer__brand-tamil" lang="ta">அறுசுவை ஜங்ஷன்</span>
              </div>
            </Link>
            <p className="home-footer__tagline">
              Traditional South Indian homemade foods crafted with heritage
              recipes and fresh ingredients.
            </p>
            <div className="home-footer__socials">
              <a
                href="https://www.instagram.com/arusuvai_junction"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Instagram"
                className="home-footer__social"
              >
                <InstagramIcon size={18} />
              </a>
              <a href="tel:+919597451463" aria-label="Call us" className="home-footer__social">
                <Phone size={18} />
              </a>
              <a
                href="mailto:support@arusuvaijunction.com"
                aria-label="Email support"
                className="home-footer__social"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="home-footer__col">
            <h4 className="home-footer__col-title">Quick Links</h4>
            <ul className="home-footer__links">
              {QUICK_LINKS.map((q) => (
                <li key={q.to}>
                  <Link to={q.to} className="home-footer__link">{q.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div className="home-footer__col">
            <h4 className="home-footer__col-title">Categories</h4>
            <ul className="home-footer__links">
              {FOOTER_CATEGORIES.map((c) => (
                <li key={c.to}>
                  <Link to={c.to} className="home-footer__link">{c.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </footer>
  )
}
