/* ------------------------------------------------------------------
 * Select - custom dropdown (button + popup listbox) styled to match
 * the rest of the UI. A visually-hidden native <select> is kept in the
 * DOM as the form source-of-truth so the component stays fully
 * compatible with `e.target.value` handlers AND react-hook-form's
 * register() (ref / name / onChange / onBlur).
 *
 * API (unchanged from the old native version):
 *   <Select
 *     label hint error id placeholder className fullWidth disabled required
 *     value | defaultValue              // controlled or uncontrolled
 *     onChange={(e) => e.target.value}  // receives a real change event
 *     options={[{ value, label, disabled }]}  // or <option> children
 *   />
 * ------------------------------------------------------------------ */
import {
  forwardRef, useId, useRef, useState, useEffect, useCallback, Children,
} from 'react'
import clsx from 'clsx'
import { ChevronDown, Check } from 'lucide-react'
import '../Input/Input.css'
import './Select.css'

/* Turn <option> children into the same shape as the `options` prop. */
function childrenToOptions(children) {
  const out = []
  Children.forEach(children, (child) => {
    if (!child || typeof child !== 'object' || child.type !== 'option') return
    const { value, children: label, disabled } = child.props
    out.push({ value: value ?? '', label, disabled })
  })
  return out
}

const Select = forwardRef(function Select(
  {
    label,
    hint,
    error,
    id,
    options,
    placeholder,
    className,
    fullWidth = true,
    disabled,
    required,
    value,
    defaultValue,
    onChange,
    onBlur,
    name,
    children,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  const autoId = useId()
  const inputId = id || `sel-${autoId}`
  const listId = `${inputId}-list`

  const nativeRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const opts = options || childrenToOptions(children)
  const isControlled = value !== undefined

  const [internal, setInternal] = useState(defaultValue ?? '')
  const current = isControlled ? value : internal

  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)

  const describedBy = []
  if (hint) describedBy.push(`${inputId}-hint`)
  if (error) describedBy.push(`${inputId}-err`)

  /* Forward the node to both our local ref and the caller's ref. */
  const setRefs = useCallback(
    (node) => {
      nativeRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )

  const selectedOpt = opts.find((o) => String(o.value) === String(current))
  const displayLabel = selectedOpt ? selectedOpt.label : placeholder

  /* Set the native <select> value and fire a real change event so that
     `e.target.value` consumers and react-hook-form both update. */
  const commit = useCallback(
    (optValue) => {
      const node = nativeRef.current
      if (node) {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLSelectElement.prototype,
          'value',
        )?.set
        if (setter) setter.call(node, String(optValue))
        else node.value = String(optValue)
        node.dispatchEvent(new Event('change', { bubbles: true }))
      }
      if (!isControlled) setInternal(optValue)
    },
    [isControlled],
  )

  const handleNativeChange = (e) => {
    if (!isControlled) setInternal(e.target.value)
    onChange?.(e)
  }

  const closeMenu = useCallback(
    (focusTrigger = true) => {
      setOpen(false)
      setActiveIdx(-1)
      if (focusTrigger) triggerRef.current?.focus()
      onBlur?.({ target: nativeRef.current, type: 'blur' })
    },
    [onBlur],
  )

  const choose = (opt) => {
    if (opt.disabled) return
    commit(opt.value)
    closeMenu()
  }

  const openMenu = () => {
    if (disabled) return
    const idx = opts.findIndex((o) => String(o.value) === String(current))
    setActiveIdx(idx >= 0 ? idx : 0)
    setOpen(true)
  }

  /* Close on outside click. */
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (
        !menuRef.current?.contains(e.target) &&
        !triggerRef.current?.contains(e.target)
      ) {
        closeMenu(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, closeMenu])

  const moveActive = (dir) => {
    setActiveIdx((i) => {
      let next = i
      for (let step = 0; step < opts.length; step += 1) {
        next = (next + dir + opts.length) % opts.length
        if (!opts[next]?.disabled) return next
      }
      return i
    })
  }

  const onTriggerKeyDown = (e) => {
    if (disabled) return
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!open) openMenu()
        else if (e.key === 'Enter' || e.key === ' ') {
          if (opts[activeIdx]) choose(opts[activeIdx])
        } else moveActive(e.key === 'ArrowDown' ? 1 : -1)
        break
      case 'Escape':
        if (open) {
          e.preventDefault()
          closeMenu()
        }
        break
      default:
        break
    }
  }

  return (
    <div
      className={clsx(
        'ui-field',
        'ui-select',
        fullWidth && 'ui-field--full',
        error && 'is-invalid',
        disabled && 'is-disabled',
        className,
      )}
    >
      {label && (
        <label htmlFor={inputId} className="ui-field__label">
          {label}
          {required && (
            <span className="ui-field__req" aria-hidden="true"> *</span>
          )}
        </label>
      )}

      <div className="ui-select__wrap">
        <button
          type="button"
          ref={triggerRef}
          id={inputId}
          className={clsx(
            'ui-field__control',
            'ui-select__trigger',
            !selectedOpt && 'ui-select__trigger--placeholder',
          )}
          onClick={() => (open ? closeMenu(false) : openMenu())}
          onKeyDown={onTriggerKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-label={ariaLabel}
          aria-invalid={!!error || undefined}
          aria-required={required || undefined}
          aria-describedby={describedBy.join(' ') || undefined}
        >
          <span className="ui-select__value">{displayLabel || '\u00A0'}</span>
          <ChevronDown
            size={18}
            className="ui-select__chevron"
            aria-hidden="true"
          />
        </button>

        {open && (
          <ul
            ref={menuRef}
            id={listId}
            className="ui-select__menu"
            role="listbox"
            tabIndex={-1}
            aria-label={label || ariaLabel || 'Options'}
          >
            {opts.map((opt, i) => {
              const isSel = String(opt.value) === String(current)
              return (
                <li
                  key={`${opt.value}-${i}`}
                  role="option"
                  aria-selected={isSel}
                  className={clsx(
                    'ui-select__option',
                    isSel && 'is-selected',
                    i === activeIdx && 'is-active',
                    opt.disabled && 'is-disabled',
                  )}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(opt)}
                >
                  <span className="ui-select__option-label">{opt.label}</span>
                  {isSel && (
                    <Check
                      size={16}
                      aria-hidden="true"
                      className="ui-select__option-check"
                    />
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {/* Hidden native select = form source of truth. */}
        <select
          ref={setRefs}
          name={name}
          tabIndex={-1}
          aria-hidden="true"
          className="ui-select__native"
          disabled={disabled}
          required={required}
          {...(isControlled ? { value } : { defaultValue })}
          onChange={handleNativeChange}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {opts.map((opt, i) => (
            <option
              key={`${opt.value}-${i}`}
              value={opt.value}
              disabled={opt.disabled}
            >
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {hint && !error && (
        <p id={`${inputId}-hint`} className="ui-field__hint">{hint}</p>
      )}
      {error && (
        <p id={`${inputId}-err`} className="ui-field__error" role="alert">{error}</p>
      )}
    </div>
  )
})

export default Select
