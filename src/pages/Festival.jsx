/**
 * /festival  — two modes, same route. Uses the shared app navbar/footer
 * (rendered by RootLayout), so there is NO custom top bar here.
 *
 * Mode A  /festival               → Postcard studio (spotlight)
 *   • The ONE live festival loads automatically (admin-controlled spotlight).
 *   • Its background images appear as a thumbnail picker (5 per row) — shown
 *     as a SMALL stamp on the postcard (fully visible, never cropped).
 *   • Visitor fills TO / MESSAGE / FROM — like a real Indian post card.
 *   • Live postcard preview updates as they type.
 *   • The chosen background stays put — it only changes when the user
 *     explicitly clicks a thumbnail (NO auto-cycling).
 *   • Download the post card as a PNG.
 *
 * Mode B  /festival?msg=<slug>    → View a shared postcard (also downloadable).
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Copy, RefreshCw, Link2, MessageCircle, ArrowRight } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Seo from '../components/Seo'
import { Button } from '../components'
import { useActiveFestival, useShareMessage } from '../lib/banner'
import { api } from '../lib/api'
import brandLogo from '../assets/arusvaistamp.png'
import floralOrnament from '../assets/diwali-floral-ornament.svg'
import './Festival.css'

/* Max message length — keeps the post card from overflowing its lines */
const MSG_MAX = 210
const MSG_MAX_LINES = 6

function clampMessageInput(value) {
  const normalized = String(value ?? '').replace(/\r\n/g, '\n')
  const limitedByChars = normalized.slice(0, MSG_MAX)
  const lines = limitedByChars.split('\n')
  if (lines.length <= MSG_MAX_LINES) return limitedByChars
  return lines.slice(0, MSG_MAX_LINES).join('\n')
}

export default function Festival() {
  const [params] = useSearchParams()
  const slug = params.get('msg')
  return slug ? <ViewMode slug={slug} /> : <CreateMode />
}

/* ═══════════════════════════════════════════════════════════════
   PNG export — renders the live postcard DOM to a canvas via an
   SVG <foreignObject>. No external library required. Images are
   inlined as data-URIs first so the canvas never gets tainted.
═══════════════════════════════════════════════════════════════ */
async function toDataUri(url) {
  if (!url) return url
  // Already a data-URI — nothing to fetch.
  if (url.startsWith('data:')) return url
  // 1) Try a plain CORS fetch → blob → data-URI (works for same-origin &
  //    CORS-enabled hosts).
  try {
    const res = await fetch(url, { mode: 'cors', cache: 'no-cache' })
    if (res.ok) {
      const blob = await res.blob()
      const dataUri = await new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result)
        r.onerror = reject
        r.readAsDataURL(blob)
      })
      if (dataUri && String(dataUri).startsWith('data:')) return dataUri
    }
  } catch {
    /* fall through to canvas method */
  }
  // 2) Fallback: draw the image onto a canvas and export. Requires the image
  //    to be CORS-enabled (crossOrigin='anonymous') or same-origin.
  try {
    const dataUri = await new Promise((resolve, reject) => {
      const im = new Image()
      im.crossOrigin = 'anonymous'
      im.onload = () => {
        try {
          const c = document.createElement('canvas')
          c.width = im.naturalWidth || im.width
          c.height = im.naturalHeight || im.height
          const cx = c.getContext('2d')
          cx.drawImage(im, 0, 0)
          resolve(c.toDataURL('image/png'))
        } catch (err) { reject(err) }
      }
      im.onerror = reject
      im.src = url
    })
    if (dataUri && dataUri.startsWith('data:')) return dataUri
  } catch {
    /* give up — return original url */
  }
  return url
}

async function downloadPostcardPng(node, fileName = 'arusuvai-postcard.png') {
  if (!node) return
  const scale = 2
  const rect = node.getBoundingClientRect()
  const width = Math.ceil(rect.width)
  const height = Math.ceil(rect.height)

  // 0) Make sure the greeting webfont + every <img> is fully loaded/decoded
  //    BEFORE we clone — otherwise the stamp/logo is captured blank.
  try { await document.fonts.ready } catch { /* noop */ }
  const originals = node.querySelectorAll('img')
  await Promise.all(
    Array.from(originals).map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        return img.decode ? img.decode().catch(() => {}) : Promise.resolve()
      }
      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true })
        img.addEventListener('error', resolve, { once: true })
      })
    }),
  )

  // clone + inline every <img> as a data-URI so the SVG stays untainted
  const clone = node.cloneNode(true)
  const clones = clone.querySelectorAll('img')
  await Promise.all(
    Array.from(originals).map(async (img, i) => {
      const src = img.currentSrc || img.getAttribute('src') || img.src
      const dataUri = await toDataUri(src)
      if (clones[i]) clones[i].setAttribute('src', dataUri)
    }),
  )

  // serialise all computed styles inline so the SVG render matches the DOM
  inlineStyles(node, clone)

  const xml = new XMLSerializer().serializeToString(clone)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<foreignObject width="100%" height="100%">` +
    `<div xmlns="http://www.w3.org/1999/xhtml">${xml}</div>` +
    `</foreignObject></svg>`

  const img = new Image()
  img.crossOrigin = 'anonymous'
  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)

  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = svgUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)
  ctx.drawImage(img, 0, 0)

  const a = document.createElement('a')
  a.download = fileName
  a.href = canvas.toDataURL('image/png')
  a.click()
}

/* copy computed styles from source tree onto the clone tree */
function inlineStyles(src, dst) {
  const cs = window.getComputedStyle(src)
  let css = ''
  for (let i = 0; i < cs.length; i++) {
    const prop = cs[i]
    css += `${prop}:${cs.getPropertyValue(prop)};`
  }
  dst.setAttribute('style', css)
  const srcChildren = src.children
  const dstChildren = dst.children
  for (let i = 0; i < srcChildren.length; i++) {
    inlineStyles(srcChildren[i], dstChildren[i])
  }
}

/* ═══════════════════════════════════════════════════════════════
   MODE A — Postcard studio (spotlight festival)
═══════════════════════════════════════════════════════════════ */
function CreateMode() {
  const { data, isLoading } = useActiveFestival()
  const festival = data?.festival ?? null
  const images = Array.isArray(data?.images)
    ? [...data.images].sort((a, b) => {
        const ao = Number.isFinite(Number(a?.displayOrder)) ? Number(a.displayOrder) : 0
        const bo = Number.isFinite(Number(b?.displayOrder)) ? Number(b.displayOrder) : 0
        if (ao !== bo) return ao - bo
        return String(a?.createdAt || '').localeCompare(String(b?.createdAt || ''))
      })
    : []

  /* chosen background (stamp) — stays put until the user picks another */
  const [imgIdx, setImgIdx] = useState(0)
  /* default to the first image ONCE when the festival loads. No auto-cycle. */
  useEffect(() => {
    setImgIdx(0)
  }, [festival?.festivalId, images.length])
  useEffect(() => {
    if (images.length === 0) return
    if (!images[imgIdx]) setImgIdx(0)
  }, [images, imgIdx])
  const currentImg = images[imgIdx] ?? images[0] ?? null
  const fallbackStampUrl = images[0]?.imageUrl ?? null

  /* postcard fields */
  const [recipient, setRecipient] = useState('')
  const [message, setMessage]     = useState('')
  const [sender, setSender]       = useState('')

  /* result */
  const [generating, setGenerating] = useState(false)
  const [shareUrl, setShareUrl]     = useState(null)
  const clearResult = () => setShareUrl(null)

  const cardRef = useRef(null)

  /* every field is required before a post card can be created */
  const isFormValid =
    !!currentImg && !!recipient.trim() && !!message.trim() && !!sender.trim()

  const handleGenerate = async () => {
    if (!festival)         { toast.error('No festival is live right now'); return }
    if (!currentImg)       { toast.error('Choose a stamp first');          return }
    if (!recipient.trim()) { toast.error('Enter who this is TO');          return }
    if (!message.trim())   { toast.error('Write your message first');      return }
    if (!sender.trim())    { toast.error('Enter your name (FROM)');        return }
    setGenerating(true)
    try {
      const res = await api.post('/api/banner/admin/messages', {
        festivalId:    festival.festivalId,
        imageId:       currentImg?.imageId ?? null,
        recipientName: recipient.trim() || null,
        messageText:   message.trim(),
        senderName:    sender.trim() || null,
      })
      const s = res.data?.data?.shareSlug
      if (!s) throw new Error('No slug returned')
      setShareUrl(`${window.location.origin}/festival?msg=${s}`)
      toast.success('Postcard created ✨')
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not generate link')
    } finally {
      setGenerating(false)
    }
  }

  const copyUrl = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied!')
  }

  const shareWhatsApp = () => {
    if (!shareUrl) return
    const text = `🪔 ${festival?.name || 'Festival'} wishes${recipient ? `, ${recipient}` : ''}!\n\n${message}\n\n— ${sender || 'Arusuvai Junction'}\n\n${shareUrl}`
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank')
  }

  const reset = () => {
    setShareUrl(null); setRecipient(''); setMessage(''); setSender(''); setImgIdx(0)
  }

  /* ── Modal a11y: Escape to close + focus trap while open ───────── */
  const modalRef = useRef(null)
  useEffect(() => {
    if (!shareUrl) return

    // Remember what had focus so we can restore it on close.
    const prevActive = document.activeElement
    // Focus the first focusable element inside the modal.
    const focusables = () =>
      modalRef.current
        ? Array.from(
            modalRef.current.querySelectorAll(
              'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
            )
          )
        : []
    focusables()[0]?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); reset(); return }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last  = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    // Lock background scroll while the modal is open.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      if (prevActive instanceof HTMLElement) prevActive.focus()
    }
  }, [shareUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Seo
        title="Create a Festival Postcard — Arusuvai Junction"
        description="Pick a stamp, write your message, and share a festive post card with your family."
        path="/festival"
      />
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      {/* No festival live → friendly empty state */}
      {!isLoading && !festival ? (
        <div className="fc-empty">
          <h1>No festival is live right now 🪔</h1>
          <p>Please check back soon we light up this page during festivals.</p>
          <Link to="/products" className="fc-open-btn">Browse our products</Link>
        </div>
      ) : (
        <div className="fc-app">
          {/* Two-panel workspace */}
          <section className="fc-workspace">
            {/* LEFT — compose */}
            <div className="fc-panel">
              <div className="fc-panel-head">
                <div>
                  <div className="fc-panel-title">Choose your stamp <span className="fc-req">*</span></div>
                  <div className="fc-panel-sub">Pick a design from the {festival?.name || 'festival'} collection.</div>
                </div>
                <div className="fc-eyebrow fc-step-num">01</div>
              </div>

              {/* Stamps (festival images) — 5 per row */}
              {isLoading ? (
                <div className="fc-templates">
                  {[1,2,3,4,5].map(i => <span key={i} className="fc-skel-tpl" />)}
                </div>
              ) : images.length > 0 ? (
                <div className="fc-templates">
                  {images.map((img, i) => (
                    <button
                      key={img.imageId}
                      className={`fc-template${i === imgIdx ? ' is-active' : ''}`}
                      onClick={() => setImgIdx(i)}
                      type="button"
                      title={img.label || `Stamp ${i + 1}`}
                    >
                      <ImageWithFallback
                        src={img.imageUrl}
                        fallbackSrc={fallbackStampUrl}
                        alt={img.label || festival?.name || `Stamp ${i + 1}`}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="fc-no-images">No stamps uploaded for this festival yet.</p>
              )}

              {/* Postcard fields */}
              <div className="fc-form">
                <div className="fc-field">
                  <label htmlFor="fc-msg">
                    YOUR MESSAGE <span className="fc-req">*</span>
                    <span className={`fc-count${message.length >= MSG_MAX ? ' is-max' : ''}`}>
                      {message.length}/{MSG_MAX}
                    </span>
                  </label>
                  <textarea
                    id="fc-msg"
                    required
                    rows={6}
                    maxLength={MSG_MAX}
                    placeholder={`May this ${festival?.name || 'festival'} bring you closer to the ones you love.`}
                    value={message}
                    onChange={e => { setMessage(clampMessageInput(e.target.value)); clearResult() }}
                    onPaste={e => {
                      e.preventDefault()
                      const pasted = e.clipboardData?.getData('text') ?? ''
                      const nextValue = clampMessageInput(`${message}${pasted}`)
                      setMessage(nextValue)
                      clearResult()
                    }}
                  />
                </div>

                <div className="fc-row">
                  <div className="fc-field">
                    <label htmlFor="fc-to">TO <span className="fc-req">*</span></label>
                    <input
                      id="fc-to"
                      required
                      maxLength={60}
                      placeholder="Their name"
                      value={recipient}
                      onChange={e => { setRecipient(e.target.value); clearResult() }}
                    />
                  </div>
                  <div className="fc-field">
                    <label htmlFor="fc-from">FROM <span className="fc-req">*</span></label>
                    <input
                      id="fc-from"
                      required
                      maxLength={60}
                      placeholder="Your name"
                      value={sender}
                      onChange={e => { setSender(e.target.value); clearResult() }}
                    />
                  </div>
                </div>

                {/* Generate — opens the ready-to-share modal on success */}
                <div className="fc-actions">
                  <button
                    className="fc-primary"
                    onClick={handleGenerate}
                    disabled={generating || !isFormValid}
                    type="button"
                  >
                    {generating
                      ? <><RefreshCw size={16} className="fc-spin" /> Creating…</>
                      : <><Link2 size={16} /> Create my post card</>}
                  </button>
                  <button className="fc-secondary" onClick={reset} type="button">Reset</button>
                </div>
              </div>
            </div>

            {/* RIGHT — live preview */}
            <div className="fc-panel">
              <div className="fc-panel-head">
                <div>
                  <div className="fc-panel-title">Live preview</div>
                  <div className="fc-panel-sub">Your words appear on the post card.</div>
                </div>
                <div className="fc-eyebrow fc-step-num">02</div>
              </div>

              <div className="fc-preview-wrap">
                <div className="fc-preview-stage">
                  <Postcard
                    cardRef={cardRef}
                    imageUrl={currentImg?.imageUrl ?? null}
                    fallbackImageUrl={fallbackStampUrl}
                    festivalName={festival?.name}
                    recipient={recipient}
                    message={message}
                    sender={sender}
                    loading={isLoading}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Ready-to-share modal — appears when the post card is generated */}
          {shareUrl && (
            <div className="fc-modal-overlay" onClick={reset} role="presentation">
              <div
                ref={modalRef}
                className="fc-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="fc-modal-title"
                onClick={e => e.stopPropagation()}
              >
                <button className="fc-modal-close" onClick={reset} aria-label="Close" type="button">×</button>

                <p className="fc-modal__title" id="fc-modal-title">Your post card is ready!</p>
                <p className="fc-modal__sub">Share this link with family &amp; friends.</p>

                <div className="fc-result__url">
                  <span>{shareUrl}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyUrl}
                    title="Copy link"
                    aria-label="Copy link"
                    leftIcon={<Copy size={15} />}
                    className="fc-modal__copy"
                  >
                    Copy
                  </Button>
                </div>

                <div className="fc-modal__actions">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={shareWhatsApp}
                    leftIcon={<MessageCircle size={15} />}
                  >
                    WhatsApp
                  </Button>
                  <Button
                    as="a"
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    variant="primary"
                    size="sm"
                    rightIcon={<ArrowRight size={15} />}
                  >
                    Open post card
                  </Button>
                </div>

                <Button variant="ghost" size="sm" onClick={reset} className="fc-modal__again">
                  Create another
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MODE B — View a shared postcard
═══════════════════════════════════════════════════════════════ */
function ViewMode({ slug }) {
  const { data: msg, isLoading, isError } = useShareMessage(slug)
  const bg = msg?.backgroundImage?.imageUrl ?? null
  const cardRef = useRef(null)

  if (isLoading) {
    return <div className="fv-loading"><div className="fv-spinner" /></div>
  }
  if (isError || !msg) {
    return (
      <div className="fv-error">
        <h1>🔗 Link not found</h1>
        <p>This post card may have expired or been removed.</p>
        <Link to="/festival" className="fv-create-link">Create your own →</Link>
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
      <Toaster position="top-center" toastOptions={{ duration: 2500 }} />

      <div className="fv-root">
        <div className="fv-stage">
          <Postcard
            cardRef={cardRef}
            imageUrl={bg}
            festivalName={msg.festivalName}
            recipient={msg.recipientName}
            message={msg.messageText}
            sender={msg.senderName}
            large
          />
          <div className="fv-actions">
            <Link to="/festival" className="fv-make-link">Create your own →</Link>
          </div>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Postcard — authentic Indian divided-back post card.
     • Left half   = the written MESSAGE (big)
     • Right half  = brand logo + small STAMP (top-right, full image)
                     then TO + address lines, FROM pinned to bottom
     • Vertical divider down the middle
═══════════════════════════════════════════════════════════════ */
function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed
  if (trimmed.startsWith('//')) return `${window.location.protocol}${trimmed}`
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function withImageFallback(url) {
  const normalized = normalizeImageUrl(url)
  if (!normalized) return []
  const candidates = [normalized]

  if (/^https?:\/\//i.test(normalized)) {
    const https = normalized.replace(/^http:\/\//i, 'https://')
    if (!candidates.includes(https)) candidates.push(https)

    try {
      const parsed = new URL(https)
      if (parsed.hostname.includes('r2.cloudflarestorage.com') && !parsed.searchParams.has('format')) {
        const webp = new URL(parsed.toString())
        webp.searchParams.set('format', 'webp')
        if (!candidates.includes(webp.toString())) candidates.push(webp.toString())
      }
    } catch {
      /* ignore malformed urls */
    }
  }

  return candidates
}

function ImageWithFallback({
  className,
  src,
  fallbackSrc,
  alt,
  loading = 'lazy',
  decoding = 'async',
  referrerPolicy,
  onResolvedSrc,
  onAllFailed,
}) {
  const sources = useMemo(() => {
    const list = []
    for (const candidate of [...withImageFallback(src), ...withImageFallback(fallbackSrc)]) {
      if (candidate && !list.includes(candidate)) list.push(candidate)
    }
    return list
  }, [src, fallbackSrc])

  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [sources])

  const activeSrc = sources[index] || null

  useEffect(() => {
    if (activeSrc) onResolvedSrc?.(activeSrc)
  }, [activeSrc, onResolvedSrc])

  if (!activeSrc) {
    return null
  }

  return (
    <img
      className={className}
      src={activeSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      referrerPolicy={referrerPolicy}
      onError={() => {
        if (index < sources.length - 1) {
          setIndex(index + 1)
          return
        }
        onAllFailed?.()
      }}
    />
  )
}

function Postcard({ cardRef, imageUrl, fallbackImageUrl, festivalName, recipient, message, sender, loading, large }) {
  const displayMessage = clampMessageInput(message)
  const [stampFailed, setStampFailed] = useState(false)
  const primaryStampUrl = normalizeImageUrl(imageUrl)
  const backupStampUrl = normalizeImageUrl(fallbackImageUrl)
  const hasStampCandidate = !!(primaryStampUrl || backupStampUrl)

  useEffect(() => {
    setStampFailed(false)
  }, [primaryStampUrl, backupStampUrl])

  return (
    <div ref={cardRef} className={`pc${large ? ' pc--lg' : ''}`} aria-label="Post card">
      <div className="pc__body">
        {/* LEFT — greeting at the top, then the message.
            Gold ornament rules frame the text before AND after. */}
        <div className="pc__left">
          <div className="pc__greeting" aria-label={`Happy ${festivalName || 'Festival'}`}>
            <span className="pc__greeting-happy">Happy</span>
            <span className="pc__greeting-festival">{festivalName || 'Festival'}</span>
          </div>
          <p className="pc__message">
            {displayMessage
              ? displayMessage
              : <span className="pc-ghost">Your message will be display here…</span>}
          </p>
        </div>

        {/* vertical divider with floral in the middle */}
        <div className="pc__divider" aria-hidden="true">
          <img
            className="pc__divider-floral"
            src={floralOrnament}
            alt=""
            aria-hidden="true"
            crossOrigin="anonymous"
          />
        </div>

        {/* RIGHT — brand logo + stamp + address */}
        <div className="pc__right">
          <div className="pc__postage">
            {/* brand logo — small, before the stamp */}
            <img className="pc__logo" src={brandLogo} alt="Arusuvai Junction" crossOrigin="anonymous" />
            {/* small stamp, FULL image visible (contain) */}
            <div className="pc__stamp">
              {loading ? (
                <div className="pc__stamp-skel" />
              ) : hasStampCandidate && !stampFailed ? (
                <ImageWithFallback
                  src={primaryStampUrl}
                  fallbackSrc={backupStampUrl}
                  alt={festivalName || 'Stamp'}
                  loading="eager"
                  decoding="sync"
                  referrerPolicy="no-referrer"
                  onAllFailed={() => setStampFailed(true)}
                />
              ) : (
                <div className="pc__stamp-empty">STAMP</div>
              )}
            </div>
          </div>

          <div className="pc__address">
            <div className="pc__addr-label">TO</div>
            <p className="pc__to">
              {recipient || <span className="pc-ghost">Their name</span>}
            </p>
          </div>

          <div className="pc__from">
            <div className="pc__addr-label">FROM</div>
            <p className="pc__from-name">
              {sender || <span className="pc-ghost">Your name</span>}
            </p>
            <span className="pc__web">
              <img className="pc__web-floral" src={floralOrnament} alt="" aria-hidden="true" crossOrigin="anonymous" />
              www.arusuvaijunction.com
              <img className="pc__web-floral" src={floralOrnament} alt="" aria-hidden="true" crossOrigin="anonymous" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
