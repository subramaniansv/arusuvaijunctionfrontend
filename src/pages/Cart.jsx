/**
 * Cart page (protected).
 *
 * Backend contract: see src/lib/cart.js. Cart shape arrives with
 * per-line subtotals and a server-computed totalAmount.
 *
 * Layout:
 *   - left:  scrollable item list (image, name, price, qty, subtotal, remove)
 *   - right: sticky order summary (subtotal, shipping, total, checkout)
 *
 * Mutations are optimistic so the UI feels instant; the server
 * response is the source of truth and overwrites the optimistic cart
 * on settle.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Trash2,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Tag as TagIcon,
} from 'lucide-react'

import {
  Container,
  Card,
  Button,
  IconButton,
  PriceTag,
  QuantityStepper,
  EmptyState,
  Skeleton,
  Alert,
  Divider,
  ConfirmModal,
} from '../components'
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
} from '../lib/cart'
import { MIN_SHIPPING_INR, FREE_ABOVE_INR } from '../lib/shipping'
import cartEmptyImg from '../assets/empty state/cart empty.svg'
import './Cart.css'

const PLACEHOLDER =
  "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'%3e%3crect width='4' height='3' fill='%23f5f5f0'/%3e%3c/svg%3e"

export default function Cart() {
  const { data, isLoading, isError, refetch } = useCart()
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()
  const clearCart = useClearCart()

  const items = data?.cartItems || []
  const subtotal = data?.totalAmount ?? items.reduce(
    (s, it) => s + (it.subtotal ?? it.price * it.quantity),
    0,
  )
  // Shipping is calculated at checkout from the customer's pincode.
  // On this page we only know the merchandise total, so we show the minimum
  // possible charge. If the order qualifies for free shipping (≥ FREE_ABOVE_INR)
  // we show "Free" proactively.
  const shippingIsFree = subtotal >= FREE_ABOVE_INR

  /* ---------------- loading / error ---------------- */
  if (isLoading) return <CartSkeleton />
  if (isError) {
    return (
      <Container size="lg">
        <Alert
          variant="danger"
          title="Could not load your cart"
          action={<Button size="sm" onClick={() => refetch()}>Retry</Button>}
        >
          Please check your connection and try again.
        </Alert>
      </Container>
    )
  }

  /* ---------------- empty state ---------------- */
  if (items.length === 0) {
    return (
      <Container size="lg" className="cart">
        <EmptyState
          image={cartEmptyImg}
          imageAlt="An empty shopping cart"
          title="Your cart is empty"
          description="Browse our handmade snacks and sweets to get started."
          action={
            <Button as={Link} to="/products" variant="primary" size="lg">
              Shop now
            </Button>
          }
        />
      </Container>
    )
  }

  return (
    <Container size="xl" className="cart">
      <div className="cart__layout">
        {/* -------- items column -------- */}
        <section className="cart__items" aria-label="Cart items">
          {/* Top action bar - keeps "Continue shopping" and "Clear cart"
              within thumb reach instead of buried below a long list. */}
          <div className="cart__actions cart__actions--top">
            <Button as={Link} to="/products" variant="ghost" leftIcon={<ArrowLeft size={16} />}>
              Continue shopping
            </Button>
            <ClearCartButton onClear={() => clearCart.mutate()} loading={clearCart.isPending} />
          </div>

          {items.map((it) => (
            <CartRow
              key={it.cartItemId || `${it.productId}-${it.variantId || 'base'}`}
              item={it}
              onQtyChange={(q) =>
                updateItem.mutate({
                  productId: it.productId,
                  variantId: it.variantId || null,
                  quantity: q,
                })
              }
              onRemove={() =>
                removeItem.mutate({
                  productId: it.productId,
                  variantId: it.variantId || null,
                })
              }
              busy={updateItem.isPending || removeItem.isPending}
            />
          ))}
        </section>

        {/* -------- summary column -------- */}
        <aside className="cart__summary" aria-label="Order summary">
          <Card padding="lg" className="cart__summary-card">
            <h2 className="cart__summary-title">Order Summary</h2>
            <SummaryLine label={`Subtotal (${items.length} item${items.length === 1 ? '' : 's'})`} value={subtotal} />
            <SummaryLine
              label="Shipping"
              free={shippingIsFree}
              estimate={shippingIsFree ? undefined : `from ₹${MIN_SHIPPING_INR}`}
            />
            <Divider />
            <SummaryLine label="Subtotal (excl. shipping)" value={subtotal} strong />
            {!shippingIsFree && (
              <p className="cart__shipping-note">Exact shipping calculated at checkout based on your location.</p>
            )}

            <Button
              as={Link}
              to="/checkout"
              variant="primary"
              size="lg"
              fullWidth
              className="cart__checkout"
            >
              Proceed to checkout
            </Button>

            <ul className="cart__perks">
              <li><Truck size={14} /> Free shipping over ₹{FREE_ABOVE_INR}</li>
              <li><ShieldCheck size={14} /> Secure checkout</li>
            </ul>
          </Card>
        </aside>
      </div>

      {/* Mobile-only sticky checkout bar (Zepto-style): keeps the primary
          CTA pinned to the bottom of the viewport for thumb reach. Hidden
          on >=900px where the sticky summary card holds the button. */}
      <div className="cart__mobile-bar" aria-label="Checkout">
        <div className="cart__mobile-bar-info">
          <span className="cart__mobile-bar-label">Subtotal</span>
          <span className="cart__mobile-bar-total">
            ₹{subtotal.toLocaleString('en-IN')}
          </span>
        </div>
        <Button
          as={Link}
          to="/checkout"
          variant="primary"
          size="lg"
          className="cart__mobile-bar-btn"
        >
          Checkout
        </Button>
      </div>
    </Container>
  )
}

/* ============================================================
 * Sub components
 * ============================================================ */

function CartRow({ item, onQtyChange, onRemove, busy }) {
  return (
    <article className="cart__row">
      <Link to={`/products/${item.productId}`} className="cart__row-img">
        <img
          src={item.imageUrl || PLACEHOLDER}
          alt={item.productName}
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
        />
      </Link>

      <div className="cart__row-body">
        <Link to={`/products/${item.productId}`} className="cart__row-name">
          {item.productName}
        </Link>
        {item.variantLabel && (
          <span className="cart__row-variant">{item.variantLabel}</span>
        )}
        <div className="cart__row-meta">
          <PriceTag amount={item.price} size="sm" />
          <span className="cart__row-each">each</span>
        </div>

        <div className="cart__row-controls">
          <QuantityStepper
            value={item.quantity}
            onChange={onQtyChange}
            min={1}
            max={99}
            disabled={busy}
            size="sm"
          />
          <IconButton
            aria-label="Remove from cart"
            onClick={onRemove}
            disabled={busy}
            className="cart__row-remove"
          >
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>

      <div className="cart__row-subtotal">
        <span className="cart__row-subtotal-label">Subtotal</span>
        <PriceTag
          amount={item.subtotal ?? item.price * item.quantity}
          size="md"
        />
      </div>
    </article>
  )
}

function SummaryLine({ label, value, strong, free, estimate }) {
  return (
    <div className={`cart__sum-line ${strong ? 'cart__sum-line--strong' : ''}`}>
      <span>{label}</span>
      {free ? (
        <span className="cart__sum-free">Free</span>
      ) : estimate != null ? (
        <span className="cart__sum-estimate">{estimate}</span>
      ) : (
        <PriceTag amount={value} size={strong ? 'lg' : 'md'} />
      )}
    </div>
  )
}

function ClearCartButton({ onClear, loading }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setConfirming(true)}
        leftIcon={<Trash2 size={16} />}
        disabled={loading}
      >
        Clear cart
      </Button>
      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => { onClear(); setConfirming(false) }}
        title="Clear your cart?"
        message="This removes all items from your cart. This action can't be undone."
        confirmLabel="Yes, clear cart"
        confirmVariant="danger"
        hideCancel
        loading={loading}
      />
    </>
  )
}

/* ---------------- skeleton ---------------- */
function CartSkeleton() {
  return (
    <Container size="xl" className="cart">
      <div className="cart__layout">
        <div className="cart__items">
          {[1, 2, 3].map((i) => (
            <div className="cart__row" key={i}>
              <Skeleton width={96} height={96} style={{ borderRadius: 'var(--radius-md)' }} />
              <div className="cart__row-body">
                <Skeleton width="70%" height={20} />
                <Skeleton width="30%" height={16} />
                <Skeleton width={140} height={36} />
              </div>
              <Skeleton width={80} height={28} />
            </div>
          ))}
        </div>
        <aside className="cart__summary">
          <Card padding="lg">
            <Skeleton width="60%" height={24} />
            <div style={{ height: 'var(--space-4)' }} />
            <Skeleton width="100%" height={16} />
            <div style={{ height: 'var(--space-2)' }} />
            <Skeleton width="100%" height={16} />
            <div style={{ height: 'var(--space-4)' }} />
            <Skeleton width="100%" height={48} />
          </Card>
        </aside>
      </div>
    </Container>
  )
}
