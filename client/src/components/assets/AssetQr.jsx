import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

// QR code (image PNG générée localement) d'une valeur texte.
function AssetQr({ value, size = 200, label }) {
  const [source, setSource] = useState('')

  useEffect(() => {
    let active = true
    QRCode.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (active) setSource(url)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [value, size])

  return source ? (
    <img alt={label ?? `QR code ${value}`} className="rounded-lg bg-white p-space-xs" data-testid="qr-image" height={size} src={source} width={size} />
  ) : (
    <div className="rounded-lg bg-surface-container" style={{ height: size, width: size }} />
  )
}

export default AssetQr
