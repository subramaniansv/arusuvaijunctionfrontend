/**
 * Home page.
 *
 * Hero is a static watercolor scene (src/assets/image.png) with brand
 * tagline + two CTAs. Customer reviews section is a Carousel (auto-playing).
 *
 * All visuals are composed from the reusable components in
 * /src/components. Dummy data lives inline; reviews come from
 * `useHomeReviews()` which currently returns dummy data via a
 * setTimeout - swap the fetcher in /src/lib/reviews.js when the
 * backend endpoint exists.
 */
import { Link } from 'react-router-dom'
import {
  Leaf,
  Clock,
  Heart,
  Home as HomeIcon,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
} from 'lucide-react'
import Arusuvaijunction from '../assets/ArusuvaiJunction.png'

/* Simple Instagram SVG - lucide-react 1.x ships without it */
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

import {
  Container,
  Section,
  Button,
  ProductCard,
  RatingStars,
} from '../components'
import Seo from '../components/Seo'
import {
  organizationLd,
  websiteLd,
  localBusinessLd,
  faqLd,
  BRAND,
} from '../lib/seo'
import './Home.css'

// Hero background image is now declared in Home.css via image-set()
// so the browser can pick AVIF, then WebP, then JPEG. The matching
// <link rel="preload" href="/hero.webp"> in index.html primes the LCP
// image to download in parallel with the JS bundle.

/* ---------------- Dummy data (replace with API later) ----------- */

const CATEGORIES = [
  { name: 'Podi',      tamil: 'பொடி',         image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800' },
  { name: 'Ladoo',     tamil: 'லட்டு',        image: 'https://images.unsplash.com/photo-1635952346904-95f2ccfcd029?w=800' },
  { name: 'Nuts',      tamil: 'நட்ஸ்',         image: 'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=800' },
  { name: 'Ready Mix', tamil: 'ரெடி மிக்ஸ்',  image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800' },
  { name: 'Pickles',   tamil: 'ஊறுகாய்',      image: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=800' },
]

const FEATURED_PRODUCTS = [
  {
    productId: 'p1',
    name: 'Idi Sambar Podi',
    nameTamil: 'இடி சாம்பார் பொடி',
    category: 'Podi',
    price: 100,
    primaryImageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600',
    stockQuantity: 25,
    averageRating: 4.0,
    reviewCount: 500,
  },
  {
    productId: 'p2',
    name: 'Garlic Masala Nuts',
    nameTamil: 'பூண்டு மசாலா நட்ஸ்',
    category: 'Nuts',
    price: 60,
    primaryImageUrl: 'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=600',
    stockQuantity: 18,
    averageRating: 4.5,
    reviewCount: 500,
  },
  {
    productId: 'p3',
    name: 'Protein Chocolate Ladoo',
    nameTamil: 'சாக்லேட் லட்டு',
    category: 'Ladoo',
    price: 80,
    primaryImageUrl: 'https://images.unsplash.com/photo-1635952346904-95f2ccfcd029?w=600',
    stockQuantity: 40,
    averageRating: 4.5,
    reviewCount: 500,
  },
  {
    productId: 'p4',
    name: 'Vathal Kuzhambu Mix',
    nameTamil: 'வத்தக்குழம்பு மிக்ஸ்',
    category: 'Ready Mix',
    price: 90,
    mrp: 110,
    primaryImageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600',
    stockQuantity: 30,
    averageRating: 4.5,
    reviewCount: 500,
  },
]

const FOOTER_CATEGORIES = [
  { label: 'Pickles',   to: '/products?category=pickles' },
  { label: 'Podi',      to: '/products?category=podi' },
  { label: 'Ladoo',     to: '/products?category=ladoo' },
  { label: 'Nuts',      to: '/products?category=nuts' },
  { label: 'Ready Mix', to: '/products?category=ready+mix' },
]
const FEATURES = [
  { icon: HomeIcon, title: 'Homemade',         description: 'Traditional recipes prepared fresh in our kitchen.' },
  { icon: Leaf,     title: 'No Preservatives', description: '100% natural ingredients, no artificial additives.' },
  { icon: Clock,    title: 'Freshly Prepared', description: 'Made fresh daily to ensure the best taste.' },
  { icon: Heart,    title: 'Made with Love',   description: 'Every batch is crafted with care and tradition.' },
]

/* Placeholder contact info / quick links - replace with real data later */
const QUICK_LINKS = [
  { label: 'About us',                 to: '/about' },
  { label: 'Track an Order',           to: '/orders' },
  { label: 'Return Policy',            to: '/policy/returns' },
  { label: 'Bulk / Corporate Orders',  to: '/contact' },
  { label: 'Privacy Policy',           to: '/policy/privacy' },
]

const STATIC_REVIEWS = [
  {
    id: 'r1',
    name: 'Priya Venkatesh',
    city: 'Chennai',
    rating: 5,
    body: 'The Idi Sambar Podi is incredible! Tastes exactly like what my grandmother used to make. Already ordered 3 bags!',
  },
  {
    id: 'r2',
    name: 'Karthik Sundaram',
    city: 'Bangalore',
    rating: 4,
    body: 'Garlic Masala Nuts are perfectly spiced — great crunchy snack for the office. Family loves them too.',
  },
  {
    id: 'r3',
    name: 'Meera Rajesh',
    city: 'Coimbatore',
    rating: 5,
    body: 'Protein Chocolate Ladoo is a guilt-free treat. Kids absolutely love it and there\'s no refined sugar — total win!',
  },
]

/* ------------------------ Component ----------------------------- */
export default function Home() {
  return (
    <div className="home">
      <Seo
        title={null /* uses brand default */}
        description={`${BRAND.description} Shop sugar-free traditional Indian snacks online - murukku, laddoos, mixture, sweets - made with nuts, seeds and millets.`}
        path="/"
        keywords={BRAND.defaultKeywords}
        jsonLd={[
          organizationLd(),
          websiteLd(),
          localBusinessLd(),
          faqLd([
            {
              q: 'Are Arusuvai Junction snacks really sugar-free?',
              a: 'Yes. We sweeten our snacks with palm jaggery, dates, or country sugar instead of refined white sugar. Each product page lists the exact ingredients.',
            },
            {
              q: 'What makes your snacks high in protein?',
              a: 'We use generous amounts of nuts (almonds, cashews, peanuts), seeds (sesame, flax, sunflower) and millets - all naturally protein-rich.',
            },
            {
              q: 'Do you ship pan-India?',
              a: 'Yes, we ship across India. Orders are dispatched within 1–2 business days from Tirunelveli, Tamil Nadu.',
            },
            {
              q: 'How long do the snacks stay fresh?',
              a: 'Most products stay fresh for 30–45 days at room temperature in an air-tight container. Specific shelf life is shown on each product page.',
            },
            {
              q: 'Are the snacks made with preservatives?',
              a: 'Never. Our snacks contain zero artificial preservatives, colours or flavours - just traditional ingredients.',
            },
          ]),
        ]}
      />
      <Hero />
      <Categories />
      <Featured />
      <WhyChooseUs />
      <Reviews />
      <Footer />
    </div>
  )
}

/* ----- Hero ---------------------------------------------------- */
function Hero() {
  return (
    <section
      className="home-hero"
      aria-label="Arusuvai Junction - fresh, homemade traditional South Indian foods"
    >
      <div className="home-hero__veil" aria-hidden="true" />
      <Container size="xl" className="home-hero__inner">
        <div className="home-hero__copy">
          <h1 className="home-hero__title">
            <span className="home-hero__title--line-1">Fresh. Homemade.</span>
            <span className="home-hero__title--line-2">Arusuvai Junction.</span>
          </h1>

          <div className="home-hero__divider" aria-hidden="true">
            <span />
            <Leaf size={14} />
            <span />
          </div>

          <p className="home-hero__lead">
            Traditional South Indian goodness crafted with authentic ingredients,
            homemade care, and timeless recipes.
          </p>

          <div className="home-hero__ctas">
            <Link to="/products" className="home-hero__btn home-hero__btn--primary">
              Explore Products
            </Link>
            <Link to="/contact" className="home-hero__btn home-hero__btn--secondary">
              Contact Us
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ----- Categories --------------------------------------------- */
function Categories() {
  return (
    <section className="home-section home-section--cats">
      <Container size="xl">
        <Section
          title="Shop by Category"
          subtitle="Explore our authentic Tamil delicacies"
          spacing="md"
        >
          <div className="home-cats">
            {CATEGORIES.map((c) => (
              <Link
                key={c.name}
                to={`/products?category=${encodeURIComponent(c.name.toLowerCase())}`}
                className="home-cat"
              >
                <div className="home-cat__media">
                  <img src={c.image} alt={c.name} loading="lazy" decoding="async" />
                </div>
                <h3 className="home-cat__name">{c.name}</h3>
                <p className="home-cat__tamil">{c.tamil}</p>
              </Link>
            ))}
          </div>
        </Section>
      </Container>
    </section>
  )
}

/* ----- Featured products -------------------------------------- */
function Featured() {
  return (
    <section className="home-section home-section--tint">
      <Container size="xl">
        <Section
          title="Featured Products"
          subtitle="Handpicked favorites from our kitchen"
          action={
            <Link to="/products" className="home-link">
              View All <ChevronRight size={16} />
            </Link>
          }
          spacing="md"
        >
          <div className="home-grid-4">
            {FEATURED_PRODUCTS.map((p) => (
              <ProductCard
                key={p.productId}
                product={p}
                onAddToCart={(id) => console.log('add', id)}
              />
            ))}
          </div>
        </Section>
      </Container>
    </section>
  )
}

/* ----- Why choose us ------------------------------------------ */
function WhyChooseUs() {
  return (
    <section className="home-why">
      <Container size="xl">
        <Section
          title="Why Choose Us"
          subtitle="Traditional taste with modern convenience"
          spacing="md"
        >
          <div className="home-features">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="home-feature">
                  <div className="home-feature__icon">
                    <Icon size={28} />
                  </div>
                  <h3 className="home-feature__title">{f.title}</h3>
                  <p className="home-feature__desc">{f.description}</p>
                </div>
              )
            })}
          </div>
        </Section>
      </Container>
    </section>
  )
}

/* ----- Reviews (3 static cards) ----- */
function Reviews() {
  return (
    <section className="home-section home-section--cream">
      <Container size="xl">
        <Section
          title="What our customers say"
          subtitle="Verified reviews from across India"
          spacing="md"
        >
          <div className="home-reviews-grid">
            {STATIC_REVIEWS.map((r) => (
              <article key={r.id} className="home-review-simple">
                <div className="home-review-simple__top">
                  <RatingStars value={r.rating} size="md" />
                  <span className="home-review-simple__quote" aria-hidden="true">&#10077;</span>
                </div>
                <p className="home-review-simple__body">"{r.body}"</p>
                <div className="home-review-simple__author">
                  <div className="home-review-simple__avatar" aria-hidden="true">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <div className="home-review-simple__name">{r.name}</div>
                    <div className="home-review-simple__city">{r.city}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Section>
      </Container>
    </section>
  )
}

/* ----- Footer ------------------------------------------------- */
function Footer() {
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
                href="https://www.instagram.com/arusuvaijunction"
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
