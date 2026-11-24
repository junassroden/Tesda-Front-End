import { useEffect, useState } from 'react'
import QrCode from '../requests/QrCode.jsx'
import { sealService } from '../../services/ledgerService.js'
import { verifyUrl } from '../../utils/ledger.js'

/**
 * A verification QR code for a printed sheet. Seals the sheet as it is now
 * (the server reuses the seal when nothing changed since the last print) and
 * shows the QR code with the address and code to type in by hand.
 * kind: student_info | student_checklist | enrollment_packet | batch_records
 */
export default function SealQr({ kind, entityId }) {
  const [seal, setSeal] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    sealService
      .issue(kind, entityId)
      .then((d) => setSeal(d.seal))
      .catch((err) => setError(err.message))
  }, [kind, entityId])

  if (error) return <p className="seal-qr is-error no-print">Verification code unavailable: {error}</p>
  if (!seal) return <div className="seal-qr is-loading" aria-hidden="true" />
  const url = verifyUrl(seal.token)
  return (
    <div className="seal-qr">
      <QrCode value={url} size={92} />
      <div>
        <strong>Scan to verify</strong>
        <span>This sheet is sealed on the TESDA NEXUS blockchain ledger.</span>
        <code>{seal.token}</code>
        <small>{url}</small>
      </div>
    </div>
  )
}
