/**
 * Orders list page (protected).
 *
 * Renders the authenticated user's past orders, most-recent first
 * (backend already orders by orderedAt DESC).
 */
import { Link } from 'react-router-dom'

import {
  Container,
  Card,
  Button,
  Skeleton,
  Alert,
  EmptyState,
} from '../components'
import {
  useOrders,
  ORDER_STATUS_VARIANT,
  formatOrderDate,
  shortOrderId,
} from '../lib/orders'
import noOrdersImg from '../assets/empty state/no ordrs.svg'
import './Orders.css'

const PLACEHOLDER =
  "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'%3e%3crect width='4' height='3' fill='%23f5f5f0'/%3e%3c/svg%3e"

export default function Orders() {
  const { data: orders = [], isLoading, isError, refetch } = useOrders()

  if (isLoading) return <OrdersSkeleton />
  if (isError) {
    return (
      <Container size="lg" className="orders">
        <PageHeader />
        <Alert variant="danger" title="Could not load your orders">
          <p style={{ margin: '0 0 var(--space-3)' }}>
            Please check your connection and try again.
          </p>
          <Button size="sm" onClick={() => refetch()}>Retry</Button>
        </Alert>
      </Container>
    )
  }

  if (orders.length === 0) {
    return (
      <Container size="lg" className="orders">
        <PageHeader />
        <EmptyState
          image={noOrdersImg}
          imageAlt="No orders placed yet"
          title="No orders yet"
          description="When you place an order, it'll show up here."
          action={
            <Button as={Link} to="/products" variant="primary" size="lg">
              Start shopping
            </Button>
          }
        />
      </Container>
    )
  }

  return (
    <Container size="xl" className="orders">
      <PageHeader count={orders.length} />
      <ul className="orders__list">
        {orders.map((o) => (
          <li key={o.orderId}>
            <OrderRow order={o} />
          </li>
        ))}
      </ul>
      <p className="orders__contact">
        For order-related queries, call or WhatsApp us at{' '}
        <a href="tel:+919894014063">+91 98940 14063</a>.
      </p>
    </Container>
  )
}

/* =============== sub components =============== */

function PageHeader({ count }) {
  return (
    <header className="orders__header">
      <div>
        {count > 0 && (
          <p className="orders__sub">
            {count} order{count === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </header>
  )
}

function OrderRow({ order }) {
  const items = order.orderItems || []
  const statusVariant = ORDER_STATUS_VARIANT[order.status] || 'neutral'

  return (
    <Card padding="lg" className="orders__card">
      <div className="orders__card-head">
        <dl className="orders__facts">
          <div className="orders__fact">
            <dt>Order id:</dt>
            <dd className="orders__fact-strong">{shortOrderId(order.orderId)}</dd>
          </div>
          <span className="orders__fact-sep" aria-hidden="true" />
          <div className="orders__fact">
            <dt>Ordered on:</dt>
            <dd>{formatOrderDate(order.orderedAt)}</dd>
          </div>
          <span className="orders__fact-sep" aria-hidden="true" />
          <div className="orders__fact">
            <dt>Order Status:</dt>
            <dd className={`orders__status orders__status--${statusVariant}`}>
              {order.status}
            </dd>
          </div>
          <span className="orders__fact-sep" aria-hidden="true" />
          <div className="orders__fact">
            <dt>Bill Total:</dt>
            <dd className="orders__fact-strong">
              ₹{Number(order.totalAmount).toLocaleString('en-IN')}
            </dd>
          </div>
        </dl>

        <OrderAction order={order} />
      </div>

      <ul className="orders__items">
        {items.map((it, i) => (
          <li
            key={it.orderItemId || it.productId || i}
            className="orders__item"
          >
            <Link
              to={`/products/${it.productId}`}
              className="orders__item-thumb"
              aria-label={it.productName}
            >
              <img
                src={it.imageUrl || PLACEHOLDER}
                alt=""
                loading="lazy"
                decoding="async"
                onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
              />
            </Link>
            <div className="orders__item-body">
              <Link
                to={`/products/${it.productId}`}
                className="orders__item-name"
              >
                {it.productName}
              </Link>
              <span className="orders__item-meta">
                Qty {it.quantity}
                {it.variantLabel ? ` · ${it.variantLabel}` : ''}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/* Single, status-agnostic action: every order just links to its
 * detail page. Reorder/Track shortcuts were removed as they aren't
 * needed for now. */
function OrderAction({ order }) {
  return (
    <Button
      as={Link}
      to={`/orders/${order.orderId}`}
      variant="secondary"
      size="sm"
    >
      View Details
    </Button>
  )
}

function OrdersSkeleton() {
  return (
    <Container size="xl" className="orders">
      <header className="orders__header">
        <Skeleton width={200} height={32} />
      </header>
      <ul className="orders__list">
        {[1, 2, 3].map((i) => (
          <li key={i}>
            <Card padding="lg" className="orders__card">
              <div className="orders__card-head">
                <Skeleton width={320} height={20} />
                <Skeleton width={96} height={36} />
              </div>
              <div className="orders__item">
                <Skeleton width={48} height={48} />
                <Skeleton width={160} height={20} />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </Container>
  )
}
