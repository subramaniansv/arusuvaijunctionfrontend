/**
 * Admin › Festival
 *
 * Simple, food-business model:
 *   • One festival is "live" at a time (the spotlight).
 *   • Admin turns a festival ON — it instantly becomes the one shown on the
 *     public /festival page, and every other festival turns OFF automatically.
 *   • For each festival admin uploads background images and disables old ones.
 *
 * No message authoring here — visitors write their own messages on /festival.
 * A read-only "Shared greetings" list lets admin disable abusive ones.
 */
import { useRef, useState, useEffect } from 'react'
import {
  UploadCloud, X, Trash2, Radio, CheckCircle2, Image as ImageIcon,
} from 'lucide-react'
import toast from 'react-hot-toast'

import {
  useAdminFestivals, useCreateFestival, useSpotlightFestival,
  useAdminFestivalImages, useUploadFestivalImage, useDeleteFestivalImage,
  useAdminMessages, useToggleMessage,
} from '../../lib/banner'
import './AdminBanner.css'

export default function AdminBanner() {
  const { data: festivals = [], isLoading } = useAdminFestivals()
  const createFest = useCreateFestival()
  const spotlight  = useSpotlightFestival()

  const liveFest = festivals.find(f => f.isActive) ?? null

  /* which festival's images is admin currently managing */
  const [selectedId, setSelectedId] = useState('')
  useEffect(() => {
    // default selection → the live one, else the first festival
    if (!selectedId && festivals.length) {
      setSelectedId((liveFest ?? festivals[0]).festivalId)
    }
  }, [festivals, liveFest, selectedId])

  /* add-festival inline form */
  const [showNew, setShowNew] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  const handleCreate = async e => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Name is required'); return }
    try {
      const fest = await createFest.mutateAsync({
        name: name.trim(), slug: slug.trim(), displayOrder: festivals.length,
      })
      toast.success(`"${name}" added — turn it on to go live`)
      setName(''); setSlug(''); setShowNew(false)
      if (fest?.festivalId) setSelectedId(fest.festivalId)
    } catch {
      toast.error('Create failed — slug may already exist')
    }
  }

  const goLive = f => {
    spotlight.mutate(
      { festivalId: f.festivalId, active: true },
      { onSuccess: () => toast.success(`${f.name} is now live on the site`) }
    )
  }
  const turnOff = f => {
    spotlight.mutate(
      { festivalId: f.festivalId, active: false },
      { onSuccess: () => toast.success(`${f.name} turned off — nothing is live now`) }
    )
  }

  const selectedFest = festivals.find(f => f.festivalId === selectedId) ?? null

  return (
    <div className="ab-root">
      <div className="ab-head">
        <h2>Festival Spotlight</h2>
        <p className="ab-muted">
          Turn on one festival to feature it on the site. Upload the background
          images customers will choose from.
        </p>
      </div>

      {/* Live status banner */}
      <div className={`ab-live-banner${liveFest ? ' is-on' : ''}`}>
        <Radio size={18} />
        {liveFest
          ? <span>Currently live: <strong>{liveFest.name}</strong></span>
          : <span>No festival is live right now.</span>}
      </div>

      {/* Festival chooser / spotlight switch */}
      <section className="ab-section">
        <div className="ab-section-head">
          <h3>Festivals</h3>
          <button className="ab-link-btn" onClick={() => setShowNew(v => !v)}>
            {showNew ? 'Cancel' : '+ Add festival'}
          </button>
        </div>

        {showNew && (
          <form className="ab-row-form" onSubmit={handleCreate}>
            <input
              className="ab-input"
              placeholder="Name — e.g. Pongal"
              value={name}
              onChange={e => {
                const v = e.target.value
                setName(v)
                setSlug(v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
              }}
            />
            <input
              className="ab-input"
              placeholder="slug — pongal"
              value={slug}
              onChange={e => setSlug(e.target.value)}
            />
            <button className="ab-btn-primary" type="submit" disabled={createFest.isPending}>
              {createFest.isPending ? '…' : 'Add'}
            </button>
          </form>
        )}

        {isLoading ? (
          <p className="ab-muted">Loading…</p>
        ) : festivals.length === 0 ? (
          <p className="ab-muted">No festivals yet. Add one above.</p>
        ) : (
          <div className="ab-fest-grid">
            {festivals.map(f => {
              const isSel  = f.festivalId === selectedId
              const isLive = f.isActive
              return (
                <div
                  key={f.festivalId}
                  className={`ab-fest-card${isLive ? ' is-live' : ''}${isSel ? ' is-selected' : ''}`}
                >
                  <button
                    type="button"
                    className="ab-fest-pick"
                    onClick={() => setSelectedId(f.festivalId)}
                    title="Manage this festival's images"
                  >
                    <span className="ab-fest-name">{f.name}</span>
                    <code className="ab-fest-slug">{f.slug}</code>
                    {isLive && (
                      <span className="ab-live-tag"><CheckCircle2 size={12} /> Live</span>
                    )}
                  </button>

                  {isLive ? (
                    <button
                      className="ab-switch ab-switch--off"
                      disabled={spotlight.isPending}
                      onClick={() => turnOff(f)}
                    >
                      Turn off
                    </button>
                  ) : (
                    <button
                      className="ab-switch ab-switch--on"
                      disabled={spotlight.isPending}
                      onClick={() => goLive(f)}
                    >
                      Go live
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Images for the selected festival */}
      {selectedFest && (
        <ImagesManager festival={selectedFest} />
      )}

      {/* Shared greetings (read-only moderation) */}
      <SharedGreetings />
    </div>
  )
}

/* ─── Images manager for one festival ───────────────────────────── */
function ImagesManager({ festival }) {
  const { data: images = [], isLoading } = useAdminFestivalImages(festival.festivalId)
  const upload = useUploadFestivalImage()
  const remove = useDeleteFestivalImage()

  const [label, setLabel]     = useState('')
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()

  const pickFile = f => { setFile(f); setPreview(URL.createObjectURL(f)) }
  const clearFile = () => { setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = '' }

  const handleUpload = async e => {
    e.preventDefault()
    if (!file) { toast.error('Choose an image'); return }
    try {
      await upload.mutateAsync({
        festivalId: festival.festivalId,
        file, label, displayOrder: images.length,
      })
      toast.success('Image uploaded ✓')
      clearFile(); setLabel('')
    } catch {
      toast.error('Upload failed')
    }
  }

  const handleRemove = async img => {
    if (!confirm('Remove this image?')) return
    try {
      await remove.mutateAsync({ imageId: img.imageId })
      toast.success('Image removed')
    } catch {
      toast.error('Remove failed')
    }
  }

  return (
    <section className="ab-section">
      <h3>
        <ImageIcon size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />
        Images — {festival.name}
      </h3>

      <form onSubmit={handleUpload} className="ab-upload-form">
        <div
          className="ab-dropzone"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) pickFile(f) }}
        >
          {preview ? (
            <img src={preview} alt="preview" className="ab-dropzone-preview" />
          ) : (
            <>
              <UploadCloud size={26} className="ab-muted-icon" />
              <span>Click or drag an image here</span>
              <span className="ab-muted">PNG · JPG · WebP · max 10 MB</span>
            </>
          )}
          <input
            ref={fileRef} type="file" accept="image/*" hidden
            onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f) }}
          />
        </div>

        <div className="ab-upload-controls">
          <input
            className="ab-input"
            placeholder="Label (optional)"
            value={label}
            onChange={e => setLabel(e.target.value)}
          />
          {file && (
            <span className="ab-filename">
              {file.name}
              <button type="button" className="ab-clear" onClick={clearFile}><X size={12} /></button>
            </span>
          )}
          <button className="ab-btn-primary" type="submit" disabled={upload.isPending}>
            <UploadCloud size={14} />{upload.isPending ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </form>

      {isLoading ? (
        <p className="ab-muted">Loading…</p>
      ) : images.length === 0 ? (
        <p className="ab-muted">No images yet. Upload one above.</p>
      ) : (
        <div className="ab-grid">
          {images.map(img => (
            <div key={img.imageId} className={`ab-img-card${!img.isActive ? ' is-disabled' : ''}`}>
              <img src={img.imageUrl} alt={img.label || festival.name} loading="lazy" />
              <div className="ab-img-footer">
                <span className="ab-muted ab-img-label">{img.label || '—'}</span>
                <button
                  className="ab-icon-btn ab-icon-btn--danger"
                  onClick={() => handleRemove(img)}
                  disabled={remove.isPending}
                  title="Remove image"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {!img.isActive && <span className="ab-disabled-badge">disabled</span>}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/* ─── Shared greetings (read-only moderation) ───────────────────── */
function SharedGreetings() {
  const { data: messages = [], isLoading } = useAdminMessages()
  const toggle = useToggleMessage()
  const shareBase = `${window.location.origin}/festival?msg=`

  if (!isLoading && messages.length === 0) return null

  const disable = m =>
    toggle.mutate(
      { messageId: m.messageId, active: !m.isActive },
      {
        onSuccess: () => toast.success(`Greeting ${!m.isActive ? 'restored' : 'hidden'}`),
        onError:   () => toast.error('Failed'),
      }
    )

  return (
    <section className="ab-section">
      <h3>Shared Greetings</h3>
      <p className="ab-muted">
        Messages visitors created and shared. Hide any that are inappropriate.
      </p>

      {isLoading ? (
        <p className="ab-muted">Loading…</p>
      ) : (
        <div className="ab-msg-list">
          {messages.map(m => (
            <div key={m.messageId} className={`ab-msg-row${!m.isActive ? ' is-inactive' : ''}`}>
              <div className="ab-msg-body">
                <span className="ab-msg-festival">{m.festivalName}</span>
                <p className="ab-msg-text">{m.messageText}</p>
                <a
                  className="ab-msg-link"
                  href={shareBase + m.shareSlug}
                  target="_blank"
                  rel="noreferrer"
                >
                  {shareBase + m.shareSlug}
                </a>
                <span className="ab-muted ab-msg-date">
                  {new Date(m.createdAt).toLocaleString()}
                  {!m.isActive && <em> · hidden</em>}
                </span>
              </div>
              <button
                className={`ab-switch ${m.isActive ? 'ab-switch--off' : 'ab-switch--on'}`}
                disabled={toggle.isPending}
                onClick={() => disable(m)}
              >
                {m.isActive ? 'Hide' : 'Restore'}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
