/* ------------------------------------------------------------------
 * Faq - accessible FAQ accordion.
 *
 * Built on native <details>/<summary> so every answer is always
 * present in the DOM (crawlable for SEO) and keyboard-accessible with
 * zero JS. Pair it with faqLd() from lib/seo using the SAME data array
 * so the visible content and FAQPage structured data never drift.
 *
 * Usage:
 *   import { Faq } from '../components'
 *   import { HOME_FAQS } from '../lib/seo'
 *   <Faq items={HOME_FAQS} title="Frequently asked questions" />
 * ------------------------------------------------------------------ */
import { useId } from 'react'
import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import './Faq.css'

export default function Faq({
  items = [],
  title = 'Frequently asked questions',
  subtitle,
  className,
  ...rest
}) {
  const headingId = useId()
  const faqs = (items || []).filter((f) => f && f.q && f.a)
  if (!faqs.length) return null

  return (
    <section
      className={clsx('ui-faq', className)}
      aria-labelledby={title ? headingId : undefined}
      {...rest}
    >
      {(title || subtitle) && (
        <header className="ui-faq__head">
          {title && (
            <h2 id={headingId} className="ui-faq__title">
              {title}
            </h2>
          )}
          {subtitle && <p className="ui-faq__subtitle">{subtitle}</p>}
        </header>
      )}

      <ul className="ui-faq__list">
        {faqs.map((item, i) => (
          <li key={i} className="ui-faq__item">
            <details className="ui-faq__details">
              <summary className="ui-faq__summary">
                <span className="ui-faq__question">{item.q}</span>
                <ChevronDown
                  size={20}
                  className="ui-faq__icon"
                  aria-hidden="true"
                />
              </summary>
              <div className="ui-faq__answer">
                <p>{item.a}</p>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  )
}
