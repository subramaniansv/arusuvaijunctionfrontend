/**
 * Admin orders page.
 *
 * Lists every order returned by GET /api/admin?type=order with the
 * customer's email/name (when present), totals, item count, and an
 * inline status changer. Hitting "Update" calls PUT /api/admin with
 * the new status; the backend handles stock refunds on CANCELLED.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Truck, Eye, XCircle, Loader2, ExternalLink,
} from 'lucide-react'
import {
  ORDER_STATUSES,
  useAdminOrders,
  useUpdateOrderStatus,
  useCreateShipment,
  useCancelShipment,
  adminTrackOrder,
} from '../../lib/admin'
import {
  formatOrderDate,
  shortOrderId,
  ORDER_STATUS_VARIANT,
} from '../../lib/orders'
import { variantGrams } from '../../lib/shipping'
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  PriceTag,
  Select,
  Skeleton,
} from '../../components'

function StatusEditor({ order }) {
  const [status, setStatus] = useState(order.status)
  const mut = useUpdateOrderStatus()
  const dirty = status !== order.status

  const save = async () => {
    try {
      await mut.mutateAsync({ orderId: order.orderId, status })
      toast.success(`Order ${shortOrderId(order.orderId)} → ${status}`)
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not update status')
      setStatus(order.status)
    }
  }

  return (
    <div className="admin-status-editor">
      <Select
        aria-label="Order status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        disabled={mut.isPending}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
      <Button
        variant="primary"
        size="sm"
        disabled={!dirty}
        loading={mut.isPending}
        onClick={save}
      >
        Update
      </Button>
    </div>
  )
}

export default function AdminOrders() {
  const { data: orders = [], isLoading, error } = useAdminOrders({ limit: 100 })
  const createShipment = useCreateShipment()
  const cancelShipment = useCancelShipment()
  const [shippingOrderId, setShippingOrderId] = useState(null)
  const [cancellingOrderId, setCancellingOrderId] = useState(null)
  const [trackingData, setTrackingData] = useState({})
  const [trackingLoading, setTrackingLoading] = useState({})

  const handleShip = (order) => {
    setShippingOrderId(order.orderId)
    const weightGrams = (order.orderItems || []).reduce(
      (sum, it) => sum + variantGrams(it.variantLabel) * (it.quantity || 1), 0
    ) || 300
    createShipment.mutate({ orderId: order.orderId, weightGrams }, {
      onSuccess: (data) => {
        toast.success(`Shipment created! AWB: ${data?.waybill}`)
        setShippingOrderId(null)
      },
      onError: (e) => {
        toast.error(e?.response?.data?.message || 'Failed to create shipment')
        setShippingOrderId(null)
      },
    })
  }

  const handleCancel = (orderId) => {
    setCancellingOrderId(orderId)
    cancelShipment.mutate({ orderId }, {
      onSuccess: () => {
        toast.success('Shipment cancelled')
        setCancellingOrderId(null)
        setTrackingData((p) => { const c = { ...p }; delete c[orderId]; return c })
      },
      onError: (e) => {
        toast.error(e?.response?.data?.message || 'Failed to cancel shipment')
        setCancellingOrderId(null)
      },
    })
  }

  const handleTrack = async (orderId) => {
    setTrackingLoading((p) => ({ ...p, [orderId]: true }))
    try {
      const data = await adminTrackOrder(orderId)
      setTrackingData((p) => ({ ...p, [orderId]: data }))
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Tracking failed')
    } finally {
      setTrackingLoading((p) => ({ ...p, [orderId]: false }))
    }
  }

  return (
    <div className="stack">
      <div className="admin-section__head">
        <div>
          <h2 className="admin-section__title">Orders</h2>
          <p className="admin-section__hint">
            {orders.length} order{orders.length === 1 ? '' : 's'} found.
          </p>
        </div>
      </div>

      {error && <Alert variant="danger">Could not load orders.</Alert>}

      {isLoading ? (
        <div className="stack">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height="72px" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Once customers place orders, they will appear here."
        />
      ) : (
        <div className="admin-table admin-table--orders">
          <div className="admin-table__row admin-table__row--head">
            <span>Order</span>
            <span>Placed</span>
            <span>Items</span>
            <span>Total</span>
            <span>Current</span>
            <span>Change status</span>
          </div>
          {orders.map((o) => {
            const items = o.orderItems || []
            const itemCount = items.reduce(
              (n, it) => n + (Number(it.quantity) || 0),
              0,
            )
            const hasAwb = !!o.trackingNumber
            const canShip = ['CONFIRMED', 'PAID', 'PENDING', 'SHIPPED'].includes(o.status) && !hasAwb
            const isShipping = shippingOrderId === o.orderId
            const isCancelling = cancellingOrderId === o.orderId
            const isTracking = trackingLoading[o.orderId]
            const tracking = trackingData[o.orderId]

            return (
              <div key={o.orderId} className="admin-table__row admin-table__row--expanded">
                <div className="admin-table__row-main">
                  <div className="admin-product-cell">
                    <div>
                      <div className="admin-product-cell__name">
                        <Link to={`/orders/${o.orderId}`}>
                          {shortOrderId(o.orderId)}
                        </Link>
                      </div>
                      <div className="admin-product-cell__id">
                        user {String(o.userId || '').slice(0, 8)}…
                      </div>
                    </div>
                  </div>
                  <span className="text-muted">{formatOrderDate(o.orderedAt)}</span>
                  <span>
                    {itemCount} item{itemCount === 1 ? '' : 's'}
                  </span>
                  <PriceTag amount={Number(o.totalAmount) || 0} />
                  <Badge variant={ORDER_STATUS_VARIANT[o.status] || 'neutral'}>
                    {o.status}
                  </Badge>
                  <StatusEditor order={o} />
                </div>

                {/* Shipping actions row */}
                <div className="admin-table__shipping-row">
                  {canShip && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleShip(o)}
                      disabled={isShipping}
                    >
                      {isShipping
                        ? <><Loader2 size={14} className="spin-icon" /> Creating…</>
                        : <><Truck size={14} /> Ship via Delhivery</>
                      }
                    </Button>
                  )}

                  {hasAwb && (
                    <>
                      <span className="admin-awb-info">
                        AWB:{' '}
                        <a
                          href={`https://www.delhivery.com/track/package/${o.trackingNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {o.trackingNumber} <ExternalLink size={11} />
                        </a>
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTrack(o.orderId)}
                        disabled={isTracking}
                      >
                        {isTracking
                          ? <><Loader2 size={14} className="spin-icon" /> Tracking…</>
                          : <><Eye size={14} /> Track</>
                        }
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleCancel(o.orderId)}
                        disabled={isCancelling}
                      >
                        {isCancelling
                          ? <><Loader2 size={14} className="spin-icon" /> Cancelling…</>
                          : <><XCircle size={14} /> Cancel Shipment</>
                        }
                      </Button>
                    </>
                  )}
                </div>

                {/* Tracking details */}
                {tracking && (
                  <div className="admin-table__tracking">
                    <p><strong>Status:</strong> {tracking.tracking?.status || tracking.status}
                      {(tracking.tracking?.expectedDeliveryDate || tracking.expectedDeliveryDate) &&
                        <span> · ETA: {tracking.tracking?.expectedDeliveryDate || tracking.expectedDeliveryDate}</span>
                      }
                    </p>
                    {(tracking.tracking?.scans || tracking.scans)?.length > 0 && (
                      <ul className="admin-tracking-scans">
                        {(tracking.tracking?.scans || tracking.scans).slice(0, 10).map((scan, i) => (
                          <li key={i}>
                            <span className="admin-scan-time">{scan.dateTime}</span>
                            <span className="admin-scan-activity">{scan.activity}</span>
                            {scan.location && <span className="admin-scan-loc">{scan.location}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
