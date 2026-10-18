/**
 * Loyalty / Rewards dashboard (customer-facing).
 *
 * Redesigned as a clean customer dashboard with FIVE sections:
 *   1. Welcome + summary      — name, points, visits, points earned, today
 *   2. Use your points        — 1 point = ₹N, slider, live discount, request
 *   3. Share & Earn (hero)    — referral link, copy/share, referral stats
 *   4. Visit calendar         — month grid of visited / pending days
 *   5. Recent activity        — visits, referral orders, points earned/redeemed
 *
 * IMPORTANT: no functionality changed. The QR check-in flow (?scan=1), the
 * offline-redemption request, the card/history query and the settings query
 * all behave exactly as before — only the UI was reorganised and restyled
 * (cream/forest-green/gold palette, red removed) and the Share & Earn section
 * was added on top of the existing affiliate backend.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Gift, Coins, Share2, Store, ChevronLeft, ChevronRight, Check, Clock,
  CalendarDays, Eye, EyeOff, Activity, Link as LinkIcon, Copy, MousePointerClick,
  ShoppingBag, X,
} from 'lucide-react'
import { ShareModal, LoyaltyTour, Faq } from '../components'
import {
  useMyLoyaltyCard,
  useLoyaltyScan,
  useLoyaltySettings,
  useRequestOfflineRedemption,
  useMyRedemptions,
} from '../lib/loyalty'
import { useEnsureAffiliateLink } from '../lib/affiliate'
import { useMyProfile } from '../lib/me'
import './Loyalty.css'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** yyyy-mm-dd key in local time (matches what the calendar cells use). */
function dayKey(d) {
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return null
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Build { 'yyyy-mm-dd': 'APPROVED' | 'PENDING' } from check-in history. */
function buildVisitMap(history) {
  const map = {}
  for (const h of history) {
    if (h.status === 'REJECTED') continue
    const key = dayKey(h.visitDay)
    if (!key) continue
    if (map[key] !== 'APPROVED') map[key] = h.status
  }
  return map
}

async function copyText(value) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = value
    ta.style.position = 'absolute'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch { return false }
}

/* ================================================================== */
/* 1. Welcome + summary                                               */
/* ================================================================== */
function WelcomeSummary({ name, card, checkedInToday, pointsEarned, pointValueInr, onRedeemClick }) {
  const currentPoints = card?.points ?? 0
  const pointValue = Number(pointValueInr) || 1
  const totalValue = currentPoints * pointValue

  return (
    <div className="loyalty-welcome-wrapper">
      <p className="loyalty-welcome__hello">Welcome back,</p>
      <h2 className="loyalty-welcome__name">{name || 'Friend'} 👋</h2>

      <section className="lx-card loyalty-welcome">
        <div className="loyalty-welcome__grid">
          <div className="loyalty-stat">
            <div className="loyalty-stat__value loyalty-stat__value--large">₹{totalValue.toLocaleString('en-IN')}</div>
            <span className="loyalty-stat__label">Redeemable Amount</span>
          </div>
        </div>

        {currentPoints > 0 && (
          <button
            type="button"
            className="loyalty-redeem__btn"
            onClick={onRedeemClick}
          >
            Redeem Now
          </button>
        )}
      </section>
    </div>
  )
}

/* ================================================================== */
/* 2. Use your points                                                 */
/* ================================================================== */
function RedeemPanel({ points, pointValueInr, openModal }) {
  return null
}

/* Razorpay-style redemption modal. The customer can enter either the number
 * of points to use OR the rupee discount they want — the other field updates
 * live. Entering ₹ converts back to points (rounded up to cover the amount). */
function RedeemModal({ onClose, max, rate }) {
  const [points, setPoints] = useState('')
  const [mode, setMode] = useState('points') // 'points' | 'rupees'
  const requestOffline = useRequestOfflineRedemption()

  // Lock scroll + Escape to close.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const pts = Math.max(0, Math.min(Number(points) || 0, max))
  const cash = rate * pts
  const remaining = max - pts

  const setFromPoints = (v) => {
    const n = Math.max(0, Math.floor(Number(v) || 0))
    setPoints(String(Math.min(n, max)))
  }

  // User typed a rupee amount → convert to points (round up so the discount
  // is at least what they asked for), clamped to the balance.
  const setFromRupees = (v) => {
    const money = Math.max(0, Number(v) || 0)
    if (rate <= 0) return
    const needed = Math.min(Math.ceil(money / rate), max)
    setPoints(String(needed))
  }

  const submit = () => {
    if (pts <= 0) {
      toast.error('Enter how many points to use')
      return
    }
    requestOffline.mutate(
      { points: pts },
      {
        onSuccess: () => {
          toast.success('Redemption requested — show this at the counter for approval.')
          onClose?.()
        },
        onError: (e) =>
          toast.error(e?.response?.data?.message || 'Could not request redemption'),
      },
    )
  }

  return createPortal(
    <div className="loyalty-redeem__overlay" onClick={onClose} role="presentation">
      <div
        className="loyalty-redeem__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="loyalty-redeem-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="loyalty-redeem__modal-head">
          <div className="loyalty-redeem__modal-topbar">
            <div className="loyalty-redeem__modal-brand">
              <Coins size={18} aria-hidden="true" />
              <h2 className="loyalty-redeem__modal-title" id="loyalty-redeem-title">
                Redeem points
              </h2>
            </div>
            <button
              type="button"
              className="loyalty-redeem__modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Razorpay-style hero amount — the live ₹ discount being redeemed */}
          <div className="loyalty-redeem__hero">
            {rate > 0 ? (
              <>
                <span className="loyalty-redeem__hero-amt">
                  ₹{cash.toLocaleString('en-IN')}
                </span>
                <span className="loyalty-redeem__hero-meta">
                  {pts > 0
                    ? `Using ${pts.toLocaleString('en-IN')} pts · 1 pt = ₹${rate.toLocaleString('en-IN')}`
                    : `1 point = ₹${rate.toLocaleString('en-IN')}`}
                </span>
              </>
            ) : (
              <>
                <span className="loyalty-redeem__hero-amt">
                  {pts.toLocaleString('en-IN')} pts
                </span>
                <span className="loyalty-redeem__hero-meta">Points to redeem</span>
              </>
            )}
          </div>
        </div>

        <div className="loyalty-redeem__modal-body">
          <div className="loyalty-redeem__available">
            <span>You have</span>
            <strong>{max.toLocaleString('en-IN')} points</strong>
            {rate > 0 && <span>(≈ ₹{(max * rate).toLocaleString('en-IN')})</span>}
          </div>

          {rate > 0 && (
            <div className="loyalty-redeem__tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'points'}
                className={`loyalty-redeem__tab${mode === 'points' ? ' is-active' : ''}`}
                onClick={() => setMode('points')}
              >
                By points
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'rupees'}
                className={`loyalty-redeem__tab${mode === 'rupees' ? ' is-active' : ''}`}
                onClick={() => setMode('rupees')}
              >
                By ₹ amount
              </button>
            </div>
          )}

          {mode === 'points' || rate <= 0 ? (
            <label className="loyalty-redeem__field">
              <span className="loyalty-redeem__field-label">Points to use</span>
              <div className="loyalty-redeem__field-box">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={max}
                  value={points}
                  placeholder="0"
                  onChange={(e) => setFromPoints(e.target.value)}
                  className="loyalty-redeem__field-input"
                  autoFocus
                />
                <span className="loyalty-redeem__field-unit">pts</span>
              </div>
            </label>
          ) : (
            <label className="loyalty-redeem__field">
              <span className="loyalty-redeem__field-label">Discount amount</span>
              <div className="loyalty-redeem__field-box">
                <span className="loyalty-redeem__field-unit loyalty-redeem__field-unit--pre">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={max * rate}
                  value={rate > 0 ? String(cash || '') : ''}
                  placeholder="0"
                  onChange={(e) => setFromRupees(e.target.value)}
                  className="loyalty-redeem__field-input"
                  autoFocus
                />
              </div>
            </label>
          )}

          <div className="loyalty-redeem__quick">
            {[25, 50, 100].map((pct) => {
              const q = Math.floor((max * pct) / 100)
              if (q <= 0) return null
              return (
                <button
                  key={pct}
                  type="button"
                  className="loyalty-redeem__chip"
                  onClick={() => setPoints(String(q))}
                >
                  {pct === 100 ? 'All' : `${pct}%`}
                </button>
              )
            })}
          </div>

          <div className="loyalty-redeem__summary">
            <div className="loyalty-redeem__summary-row">
              <span>Points used</span>
              <strong>{pts.toLocaleString('en-IN')}</strong>
            </div>
            {rate > 0 && (
              <div className="loyalty-redeem__summary-row loyalty-redeem__summary-row--hl">
                <span>Discount applied</span>
                <strong>₹{cash.toLocaleString('en-IN')}</strong>
              </div>
            )}
            <div className="loyalty-redeem__summary-row loyalty-redeem__summary-row--muted">
              <span>Balance after</span>
              <span>{remaining.toLocaleString('en-IN')} pts</span>
            </div>
          </div>
        </div>

        <div className="loyalty-redeem__modal-foot">
          <button
            type="button"
            className="loyalty-redeem__btn"
            onClick={submit}
            disabled={requestOffline.isPending || pts <= 0}
          >
            {requestOffline.isPending
              ? 'Requesting…'
              : rate > 0 && pts > 0
                ? `Redeem ${pts} pts for ₹${cash.toLocaleString('en-IN')}`
                : 'Request redemption'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}


/* ================================================================== */
/* 3. Share & Earn (hero) - COMMENTED OUT                             */
/* ================================================================== */
/* function ShareEarn() {
  const { primary, summary, isLoading, isError, ensure, creating } = useEnsureAffiliateLink()
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Lazily create the first link the moment the section is shown so the
  // customer always sees a ready-to-share URL.
  const triedRef = useRef(false)
  useEffect(() => {
    if (triedRef.current || isLoading || primary) return
    triedRef.current = true
    ensure().catch(() => {
      // surfaced via isError below
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, primary])

  const shareUrl = primary?.shareUrl || ''
  const stats = {
    clicks: summary?.totalClicks ?? primary?.clicks ?? 0,
    orders: summary?.totalConversions ?? primary?.conversions ?? 0,
    points: summary?.totalPointsEarned ?? primary?.pointsEarned ?? 0,
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    const ok = await copyText(shareUrl)
    if (ok) {
      setCopied(true)
      toast.success('Link copied!')
      window.setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error('Could not copy — long-press the link to copy it manually.')
    }
  }

  return (
    <section className="lx-card loyalty-share">
      <span className="loyalty-share__badge">New</span>
      <div className="lx-card__head">
        <Gift size={20} aria-hidden="true" />
        <div>
          <h2 className="lx-card__title">Share &amp; Earn</h2>
          <p className="lx-card__hint">Your personal referral link</p>
        </div>
      </div>

      <p className="loyalty-share__pitch">
        <strong>Share your link.</strong> When someone orders through it, <strong>you earn points</strong> —
        automatically added to your balance. It&apos;s our way of saying thanks for spreading the word.
      </p>

      {isError && !shareUrl ? (
        <p className="loyalty-share__loading">
          Couldn&apos;t load your link right now. Please refresh and try again.
        </p>
      ) : !shareUrl ? (
        <p className="loyalty-share__loading">
          {creating || isLoading ? 'Preparing your link…' : 'Setting up your link…'}
        </p>
      ) : (
        <>
          <div className="loyalty-share__linkbox">
            <span className="loyalty-share__link-ic"><LinkIcon size={16} /></span>
            <input
              className="loyalty-share__link-input"
              type="text"
              readOnly
              value={shareUrl}
              onFocus={(e) => e.target.select()}
              aria-label="Your referral link"
            />
            <button
              type="button"
              className={`loyalty-share__copy${copied ? ' is-done' : ''}`}
              onClick={handleCopy}
            >
              {copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}
            </button>
          </div>

          <div className="loyalty-share__actions">
            <button
              type="button"
              className="loyalty-share__btn loyalty-share__btn--primary"
              onClick={() => setShareOpen(true)}
            >
              <Share2 size={16} /> Share link
            </button>
          </div>

          <div className="loyalty-share__stats">
            <div className="loyalty-share__stat">
              <div className="loyalty-share__stat-value">
                <MousePointerClick size={16} style={{ verticalAlign: '-2px' }} /> {stats.clicks}
              </div>
              <span className="loyalty-share__stat-label">Link clicks</span>
            </div>
            <div className="loyalty-share__stat">
              <div className="loyalty-share__stat-value">
                <ShoppingBag size={16} style={{ verticalAlign: '-2px' }} /> {stats.orders}
              </div>
              <span className="loyalty-share__stat-label">Orders</span>
            </div>
            <div className="loyalty-share__stat">
              <div className="loyalty-share__stat-value">
                <Coins size={16} style={{ verticalAlign: '-2px' }} /> {stats.points}
              </div>
              <span className="loyalty-share__stat-label">Points earned</span>
            </div>
          </div>
        </>
      )}

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={shareUrl}
        title="Arusuvai Junction"
        text="Order through my link and we both win!"
      />
    </section>
  )
} */


/* ================================================================== */
/* 5. Recent activity                                                 */
/* ================================================================== */
function fmtDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString(undefined, {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return String(d) }
}

function buildActivity(history, redemptions) {
  const out = []

  for (const h of history) {
    if (h.status === 'REJECTED') continue
    const isOrder = h.source === 'ORDER'
    out.push({
      ts: new Date(h.visitDay).getTime() || 0,
      kind: isOrder ? 'order' : 'visit',
      label: isOrder ? 'Order (points earned)' : 'Store visit',
      date: h.visitDay,
      points: h.status === 'APPROVED' ? '+1' : 'pending',
      pending: h.status !== 'APPROVED',
    })
  }

  for (const r of redemptions) {
    out.push({
      ts: new Date(r.createdAt || r.updatedAt).getTime() || 0,
      kind: 'redeem',
      label: r.channel === 'ONLINE' ? 'Redeemed at checkout' : 'Redeemed in store',
      date: r.createdAt || r.updatedAt,
      points: `-${r.pointsUsed ?? 0}`,
      status: r.status,
    })
  }

  return out.sort((a, b) => b.ts - a.ts)
}

/* Number of activity rows shown before the internal scrollbar kicks in,
 * and the cap for the compact (non-expanded) card view. */
const ACTIVITY_PREVIEW_COUNT = 10

/* Single activity row — shared by the card preview and the full-page modal. */
function ActivityRow({ r }) {
  const isSpend = r.kind === 'redeem'
  const iconCls =
    'loyalty-activity__icon' +
    (r.kind === 'order' ? ' loyalty-activity__icon--gold' : '') +
    (isSpend ? ' loyalty-activity__icon--spend' : '')
  const Icon = r.kind === 'order' ? ShoppingBag : isSpend ? Coins : Store
  return (
    <div className="loyalty-activity__row">
      <span className={iconCls}><Icon size={18} /></span>
      <div className="loyalty-activity__body">
        <div className="loyalty-activity__label">
          {r.label}
          {isSpend && r.status ? ` · ${r.status.toLowerCase()}` : ''}
        </div>
        <div className="loyalty-activity__date">{fmtDate(r.date)}</div>
      </div>
      <div className={`loyalty-activity__pts ${isSpend ? 'loyalty-activity__pts--spend' : 'loyalty-activity__pts--earn'}`}>
        {r.pending ? '⏳' : r.points}
      </div>
    </div>
  )
}

/* Full-page modal listing every activity row. Closes on backdrop /
 * Escape / close button; locks body scroll while open. */
function AllActivityModal({ open, onClose, rows }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="loyalty-activity__overlay" onClick={onClose} role="presentation">
      <div
        className="loyalty-activity__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="loyalty-activity-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="loyalty-activity__sheet-head">
          <div className="lx-card__head" style={{ margin: 0 }}>
            <Activity size={20} aria-hidden="true" />
            <div>
              <h2 className="lx-card__title" id="loyalty-activity-title">All activity</h2>
              <p className="lx-card__hint">
                {rows.length} item{rows.length === 1 ? '' : 's'} — visits, orders and point movements.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="loyalty-activity__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="loyalty-activity__sheet-body">
          {rows.length === 0 ? (
            <p className="loyalty-activity__empty">No activity yet.</p>
          ) : (
            <div className="loyalty-activity__list">
              {rows.map((r, i) => <ActivityRow key={i} r={r} />)}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function RecentActivity({ history, redemptions }) {
  const rows = useMemo(() => buildActivity(history, redemptions), [history, redemptions])
  const [showAll, setShowAll] = useState(false)

  const hasMore = rows.length > ACTIVITY_PREVIEW_COUNT
  const preview = hasMore ? rows.slice(0, ACTIVITY_PREVIEW_COUNT) : rows

  return (
    <section className="lx-card">
      <div className="lx-card__head">
        <Activity size={20} aria-hidden="true" />
        <div>
          <h2 className="lx-card__title">Recent activity</h2>
          <p className="lx-card__hint">Your visits, orders and point movements.</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="loyalty-activity__empty">No activity yet — your first visit will show up here.</p>
      ) : (
        <>
          {/* Shows the latest 10; scrolls internally if 10 are present. */}
          <div className="loyalty-activity__scroll">
            <div className="loyalty-activity__list">
              {preview.map((r, i) => <ActivityRow key={i} r={r} />)}
            </div>
          </div>

          {hasMore && (
            <button
              type="button"
              className="loyalty-activity__more"
              onClick={() => setShowAll(true)}
            >
              Show all {rows.length} activities
            </button>
          )}
        </>
      )}

      <AllActivityModal open={showAll} onClose={() => setShowAll(false)} rows={rows} />
    </section>
  )
}

/* ================================================================== */
/* Page                                                               */
/* ================================================================== */
export default function Loyalty() {
  const [params, setParams] = useSearchParams()
  const scanMode = params.get('scan') === '1'
  const scan = useLoyaltyScan()
  const { data, isLoading } = useMyLoyaltyCard()
  const { data: settings } = useLoyaltySettings()
  const { data: profile } = useMyProfile()
  const { data: redeemData } = useMyRedemptions({ limit: 100 })
  const firedRef = useRef(false)
  
  // Redeem modal state
  const [redeemModalOpen, setRedeemModalOpen] = useState(false)
  
  // Tour state management
  const [showTour, setShowTour] = useState(() => {
    // Check if user has already seen the tour
    const tourCompleted = localStorage.getItem('loyalty-tour-completed')
    // Show tour only if not completed and user has loaded the page
    return !tourCompleted
  })

  const handleTourComplete = () => {
    localStorage.setItem('loyalty-tour-completed', 'true')
    setShowTour(false)
  }

  // Fire the QR check-in exactly once on ?scan=1 (unchanged behaviour).
  useEffect(() => {
    if (!scanMode || firedRef.current) return
    firedRef.current = true
    scan.mutate(undefined, {
      onSuccess: (res) => {
        if (res?.alreadyCheckedIn) {
          toast("You're already checked in for today.", { icon: '✅' })
        } else {
          toast.success('Check-in received — waiting for staff approval.')
        }
        params.delete('scan')
        setParams(params, { replace: true })
      },
      onError: () => toast.error('Could not check in. Please try again.'),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanMode])

  const card = data?.card
  const history = useMemo(() => data?.history || [], [data])
  const redemptions = useMemo(() => redeemData?.redemptions || [], [redeemData])
  const visitMap = useMemo(() => buildVisitMap(history), [history])

  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim()

  // "Points earned" = lifetime earned from the APPROVED visit/order history.
  const pointsEarned = useMemo(
    () => history.filter((h) => h.status === 'APPROVED').length,
    [history],
  )

  return (
    <div className="loyalty">
      <header className="loyalty__head">
        <div className="loyalty__title-row">
          <Gift size={24} aria-hidden="true" />
          <h1 className="loyalty__title">Rewards &amp; Referrals</h1>
        </div>
        <p className="loyalty__subtitle">
          Earn points every time you visit or order — and now, every time a friend orders through your link.
        </p>
      </header>

      {scanMode && scan.isPending && (
        <div className="loyalty__banner is-wait">Checking you in…</div>
      )}

      {/* Welcome box pinned to the top, full-width. */}
      <WelcomeSummary
        name={name}
        card={card}
        checkedInToday={data?.checkedInToday}
        pointsEarned={pointsEarned}
        pointValueInr={settings?.pointValueInr}
        onRedeemClick={() => setRedeemModalOpen(true)}
      />

      {/* Desktop: single column layout for recent activity */}
      <div className="loyalty__layout">
        <div className="loyalty__col">
          <RecentActivity history={history} redemptions={redemptions} />
        </div>
      </div>

      {/* Redeem Modal */}
      {redeemModalOpen && (
        <RedeemModal
          onClose={() => setRedeemModalOpen(false)}
          max={card?.points ?? 0}
          rate={Number(settings?.pointValueInr) || 0}
        />
      )}


      {isLoading && (
        <p className="loyalty-activity__empty" style={{ marginTop: 16 }}>Loading your card…</p>
      )}

      {/* Loyalty Tour */}
      <LoyaltyTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={handleTourComplete}
      />

      {/* FAQ Section */}
      <div style={{ marginTop: '48px' }}>
        <Faq
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about loyalty points"
          items={[
          {
            q: 'How do I earn points?',
            a: (
              <div>
                <p>You can earn loyalty points in three ways:</p>
                <ul>
                  <li><strong>Store visits:</strong> Check in at our physical store to earn 1 point per day</li>
                  <li><strong>Online orders:</strong> Earn points automatically when you purchase online</li>
                  <li><strong>Welcome gift:</strong> New members receive 25 free points as a special gift for joining our family</li>
                </ul>
              </div>
            ),
          },
          {
            q: 'How do I use points for online purchases?',
            a: (
              <div>
                <p>Using points for online orders is simple:</p>
                <ol>
                  <li>Add items to your cart and proceed to checkout</li>
                  <li>On the checkout page, you'll see a loyalty points section in the order summary</li>
                  <li>Use the slider or enter the number of points you want to redeem</li>
                  <li>Your discount will be applied automatically (1 point = ₹1 discount)</li>
                  <li>Complete your payment with the reduced total</li>
                </ol>
              </div>
            ),
          },
          {
            q: 'How do I use points for offline/store purchases?',
            a: (
              <div>
                <p>To redeem points at our physical store:</p>
                <ol>
                  <li>Click the "Redeem points" button in the "Use your points" section above</li>
                  <li>Enter the number of points you want to use</li>
                  <li>Submit your redemption request</li>
                  <li>Show the confirmation to our staff at the counter during your next visit</li>
                  <li>Our team will verify and apply your discount at checkout</li>
                </ol>
                <p><strong>Note:</strong> Offline redemptions require staff approval before they can be used.</p>
              </div>
            ),
          },
        ]}
        />
      </div>
    </div>
  )
}
