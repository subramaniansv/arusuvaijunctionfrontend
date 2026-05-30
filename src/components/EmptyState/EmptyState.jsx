/* ------------------------------------------------------------------
 * EmptyState - friendly placeholder for empty lists.
 *
 * Usage (icon):
 *   <EmptyState
 *     icon={<ShoppingCart/>}
 *     title="Your cart is empty"
 *     description="Add some delicious traditional products to get started."
 *     action={<Button as={Link} to="/products">Shop now</Button>}
 *   />
 *
 * Usage (illustration): pass `image` (an imported asset URL) to render a
 * full illustration instead of the small icon badge.
 *   <EmptyState image={cartEmptyImg} imageAlt="Empty cart" title="..." />
 * ------------------------------------------------------------------ */
import clsx from 'clsx'
import './EmptyState.css'

export default function EmptyState({
  icon,
  image,
  imageAlt = '',
  title,
  description,
  action,
  className,
  ...rest
}) {
  return (
    <div className={clsx('ui-empty', className)} {...rest}>
      {image ? (
        <img
          className="ui-empty__image"
          src={image}
          alt={imageAlt}
          loading="lazy"
          decoding="async"
        />
      ) : (
        icon && <div className="ui-empty__icon">{icon}</div>
      )}
      {title && <h3 className="ui-empty__title">{title}</h3>}
      {description && <p className="ui-empty__desc">{description}</p>}
      {action && <div className="ui-empty__action">{action}</div>}
    </div>
  )
}
