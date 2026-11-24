import { useEffect, useState } from 'react'

/**
 * Draws a QR code for `value` (the delivery's opaque token, never request details).
 * The image is made in the browser; nothing is sent to an outside service.
 */
export default function QrCode({ value, size = 220, label }) {
  const [src, setSrc] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let cancelled = false
    import('qrcode')
      .then((QR) => QR.toDataURL(value, { width: size * 2, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#0f1729', light: '#ffffff' } }))
      .then((url) => !cancelled && setSrc(url))
      .catch(() => !cancelled && setError('The QR code could not be drawn.'))
    return () => {
      cancelled = true
    }
  }, [value, size])
  if (error) return <p className="form-error">{error}</p>
  return (
    <figure className="qr-figure">
      {src ? <img src={src} width={size} height={size} alt={label ? `QR code for ${label}` : 'Delivery QR code'} /> : <span className="skeleton" style={{ width: size, height: size }} />}
      {label && <figcaption className="num">{label}</figcaption>}
    </figure>
  )
}
