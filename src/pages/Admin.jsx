/**
 * Admin page (protected, requires Admin role).
 *
 * Lists all orders with status management, Delhivery Ship button,
 * and tracking display.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, Truck, Eye, Loader2, MapPin, ExternalLink, XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

import {
  Container, Card, Badge, Button, Select, Divider, Spinner, Alert,
} from '../components'
import {
  useAdminOrders, useUpdateOrderStatus, useCreateShipment, useCancelShipment,
  adminTrackOrder, ORDER_STATUSES,
} from '../lib/admin'
import { ORDER_STATUS_VARIANT, formatOrderDate, shortOrderId } from '../lib/orders'
import { variantGrams } from '../lib/shipping'
import './Admin.css'

export default function Admin() {
  const { data: orders = [], isLoading, isError } = useAdminOrders()
  const updateStatus = useUpdateOrderStatus()
  const createShipment = useCreateShipment()
  const cancelShipment = useCancelShipment()

  const [shippingOrderId, setShippingOrderId] = useState(null)
  const [cancellingOrderId, setCancellingOrderId] = useState(null)
  const [trackingData, setTrackingData] = useState({}) // { [orderId]: data }
  const [trackingLoading, setTrackingLoading] = useState({})

  const handleStatusChange = (orderId, status) => {
    updateStatus.mutate({ orderId, status }, {
      onSuccess: () => toast.success(`Status updated to ${status}`),
      onError: (e) => toast.error(e?.response?.data?.message || 'Failed to update status'),
    })
  }

  const handleShip = (order) => {
    setShippingOrderId(order.orderId)
    // Calculate weight from order items using variantGrams
    const weightGrams = (order.orderItems || []).reduce(
      (sum, it) => sum + variantGrams(it.variantLabel) * (it.quantity || 1), 0
    ) || 300 // fallback 300g minimum
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

  const handleCancelShipment = (orderId) => {
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

  if (isLoading) return <Container size="xl" className="admin"><Spinner /></Container>
  if (isError) return (
    <Container size="xl" className="admin">
      <Alert variant="danger" title="Failed to load orders" />
    </Container>
  )

  return (
    <Container size="xl" className="admin">
      <header className="admin__header">
        <h1 className="admin__title">Admin - Orders</h1>
        <p className="admin__sub">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
      </header>

      <div className="admin__orders">
        {orders.map((order) => {
          const tracking = trackingData[order.orderId]
          const isShipping = shippingOrderId === order.orderId
          const isTracking = trackingLoading[order.orderId]
          const hasAwb = !!order.trackingNumber
          const isCancelling = cancellingOrderId === order.orderId
          const canShip = ['CONFIRMED', 'PAID', 'PENDING', 'SHIPPED'].includes(order.status) && !hasAwb

          return (
            <Card key={order.orderId} padding="lg" className="admin__order">
              <div className="admin__order-top">
                <div className="admin__order-info">
                  <Link to={`/orders/${order.orderId}`} className="admin__order-id">
                    {shortOrderId(order.orderId)}
                  </Link>
                  <span className="admin__order-date">{formatOrderDate(order.orderedAt)}</span>
                  <Badge variant={ORDER_STATUS_VARIANT[order.status] || 'neutral'} size="sm">
                    {order.status}
                  </Badge>
                </div>
                <span className="admin__order-total">
                  ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="admin__order-addr">
                <MapPin size={14} />
                <span>{order.shippingAddress?.split('\n').slice(0, 2).join(', ')}</span>
                {order.phone && <span> · {order.phone}</span>}
              </div>

              {/* Items summary */}
              {order.orderItems?.length > 0 && (
                <p className="admin__order-items-summary">
                  <Package size={14} />
                  {order.orderItems.map(i => `${i.productName} ×${i.quantity}`).join(', ')}
                </p>
              )}

              <Divider />

              <div className="admin__order-actions">
                {/* Status dropdown */}
                <Select
                  size="sm"
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                  options={ORDER_STATUSES.map(s => ({ value: s, label: s }))}
                  className="admin__status-select"
                />

                {/* Ship button */}
                {canShip && (
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={isShipping ? <Loader2 size={14} className="admin__spin" /> : <Truck size={14} />}
                    onClick={() => handleShip(order)}
                    disabled={isShipping}
                  >
                    {isShipping ? 'Creating…' : 'Ship via Delhivery'}
                  </Button>
                )}

                {/* Cancel shipment button (when AWB exists) */}
                {hasAwb && (
                  <Button
                    size="sm"
                    variant="danger"
                    leftIcon={isCancelling ? <Loader2 size={14} className="admin__spin" /> : <XCircle size={14} />}
                    onClick={() => handleCancelShipment(order.orderId)}
                    disabled={isCancelling}
                  >
                    {isCancelling ? 'Cancelling…' : 'Cancel Shipment'}
                  </Button>
                )}

                {/* Track button (when AWB exists) */}
                {hasAwb && (
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={isTracking ? <Loader2 size={14} className="admin__spin" /> : <Eye size={14} />}
                    onClick={() => handleTrack(order.orderId)}
                    disabled={isTracking}
                  >
                    Track
                  </Button>
                )}

                {/* View order */}
                <Button
                  as={Link}
                  to={`/orders/${order.orderId}`}
                  size="sm"
                  variant="ghost"
                  leftIcon={<ExternalLink size={14} />}
                >
                  View
                </Button>
              </div>

              {/* AWB info */}
              {hasAwb && (
                <div className="admin__awb">
                  <span className="admin__awb-label">AWB:</span>
                  <a
                    href={`https://www.delhivery.com/track/package/${order.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin__awb-link"
                  >
                    {order.trackingNumber}
                    <ExternalLink size={12} />
                  </a>
                  {order.shippingProvider && (
                    <Badge variant="neutral" size="sm">{order.shippingProvider}</Badge>
                  )}
                </div>
              )}

              {/* Tracking details (expanded) */}
              {tracking && (
                <div className="admin__tracking">
                  <div className="admin__tracking-header">
                    <strong>Status:</strong> {tracking.status}
                    {tracking.expectedDeliveryDate && (
                      <span> · ETA: {tracking.expectedDeliveryDate}</span>
                    )}
                  </div>
                  {tracking.scans?.length > 0 && (
                    <ul className="admin__tracking-scans">
                      {tracking.scans.slice(0, 10).map((scan, i) => (
                        <li key={i} className="admin__tracking-scan">
                          <span className="admin__scan-time">{scan.dateTime}</span>
                          <span className="admin__scan-activity">{scan.activity}</span>
                          {scan.location && <span className="admin__scan-loc">{scan.location}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </Container>
  )
}
