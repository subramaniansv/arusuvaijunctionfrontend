/**
 * Saved addresses page.
 *
 * Extracted from the Account page so the address book has its own route
 * (/addresses) reachable from the account sidebar. CRUD address book;
 * addresses can be reused at checkout.
 */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  MapPin, Plus, Pencil, Trash2, Star, Loader2,
} from 'lucide-react'

import {
  useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress,
} from '../lib/addresses'
import { EmptyState, Button } from '../components'
import noAddressImg from '../assets/empty state/no saved address.svg'
import './Account.css'

/* ------------------------------------------------------------------ */
/* Address form schema                                                   */
/* ------------------------------------------------------------------ */
const addrSchema = z.object({
  label:    z.string().trim().max(80).optional().or(z.literal('')),
  fullName: z.string().trim().min(2, 'Name is required').max(120),
  phone:    z.string().trim().regex(/^[+0-9 \-()]{7,20}$/, 'Valid phone required'),
  line1:    z.string().trim().min(3, 'Address line 1 is required').max(160),
  line2:    z.string().trim().max(160).optional().or(z.literal('')),
  city:     z.string().trim().min(2, 'City is required').max(80),
  state:    z.string().trim().min(2, 'State is required').max(80),
  pincode:  z.string().trim().min(3, 'Pincode is required').max(20),
  country:  z.string().min(2, 'Country is required'),
  isDefault: z.boolean().optional(),
})

const ADDR_DEFAULTS = {
  label: '', fullName: '', phone: '', line1: '', line2: '',
  city: '', state: '', pincode: '', country: 'IN', isDefault: false,
}

/* ------------------------------------------------------------------ */
/* AddressForm – inline form (create or edit)                           */
/* ------------------------------------------------------------------ */
function AddressForm({ initial, onSave, onCancel, saving }) {
  const {
    register, handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addrSchema),
    defaultValues: initial || ADDR_DEFAULTS,
  })

  return (
    <form className="addr-form" onSubmit={handleSubmit(onSave)} noValidate>
      <div className="addr-form__row addr-form__row--2">
        <div className="form-field">
          <label htmlFor="af-label">Label (optional)</label>
          <input id="af-label" placeholder="Home / Office…" {...register('label')} />
        </div>
        <div className="form-field">
          <label htmlFor="af-fullName">Full name <span className="form-req" aria-hidden="true">*</span></label>
          <input id="af-fullName" {...register('fullName')} aria-invalid={!!errors.fullName || undefined} />
          {errors.fullName && <p className="form-error">{errors.fullName.message}</p>}
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="af-phone">Phone <span className="form-req" aria-hidden="true">*</span></label>
        <input id="af-phone" type="tel" inputMode="tel" {...register('phone')} aria-invalid={!!errors.phone || undefined} />
        {errors.phone && <p className="form-error">{errors.phone.message}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="af-line1">Address line 1 <span className="form-req" aria-hidden="true">*</span></label>
        <input id="af-line1" placeholder="Door no, street, area" {...register('line1')} aria-invalid={!!errors.line1 || undefined} />
        {errors.line1 && <p className="form-error">{errors.line1.message}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="af-line2">Address line 2</label>
        <input id="af-line2" placeholder="Landmark, apartment (optional)" {...register('line2')} />
      </div>

      <div className="addr-form__row addr-form__row--3">
        <div className="form-field">
          <label htmlFor="af-city">City <span className="form-req" aria-hidden="true">*</span></label>
          <input id="af-city" {...register('city')} aria-invalid={!!errors.city || undefined} />
          {errors.city && <p className="form-error">{errors.city.message}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="af-state">State <span className="form-req" aria-hidden="true">*</span></label>
          <input id="af-state" {...register('state')} aria-invalid={!!errors.state || undefined} />
          {errors.state && <p className="form-error">{errors.state.message}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="af-pincode">Pincode <span className="form-req" aria-hidden="true">*</span></label>
          <input id="af-pincode" inputMode="numeric" {...register('pincode')} aria-invalid={!!errors.pincode || undefined} />
          {errors.pincode && <p className="form-error">{errors.pincode.message}</p>}
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="af-country">Country <span className="form-req" aria-hidden="true">*</span></label>
        <input id="af-country" {...register('country')} aria-invalid={!!errors.country || undefined} />
        {errors.country && <p className="form-error">{errors.country.message}</p>}
      </div>

      <div className="form-field addr-form__checkbox">
        <label>
          <input type="checkbox" {...register('isDefault')} />
          Set as default address
        </label>
      </div>

      <div className="addr-form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving && <Loader2 size={15} className="spin" aria-hidden="true" />}
          Save address
        </button>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* AddressCard – single address display row                             */
/* ------------------------------------------------------------------ */
function AddressCard({ addr, onEdit, onDelete, deleting }) {
  const lines = [
    addr.line1,
    addr.line2,
    [addr.city, addr.state, addr.pincode].filter(Boolean).join(', '),
    addr.country,
  ].filter(Boolean)

  return (
    <div className={`addr-card${addr.default ? ' addr-card--default' : ''}`}>
      <div className="addr-card__body">
        <p className="addr-card__name">
          {addr.default && <Star size={13} className="addr-card__star" aria-label="Default" />}
          {addr.fullName}
          {addr.label && <span className="addr-card__label">{addr.label}</span>}
        </p>
        <p className="addr-card__phone">{addr.phone}</p>
        {lines.map((l, i) => <p key={i} className="addr-card__line">{l}</p>)}
      </div>
      <div className="addr-card__actions">
        <button className="addr-card__btn" onClick={onEdit} aria-label="Edit address">
          <Pencil size={15} />
        </button>
        <button
          className="addr-card__btn addr-card__btn--del"
          onClick={onDelete}
          disabled={deleting}
          aria-label="Delete address"
        >
          {deleting ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Addresses page                                                       */
/* ------------------------------------------------------------------ */
export default function Addresses() {
  const { data: addresses = [], isLoading } = useAddresses()
  const createAddr  = useCreateAddress()
  const updateAddr  = useUpdateAddress()
  const deleteAddr  = useDeleteAddress()

  const [mode, setMode] = useState(null)   // null | 'new' | { editing: addr }
  const [deletingId, setDeletingId] = useState(null)

  const handleSave = async (values) => {
    if (mode === 'new') {
      await createAddr.mutateAsync(values)
    } else {
      await updateAddr.mutateAsync({ addressId: mode.editing.addressId, ...values })
    }
    setMode(null)
  }

  const handleDelete = async (addressId) => {
    setDeletingId(addressId)
    try {
      await deleteAddr.mutateAsync(addressId)
    } finally {
      setDeletingId(null)
    }
  }

  const saving = createAddr.isPending || updateAddr.isPending

  const isEmpty = !isLoading && addresses.length === 0 && mode === null

  return (
    <section className="account stack">
      {isEmpty ? (
        <EmptyState
          image={noAddressImg}
          imageAlt="No saved addresses"
          title="No saved addresses yet"
          description="Add one to speed up checkout."
          action={
            <Button onClick={() => setMode('new')} leftIcon={<Plus size={16} />}>
              Add address
            </Button>
          }
        />
      ) : (
        <div className="account-card">
          <div className="account-card__header account-card__header--simple">
            <MapPin size={18} aria-hidden="true" />
            <h2 className="account-card__name">Address book</h2>
            {mode === null && (
              <button
                className="btn btn--ghost btn--sm addr-add-btn"
                onClick={() => setMode('new')}
              >
                <Plus size={15} aria-hidden="true" /> Add address
              </button>
            )}
          </div>

          {isLoading && <p className="addr-empty">Loading…</p>}

          {!isLoading && addresses.map((addr) =>
            mode?.editing?.addressId === addr.addressId ? (
              <AddressForm
                key={addr.addressId}
                initial={{
                  label: addr.label || '',
                  fullName: addr.fullName,
                  phone: addr.phone,
                  line1: addr.line1,
                  line2: addr.line2 || '',
                  city: addr.city,
                  state: addr.state,
                  pincode: addr.pincode,
                  country: addr.country,
                  isDefault: addr.default,
                }}
                onSave={handleSave}
                onCancel={() => setMode(null)}
                saving={saving}
              />
            ) : (
              <AddressCard
                key={addr.addressId}
                addr={addr}
                onEdit={() => setMode({ editing: addr })}
                onDelete={() => handleDelete(addr.addressId)}
                deleting={deletingId === addr.addressId}
              />
            )
          )}

          {mode === 'new' && (
            <AddressForm
              onSave={handleSave}
              onCancel={() => setMode(null)}
              saving={saving}
            />
          )}
        </div>
      )}
    </section>
  )
}
