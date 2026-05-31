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
} from 'lucide-react'

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
import heroImg from '../assets/hero.png'
import leafIcon from '../assets/leaf.svg'
import podiCat from '../assets/podicategory.png'
import ladooCat from '../assets/ladoocategory.png'
import nutsCat from '../assets/nutscategory.png'
import readyMixCat from '../assets/vathakulambu (1).png'
import pickleCat from '../assets/picklecategoey.png'

// The hero banner uses the watercolor illustration in src/assets/hero.png,
// applied as an inline background-image on the .home-hero section. The
// decorative leaf (src/assets/leaf.svg) sits in the title divider.

/* ---------------- Dummy data (replace with API later) ----------- */

const CATEGORIES = [
  { name: 'Podi',      tamil: 'பொடி',         image: podiCat },
  { name: 'Ladoo',     tamil: 'லட்டு',        image: ladooCat },
  { name: 'Nuts',      tamil: 'நட்ஸ்',         image: nutsCat },
  { name: 'Kulambu Mix', tamil: 'குழம்பு மிக்ஸ்',  image: readyMixCat },
  { name: 'Pickles',   tamil: 'ஊறுகாய்',      image: pickleCat },
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

const FEATURES = [
  { icon: HomeIcon, title: 'Homemade',         description: 'Traditional recipes prepared fresh in our kitchen.' },
  { icon: Leaf,     title: 'No Preservatives', description: '100% natural ingredients, no artificial additives.' },
  { icon: Clock,    title: 'Freshly Prepared', description: 'Made fresh daily to ensure the best taste.' },
  { icon: Heart,    title: 'Made with Love',   description: 'Every batch is crafted with care and tradition.' },
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
    </div>
  )
}

/* ----- Hero ---------------------------------------------------- */
function Hero() {
  return (
    <section
      className="home-hero"
      style={{ backgroundImage: `url(${heroImg})` }}
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
            <img src={leafIcon} alt="" className="home-hero__divider-leaf" />
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
          <div className="home-featured__more">
            <Link to="/products" className="home-link">
              View All <ChevronRight size={16} />
            </Link>
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
