/* ------------------------------------------------------------------
 * ConfirmModal - small centered confirmation dialog.
 *
 * Props:
 *   open          (bool)   - controlled visibility
 *   onClose       (fn)     - called on cancel / backdrop / Escape
 *   onConfirm     (fn)     - called when the confirm button is pressed
 *   title         (string) - heading
 *   message       (node)   - body text / content
 *   confirmLabel  (string) - confirm button text (default "Confirm")
 *   cancelLabel   (string) - cancel button text (default "Cancel")
 *   confirmVariant(string) - Button variant for confirm (default "danger")
 *   loading       (bool)   - shows a spinner on the confirm button
 * ------------------------------------------------------------------ */
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import IconButton from '../IconButton/IconButton.jsx'
import Button from '../Button/Button.jsx'
import './ConfirmModal.css'

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  hideCancel = false,
  loading = false,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    queueMicrotask(() => dialogRef.current?.focus())
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose, loading])

  if (!open) return null

  return createPortal(
    <div
      className="confirm__backdrop"
      onClick={() => { if (!loading) onClose?.() }}
    >
      <div
        className="confirm__dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm__head">
          <h2 className="confirm__title" id="confirm-title">{title}</h2>
          <IconButton
            variant="ghost"
            aria-label="Close"
            onClick={() => { if (!loading) onClose?.() }}
          >
            <X size={18} />
          </IconButton>
        </div>

        {message && <div className="confirm__body">{message}</div>}

        <div className="confirm__actions">
          {!hideCancel && (
            <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={confirmVariant}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
