/* ------------------------------------------------------------------
 * QrCode — single, reusable QR renderer used everywhere in the app.
 *
 * Renders `value` into a <canvas> via the `qrcode` package. Because it
 * draws onto a real canvas we can also offer a "Download PNG" action
 * (used by the admin to print the store QR) and a "Copy link" action.
 *
 * Props:
 *   value        (string, required)  what the QR encodes (usually a URL)
 *   size         (number)   pixel size of the square QR         default 220
 *   level        (string)   error-correction: L | M | Q | H     default 'M'
 *   margin       (number)   quiet-zone modules                  default 2
 *   fgColor      (string)   dark module color                   default '#111827'
 *   bgColor      (string)   background color                    default '#ffffff'
 *   downloadable (bool)     show "Download PNG" button          default false
 *   copyable     (bool)     show "Copy link" button             default false
 *   fileName     (string)   PNG filename on download            default 'qr-code.png'
 *   caption      (node)     small text under the QR
 *   className    (string)
 *
 * Usage:
 *   <QrCode value="https://site/loyalty?scan=1" downloadable copyable
 *           caption="Scan to check in" />
 * ------------------------------------------------------------------ */
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import QRCodeLib from 'qrcode'
import toast from 'react-hot-toast'
import { Download, Copy, Check } from 'lucide-react'
import './QrCode.css'

export default function QrCode({
  value,
  size = 220,
  level = 'M',
  margin = 2,
  fgColor = '#111827',
  bgColor = '#ffffff',
  downloadable = false,
  copyable = false,
  fileName = 'qr-code.png',
  caption,
  className,
  ...rest
}) {
  const canvasRef = useRef(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !value) return
    QRCodeLib.toCanvas(
      canvas,
      value,
      {
        width: size,
        margin,
        errorCorrectionLevel: level,
        color: { dark: fgColor, light: bgColor },
      },
      (err) => setError(err ? 'Could not render QR' : null),
    )
  }, [value, size, level, margin, fgColor, bgColor])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success('Link copied')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy link')
    }
  }

  return (
    <div className={clsx('ui-qr', className)} {...rest}>
      <div className="ui-qr__frame" style={{ background: bgColor }}>
        {error ? (
          <span className="ui-qr__error">{error}</span>
        ) : (
          <canvas ref={canvasRef} className="ui-qr__canvas" aria-label="QR code" />
        )}
      </div>

      {caption && <p className="ui-qr__caption">{caption}</p>}

      {(downloadable || copyable) && (
        <div className="ui-qr__actions">
          {downloadable && (
            <button type="button" className="ui-qr__btn" onClick={handleDownload}>
              <Download size={15} aria-hidden="true" /> Download PNG
            </button>
          )}
          {copyable && (
            <button type="button" className="ui-qr__btn" onClick={handleCopy}>
              {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
