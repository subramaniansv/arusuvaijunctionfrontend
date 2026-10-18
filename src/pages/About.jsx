import { useEffect, useRef, useState, useCallback } from 'react'
import { Store, Crown, Flame, UtensilsCrossed, Sparkles } from 'lucide-react'
import { Faq } from '../components'
import Seo from '../components/Seo'
import { organizationLd, breadcrumbLd, faqLd, HOME_FAQS } from '../lib/seo'
import './StaticPage.css'
import './AboutTimeline.css'

/* ------------------------------------------------------------------
 * Timeline data - three generations of the Arusuvai Junction story.
 * Each milestone renders as an alternating card tied to the central
 * spine. `icon` is a lucide component rendered inside the node marker.
 * ------------------------------------------------------------------ */
const MILESTONES = [
  {
    year: '1958',
    icon: Store,
    title: 'Where it all began',
    body:
      'Our journey began with Subbiah, our grandfather\u2019s father, who started a ' +
      'marriage-vessel rental shop in Tirunelveli. But vessels were only one part of his ' +
      'world. He was also a Thavasupillai cook \u2014 a traditional cook known for preparing ' +
      'food for weddings and special occasions. Through him, our family learned that food ' +
      'was never simply about filling a plate. It was about craft, tradition and bringing ' +
      'people together.',
    generation: 'Subbiah',
  },
  {
    year: '1980\u20132000',
    icon: Crown,
    title: 'A name in Tirunelveli',
    body:
      'After Subbiah passed away, his son Subramanian carried the family forward. The small ' +
      'vessel rental business grew into what became known as KVS Vessel Rental Shop, serving ' +
      'generations of families across Tirunelveli. For nearly two decades, the name became ' +
      'familiar in the town\u2019s weddings and celebrations. Behind every function were ' +
      'vessels, cooks, recipes and countless memories.',
    generation: 'Subramanian',
  },
  {
    year: '2010\u20132020',
    icon: Flame,
    title: 'When times changed',
    body:
      'As the years passed, the way celebrations were organised changed. After 2010, marriage ' +
      'halls increasingly began providing their own vessels. Eventually, the vessel rental ' +
      'business came to an end around 2020. But one thing never disappeared \u2014 our ' +
      'family\u2019s love for cooking. Our father, Vallinayagam, continued the culinary ' +
      'tradition through catering, keeping the knowledge, techniques and flavours of our ' +
      'family alive.',
    generation: 'Vallinayagam',
  },
  {
    year: '2026',
    icon: Sparkles,
    title: 'A new chapter',
    body:
      'In 2026, a new chapter began. We started Arusuvai Junction in Tirunelveli Town with a ' +
      'simple idea: bring the taste of traditional Tamil food into everyday life. From ' +
      'homemade meals and traditional snacks to carefully prepared sweets, pickles and drinks, ' +
      'every item is inspired by the food we grew up with. We don\u2019t want to make food ' +
      'that simply looks traditional \u2014 we want to preserve the taste, methods and feeling ' +
      'behind it.',
    generation: 'The next generation',
  },
]

const GENERATIONS = [
  { name: 'Subbiah',       role: 'gave us the foundation.' },
  { name: 'Subramanian',   role: 'carried the family forward.' },
  { name: 'Vallinayagam',  role: 'kept the tradition of cooking alive.' },
]

/* ------------------------------------------------------------------
 * useReveal - attaches a single IntersectionObserver to the wrapper
 * and toggles an `is-visible` class on any child carrying the
 * `data-reveal` attribute as it scrolls into view. Respects
 * prefers-reduced-motion by revealing everything immediately.
 * ------------------------------------------------------------------ */
function useReveal() {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const targets = Array.from(root.querySelectorAll('[data-reveal]'))

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion || typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('is-visible'))
      return undefined
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' },
    )

    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return rootRef
}

export default function About() {
  const rootRef = useReveal()

  /* Progress indicator for the vertical spine - grows as you scroll. */
  const spineRef = useRef(null)
  const [progress, setProgress] = useState(0)

  const handleScroll = useCallback(() => {
    const node = spineRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const viewH = window.innerHeight || document.documentElement.clientHeight
    const total = rect.height + viewH
    const seen = Math.min(Math.max(viewH - rect.top, 0), total)
    setProgress(Math.min(seen / total, 1))
  }, [])

  useEffect(() => {
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [handleScroll])

  return (
    <div className="staticpage" ref={rootRef}>
      <Seo
        title="Our Story - Arusuvai Junction | Three generations of Tamil food"
        description="From a marriage-vessel rental shop in 1958 Tirunelveli to Arusuvai Junction in 2026. Three generations, one love for traditional Tamil food - craft, tradition and bringing people together."
        path="/about"
        keywords={[
          'about arusuvai junction',
          'arusuvai junction story',
          'traditional tamil food tirunelveli',
          'three generations tamil food',
          'tirunelveli food brand',
          'family recipe tamil snacks',
        ]}
        jsonLd={[
          organizationLd(),
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
          ]),
          faqLd(HOME_FAQS),
        ]}
      />

      {/* -------- Hero -------- */}
      <header className="staticpage__hero about-hero" data-reveal>
        <span className="staticpage__eyebrow">Our Story</span>
        <h1 className="staticpage__title">Three Generations. One Love for Tamil Food.</h1>
        <p className="staticpage__lead">
          Some recipes are passed down in books. Ours were passed down through generations.
          Our story began in <strong>1958</strong>, in the heart of Tirunelveli.
        </p>
      </header>

      {/* -------- Interactive timeline -------- */}
      <section className="timeline" ref={spineRef} aria-label="Our journey through the years">
        <div className="timeline__spine" aria-hidden="true">
          <span
            className="timeline__spine-fill"
            style={{ transform: `scaleY(${progress})` }}
          />
        </div>

        <ol className="timeline__list">
          {MILESTONES.map(({ year, icon: Icon, title, body, generation }, i) => (
            <li
              key={year}
              className={`timeline__item timeline__item--${i % 2 === 0 ? 'left' : 'right'}`}
              data-reveal
              style={{ '--reveal-delay': `${(i % 2) * 60}ms` }}
            >
              <span className="timeline__node" aria-hidden="true">
                <Icon size={18} />
              </span>
              <article className="timeline__card">
                <span className="timeline__year">{year}</span>
                <h2 className="timeline__card-title">{title}</h2>
                <p className="timeline__card-body">{body}</p>
                <span className="timeline__gen">{generation}</span>
              </article>
            </li>
          ))}
        </ol>
      </section>

      {/* -------- Generations summary -------- */}
      <section className="about-gens" data-reveal>
        <h2 className="about-gens__title">Three Generations. A New Generation.</h2>
        <p className="about-gens__intro">
          Today, Arusuvai Junction brings together three generations of our family&apos;s food journey.
        </p>
        <ul className="about-gens__grid">
          {GENERATIONS.map(({ name, role }, i) => (
            <li
              key={name}
              className="about-gens__card"
              data-reveal
              style={{ '--reveal-delay': `${i * 90}ms` }}
            >
              <span className="about-gens__badge">
                <UtensilsCrossed size={18} aria-hidden="true" />
              </span>
              <strong className="about-gens__name">{name}</strong>
              <span className="about-gens__role">{role}</span>
            </li>
          ))}
        </ul>
        <p className="about-gens__next" data-reveal>
          And now, the next generation is taking it forward — bringing together traditional
          recipes, modern design, technology and a new way of sharing Tamil food. From a vessel
          rental shop in 1958 to a food brand in 2026, the journey has changed. But the purpose
          remains the same.
        </p>
      </section>

      {/* -------- Closing / Tamil tagline -------- */}
      <section className="about-finale" data-reveal>
        <p className="about-finale__tamil">நல்ல உணவு. நல்ல நினைவுகள்.</p>
        <p className="about-finale__sub">ஆறு சுவை &bull; ஒரு அனுபவம்</p>
        <p className="about-finale__note">
          This is our story. And this is only the beginning.
        </p>
      </section>

      <section className="staticpage__faq">
        <Faq
          items={HOME_FAQS}
          title="Frequently asked questions"
          subtitle="Everything you need to know about our food and orders."
        />
      </section>
    </div>
  )
}
