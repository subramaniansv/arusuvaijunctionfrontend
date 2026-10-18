/**
 * Public Festival Share Page — /festival?msg=<slug>
 *
 * Shows the message + a beautiful full-screen background image
 * from the festival.  No login, no noise.
 */
import { useSearchParams, Link } from 'react-router-dom'
import { useShareMessage } from '../lib/banner'
import Seo from '../components/Seo'
import './FestivalShare.css'

export default function FestivalShare() {
  const [params]  = useSearchParams()
  const slug      = params.get('msg') ?? ''
  const { data: msg, isLoading, isError } = useShareMessage(slug)

  const bg = msg?.backgroundImage?.imageUrl

  if (isLoading) {
    return (
      <div className="fs-loading">
        <div className="fs-spinner" />
      </div>
    )
  }

  if (isError || !msg) {
    return (
      <div className="fs-error">
        <h1> Link not found</h1>
        <p>This message may have expired or been removed.</p>
        <Link to="/" className="fs-home-link">← Back to Arusuvai Junction</Link>
      </div>
    )
  }

  return (
    <>
      <Seo
        title={`${msg.festivalName} Wishes — Arusuvai Junction`}
        description={msg.messageText}
        path={`/festival?msg=${slug}`}
      />

      <div
        className="fs-root"
        style={bg ? { backgroundImage: `url(${bg})` } : undefined}
      >
        {/* soft dark veil so text stays readable on any image */}
        <div className="fs-veil" aria-hidden="true" />

        <div className="fs-card">
          <p className="fs-festival">{msg.festivalName}</p>
          <p className="fs-message">{msg.messageText}</p>
          <div className="fs-brand">
            <span>— </span>
            <strong>Arusuvai Junction</strong>
          </div>
          <Link to="/products" className="fs-cta">
            Shop our specials →
          </Link>
        </div>
      </div>
    </>
  )
}
