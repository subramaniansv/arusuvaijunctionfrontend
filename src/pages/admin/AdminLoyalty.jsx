/**
 * Admin loyalty console.
 *
 * Parts:
 *  1. Store QR generator — one QR for ALL customers (unchanged behaviour).
 *  2. Point economics — the point->cash value PLUS the new affiliate /
 *     order->points rate configuration (order rate, referral rate,
 *     referral flat points, referral window days).
 *  3. Redemption approvals feed (unchanged behaviour).
 *  4. Check-in approval feed (unchanged behaviour).
 *
 * IMPORTANT: no existing functionality changed. Only the UI was restyled to
 * the cream / forest-green / gold palette (red removed) and the affiliate
 * rate card was added on top of the existing admin affiliate-settings API.
 */
import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  CheckCircle2, XCircle, RefreshCw, QrCode as QrIcon, Wallet, Save, Gift,
} from 'lucide-react'
import {
  useAdminLoyaltyCheckins,
  useActionLoyaltyCheckin,
  useAdminLoyaltySettings,
  useUpdateLoyaltyPointValue,
  useAdminRedemptions,
  useActionRedemption,
  LOYALTY_STATUSES,
  REDEMPTION_STATUSES,
  loyaltyScanUrl,
} from '../../lib/loyalty'
import {
  useAdminAffiliateSettings,
  useUpdateAffiliateSettings,
} from '../../lib/affiliate'
import {
  Alert, Badge, Button, EmptyState, Input, QrCode, Select, Skeleton,
} from '../../components'

const STATUS_VARIANT = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
}

function fmtDay(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString(undefined, {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return String(d)
  }
}

function PointValueSettings() {
  const { data, isLoading } = useAdminLoyaltySettings()
  const update = useUpdateLoyaltyPointValue()

  const [draft, setDraft] = useState(null)
  const serverValue = data?.pointValueInr != null ? String(data.pointValueInr) : ''
  const value = draft ?? serverValue

  const save = () => {
    const v = Number(value)
    if (!Number.isFinite(v) || v <= 0) {
      toast.error('Enter a value greater than 0')
      return
    }
    update.mutate(
      { pointValueInr: v },
      {
        onSuccess: () => {
          toast.success('Point value updated')
          setDraft(null)
        },
        onError: (e) => toast.error(e?.response?.data?.message || 'Could not update'),
      },
    )
  }

  if (isLoading) return <Skeleton height="44px" />

  return (
    <div className="admin-loyalty-settings">
      <div className="admin-section__head">
        <div>
          <h2 className="admin-section__title">
            <Wallet size={18} aria-hidden="true" /> Point value (points → money)
          </h2>
          <p className="admin-section__hint">
            Sets how much one loyalty point is worth in real cash. Applies to
            both online checkout discounts and offline counter redemptions.
            Default: 1 point = ₹10.
          </p>
        </div>
      </div>
      <div className="admin-loyalty-settings__row">
        <span className="admin-loyalty-settings__prefix">1 point =&nbsp;₹</span>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Point value in rupees"
          className="admin-loyalty-settings__input"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={save}
          disabled={update.isPending || draft === null}
          leftIcon={<Save size={15} />}
        >
          Save
        </Button>
      </div>
    </div>
  )
}

/**
 * Affiliate + order->points rate config. Admin controls:
 *   - orderPointRate      : points per ₹ of a paid order (0 keeps legacy +1/order)
 *   - referralPointRate   : points per ₹ of a referred order
 *   - referralFlatPoints  : flat points per referred order (wins over rate when > 0)
 *   - referralWindowDays  : attribution window (default 15)
 */
function AffiliateSettingsCard() {
  const { data, isLoading } = useAdminAffiliateSettings()
  const update = useUpdateAffiliateSettings()
  const [draft, setDraft] = useState(null)

  const server = {
    orderPointRate: data?.orderPointRate ?? 0,
    referralPointRate: data?.referralPointRate ?? 0,
    referralFlatPoints: data?.referralFlatPoints ?? 0,
    referralWindowDays: data?.referralWindowDays ?? 15,
  }
  const form = draft ?? {
    orderPointRate: String(server.orderPointRate),
    referralPointRate: String(server.referralPointRate),
    referralFlatPoints: String(server.referralFlatPoints),
    referralWindowDays: String(server.referralWindowDays),
  }

  const setField = (k, v) => setDraft({ ...form, [k]: v })

  const save = () => {
    const payload = {
      orderPointRate: Number(form.orderPointRate),
      referralPointRate: Number(form.referralPointRate),
      referralFlatPoints: Math.trunc(Number(form.referralFlatPoints)),
      referralWindowDays: Math.trunc(Number(form.referralWindowDays)),
    }
    if (
      [payload.orderPointRate, payload.referralPointRate, payload.referralFlatPoints]
        .some((n) => !Number.isFinite(n) || n < 0)
    ) {
      toast.error('Rates and points must be 0 or more')
      return
    }
    if (!Number.isFinite(payload.referralWindowDays) || payload.referralWindowDays <= 0) {
      toast.error('Referral window must be at least 1 day')
      return
    }
    update.mutate(payload, {
      onSuccess: () => {
        toast.success('Affiliate settings saved')
        setDraft(null)
      },
      onError: (e) => toast.error(e?.response?.data?.message || 'Could not save'),
    })
  }

  if (isLoading) return <Skeleton height="120px" />

  return (
    <div className="admin-affiliate-settings">
      <div className="admin-section__head">
        <div>
          <h2 className="admin-section__title">
            <Gift size={18} aria-hidden="true" /> Affiliate &amp; order rewards
          </h2>
          <p className="admin-section__hint">
            Controls how many points customers earn. <b>Order rate</b> awards
            points for every paid order (0 keeps the legacy 1 point per order).
            <b> Referral</b> settings reward the affiliate when someone orders
            through their shared link within the attribution window.
          </p>
        </div>
      </div>

      <div className="admin-affiliate-grid">
        <label className="admin-affiliate-field">
          <span className="admin-affiliate-field__label">Order points rate</span>
          <span className="admin-affiliate-field__hint">points per ₹1 of order</span>
          <Input
            type="number" min="0" step="0.01"
            value={form.orderPointRate}
            onChange={(e) => setField('orderPointRate', e.target.value)}
            aria-label="Order points rate"
          />
        </label>

        <label className="admin-affiliate-field">
          <span className="admin-affiliate-field__label">Referral points rate</span>
          <span className="admin-affiliate-field__hint">points per ₹1 of referred order</span>
          <Input
            type="number" min="0" step="0.01"
            value={form.referralPointRate}
            onChange={(e) => setField('referralPointRate', e.target.value)}
            aria-label="Referral points rate"
          />
        </label>

        <label className="admin-affiliate-field">
          <span className="admin-affiliate-field__label">Referral flat points</span>
          <span className="admin-affiliate-field__hint">fixed points per referral (overrides rate)</span>
          <Input
            type="number" min="0" step="1"
            value={form.referralFlatPoints}
            onChange={(e) => setField('referralFlatPoints', e.target.value)}
            aria-label="Referral flat points"
          />
        </label>

        <label className="admin-affiliate-field">
          <span className="admin-affiliate-field__label">Referral window (days)</span>
          <span className="admin-affiliate-field__hint">cookie / attribution validity</span>
          <Input
            type="number" min="1" step="1"
            value={form.referralWindowDays}
            onChange={(e) => setField('referralWindowDays', e.target.value)}
            aria-label="Referral window days"
          />
        </label>
      </div>

      <div className="admin-affiliate-settings__actions">
        <Button
          variant="primary"
          size="sm"
          onClick={save}
          disabled={update.isPending || draft === null}
          leftIcon={<Save size={15} />}
        >
          Save affiliate settings
        </Button>
      </div>
    </div>
  )
}

function RedemptionFeed() {
  const [status, setStatus] = useState('PENDING')
  const { data, isLoading, isFetching, refetch, error } = useAdminRedemptions({ status })
  const action = useActionRedemption()
  const rows = data?.redemptions || []

  const handle = (redemptionId, act) => {
    action.mutate(
      { redemptionId, action: act },
      {
        onSuccess: () => toast.success(`Redemption ${act}d`),
        onError: () => toast.error('Could not update redemption'),
      },
    )
  }

  return (
    <div className="stack">
      <div className="admin-section__head">
        <div>
          <h2 className="admin-section__title">
            <Wallet size={18} aria-hidden="true" /> Point redemptions
          </h2>
          <p className="admin-section__hint">
            Offline requests reserve the points and wait here for your approval.
            Approve to confirm the counter discount; reject to refund the points.
            Online redemptions are auto-approved at payment.
          </p>
        </div>
        <div className="admin-loyalty__toolbar">
          <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {REDEMPTION_STATUSES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </Select>
          <Button
            variant="secondary" size="sm" onClick={() => refetch()}
            leftIcon={<RefreshCw size={15} className={isFetching ? 'spin-icon' : undefined} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">Could not load redemptions.</Alert>}

      {isLoading ? (
        <div className="stack">{[1, 2, 3].map((i) => <Skeleton key={i} height="64px" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No redemptions"
          description={status ? `Nothing with status ${status}.` : 'No points have been redeemed yet.'}
        />
      ) : (
        <div className="admin-table admin-table--redeem">
          <div className="admin-table__row admin-table__row--head">
            <span>Customer</span><span>Points</span><span>Cash</span>
            <span>Channel</span><span>Status</span><span>Action</span>
          </div>
          {rows.map((r) => (
            <div key={r.redemptionId} className="admin-table__row">
              <div className="admin-product-cell">
                <div>
                  <div className="admin-product-cell__name">{r.userName?.trim() || '—'}</div>
                  <div className="admin-product-cell__id">{r.userEmail}</div>
                </div>
              </div>
              <span className="text-muted">{r.pointsUsed}</span>
              <span className="text-muted">₹{Number(r.cashValue ?? 0).toLocaleString('en-IN')}</span>
              <span className="text-muted">{r.channel === 'ONLINE' ? 'Online order' : 'In store'}</span>
              <Badge variant={STATUS_VARIANT[r.status] || 'neutral'}>{r.status}</Badge>
              {r.status === 'PENDING' && r.channel === 'OFFLINE' ? (
                <div className="admin-loyalty__actions">
                  <Button variant="primary" size="sm" disabled={action.isPending}
                    leftIcon={<CheckCircle2 size={15} />} onClick={() => handle(r.redemptionId, 'approve')}>
                    Approve
                  </Button>
                  <Button variant="danger" size="sm" disabled={action.isPending}
                    leftIcon={<XCircle size={15} />} onClick={() => handle(r.redemptionId, 'reject')}>
                    Reject
                  </Button>
                </div>
              ) : (
                <span className="text-muted">—</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminLoyalty() {
  const [status, setStatus] = useState('PENDING')
  const { data, isLoading, isFetching, refetch, error } = useAdminLoyaltyCheckins({ status })
  const action = useActionLoyaltyCheckin()

  // Per-row in-store purchase amount the admin types before approving. Keyed by
  // checkinId so each pending row keeps its own draft independently.
  const [amounts, setAmounts] = useState({})
  const setAmount = (id, v) => setAmounts((prev) => ({ ...prev, [id]: v }))

  const rows = data?.checkins || []
  const scanUrl = loyaltyScanUrl()

  const handle = (checkinId, act) => {
    // On approve, pass the recorded spend so the visit earns points via the
    // same order_point_rate the online checkout uses. Reject ignores the amount.
    const raw = amounts[checkinId]
    let purchaseAmount
    if (act === 'approve' && raw != null && String(raw).trim() !== '') {
      const n = Number(raw)
      if (!Number.isFinite(n) || n < 0) {
        toast.error('Enter a valid purchase amount (0 or more)')
        return
      }
      purchaseAmount = n
    }
    action.mutate(
      { checkinId, action: act, purchaseAmount },
      {
        onSuccess: () => {
          toast.success(`Check-in ${act}d`)
          setAmounts((prev) => {
            const next = { ...prev }
            delete next[checkinId]
            return next
          })
        },
        onError: () => toast.error('Could not update check-in'),
      },
    )
  }

  return (
    <div className="stack">
      {/* ---- Store QR generator ------------------------------------ */}
      <div className="admin-loyalty-qr">
        <div className="admin-loyalty-qr__info">
          <div className="admin-section__head">
            <div>
              <h2 className="admin-section__title">
                <QrIcon size={18} aria-hidden="true" /> Store loyalty QR
              </h2>
              <p className="admin-section__hint">
                One QR for every customer. Print it at the counter — a logged-in
                customer scans it to request today&apos;s visit, then you approve or
                reject it below. Guests are sent to login first and returned
                automatically.
              </p>
            </div>
          </div>
          <p className="admin-loyalty-qr__url">{scanUrl}</p>
        </div>
        <QrCode
          value={scanUrl} size={200} level="M" downloadable copyable
          fileName="arusuvai-loyalty-qr.png" caption="Scan to check in"
        />
      </div>

      {/* ---- Point economics (value + affiliate rates) ------------- */}
      <PointValueSettings />
      <AffiliateSettingsCard />

      {/* ---- Redemptions ------------------------------------------- */}
      <RedemptionFeed />

      {/* ---- Check-in approval feed -------------------------------- */}
      <div className="admin-section__head">
        <div>
          <h2 className="admin-section__title">Loyalty check-ins</h2>
          <p className="admin-section__hint">
            {data?.total ?? 0} check-in{(data?.total ?? 0) === 1 ? '' : 's'} total.
          </p>
        </div>
        <div className="admin-loyalty__toolbar">
          <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {LOYALTY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Button variant="secondary" size="sm" onClick={() => refetch()}
            leftIcon={<RefreshCw size={15} className={isFetching ? 'spin-icon' : undefined} />}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">Could not load check-ins.</Alert>}

      {isLoading ? (
        <div className="stack">{[1, 2, 3].map((i) => <Skeleton key={i} height="64px" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No check-ins"
          description={status ? `Nothing with status ${status}.` : 'Nobody has checked in yet.'}
        />
      ) : (
        <div className="admin-table admin-table--loyalty">
          <div className="admin-table__row admin-table__row--head">
            <span>Customer</span><span>Day</span><span>Source</span><span>Purchase</span><span>Points</span><span>Status</span><span>Action</span>
          </div>
          {rows.map((r) => (
            <div key={r.checkinId} className="admin-table__row">
              <div className="admin-product-cell">
                <div>
                  <div className="admin-product-cell__name">{r.userName?.trim() || '—'}</div>
                  <div className="admin-product-cell__id">{r.userEmail}</div>
                </div>
              </div>
              <span className="text-muted">{fmtDay(r.visitDay)}</span>
              <span className="text-muted">{r.source === 'ORDER' ? 'Online order' : 'In-store scan'}</span>
              {/* Purchase: editable spend for a pending in-store visit; read-only otherwise. */}
              {r.status === 'PENDING' && r.source !== 'ORDER' ? (
                <Input
                  type="number" min="0" step="0.01"
                  placeholder="₹ spent"
                  value={amounts[r.checkinId] ?? ''}
                  onChange={(e) => setAmount(r.checkinId, e.target.value)}
                  aria-label="Purchase amount for this visit"
                  className="admin-loyalty__amount"
                />
              ) : (
                <span className="text-muted">
                  {r.purchaseAmount != null ? `₹${Number(r.purchaseAmount).toFixed(2)}` : '—'}
                </span>
              )}
              <span className="text-muted">
                {r.pointsAwarded != null ? `+${r.pointsAwarded}` : '—'}
              </span>
              <Badge variant={STATUS_VARIANT[r.status] || 'neutral'}>{r.status}</Badge>
              {r.status === 'PENDING' ? (
                <div className="admin-loyalty__actions">
                  <Button variant="primary" size="sm" disabled={action.isPending}
                    leftIcon={<CheckCircle2 size={15} />} onClick={() => handle(r.checkinId, 'approve')}>
                    Approve
                  </Button>
                  <Button variant="danger" size="sm" disabled={action.isPending}
                    leftIcon={<XCircle size={15} />} onClick={() => handle(r.checkinId, 'reject')}>
                    Reject
                  </Button>
                </div>
              ) : (
                <span className="text-muted">—</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
