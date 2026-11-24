import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import Icon from '../../components/Icon/Icon.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import QrScanner from '../../components/requests/QrScanner.jsx'
import ConfirmDialog from '../../components/training/ConfirmDialog.jsx'
import { ROUTES, toPath } from '../../constants/routes.js'
import { deliveryService } from '../../services/requestService.js'
import { fullDateTime } from '../../utils/format.js'
import { DELIVERY_STATUS_LABEL } from '../../utils/requestStatus.js'

/**
 * QR Code Scanner: scan (or type the reference number), see the server's
 * validation, then confirm the release. Release is the only step that
 * deducts stock, and the server lets each QR code through once.
 */
export default function ScanPage() {
  const [code, setCode] = useState('')
  const [manual, setManual] = useState('')
  const [result, setResult] = useState(null) // { valid, problems, delivery, via }
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [released, setReleased] = useState(null)

  const check = useCallback(async (text) => {
    setChecking(true)
    setError('')
    setReleased(null)
    setCode(text)
    try {
      setResult(await deliveryService.scan(text))
    } catch (err) {
      setResult(null)
      setError(err.message)
    } finally {
      setChecking(false)
    }
  }, [])

  const reset = () => {
    setResult(null)
    setError('')
    setCode('')
    setReleased(null)
  }

  const d = result?.delivery
  return (
    <>
      <PageHeader title="Scan QR code" subtitle="Scan the QR label on the prepared items. The delivery is checked before anything is released." />
      <div className="scan-layout">
        <Workspace title="Camera">
          <QrScanner onResult={check} paused={Boolean(result || error || checking)} />
          <form
            className="manual-entry"
            onSubmit={(e) => {
              e.preventDefault()
              if (manual.trim()) check(manual.trim())
            }}
          >
            <label htmlFor="manual-code">No camera? Enter the delivery reference number</label>
            <div className="manual-row">
              <input id="manual-code" className="num" placeholder="DLV-2026-0001" value={manual} onChange={(e) => setManual(e.target.value.toUpperCase())} autoComplete="off" />
              <Button type="submit" variant="secondary" disabled={!manual.trim() || checking}>
                Check
              </Button>
            </div>
          </form>
        </Workspace>

        <Workspace title="Result" aria-live="polite">
          {checking ? (
            <p className="muted">Checking the code…</p>
          ) : released ? (
            <div className="scan-result is-valid" role="status">
              <Icon name="check" size={22} />
              <div>
                <strong>Released for delivery</strong>
                <p>{released.message}</p>
                <div className="button-row">
                  <Button to={toPath(ROUTES.DELIVERY.DETAIL, { id: released.delivery.id })} variant="secondary">
                    Open delivery
                  </Button>
                  <Button onClick={reset}>Scan another</Button>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="scan-result is-invalid" role="alert">
              <Icon name="x" size={22} />
              <div>
                <strong>Not a valid delivery</strong>
                <p>{error}</p>
                <Button variant="secondary" onClick={reset}>
                  Try again
                </Button>
              </div>
            </div>
          ) : !result ? (
            <p className="muted">Open the camera and point it at the QR label, or enter the reference number. The delivery details appear here.</p>
          ) : (
            <>
              <div className={result.valid ? 'scan-result is-valid' : 'scan-result is-invalid'} role={result.valid ? 'status' : 'alert'}>
                <Icon name={result.valid ? 'check' : 'alert'} size={22} />
                <div>
                  <strong>{result.valid ? 'Valid QR code: ready to release' : 'This delivery cannot be released'}</strong>
                  {result.problems.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  {result.valid && <p>Read via {result.via === 'qr' ? 'QR code' : 'reference number'}. Check the items against the list below.</p>}
                </div>
              </div>
              <dl className="side-facts scan-facts">
                <div>
                  <dt>Delivery</dt>
                  <dd className="num">{d.delivery_code}</dd>
                </div>
                <div>
                  <dt>Inventory request</dt>
                  <dd className="num">{d.request_code}</dd>
                </div>
                <div>
                  <dt>Destination</dt>
                  <dd>
                    {d.center_name}
                    {d.center_address && <small>{d.center_address}</small>}
                  </dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <StatusBadge status={d.status} label={DELIVERY_STATUS_LABEL[d.status]} />
                  </dd>
                </div>
                <div>
                  <dt>Prepared</dt>
                  <dd>
                    {fullDateTime(d.prepared_at)}
                    <small>{d.prepared_by_name}</small>
                  </dd>
                </div>
              </dl>
              <table className="release-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="cell-end">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((i) => (
                    <tr key={i.product_id}>
                      <td>{i.product_name}</td>
                      <td className="cell-end num">
                        {i.quantity} {i.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="button-row end">
                <Button variant="secondary" onClick={reset}>
                  Scan another
                </Button>
                {result.valid ? (
                  <Button onClick={() => setConfirming(true)}>
                    <Icon name="truck" size={16} />
                    Release for delivery
                  </Button>
                ) : (
                  <Link className="btn btn-secondary" to={toPath(ROUTES.DELIVERY.DETAIL, { id: d.id })}>
                    Open delivery
                  </Link>
                )}
              </div>
            </>
          )}
        </Workspace>
      </div>

      {confirming && d && (
        <ConfirmDialog
          open
          title={`Release ${d.delivery_code}?`}
          message={`You confirm that these items are leaving the main office for ${d.center_name}: ${d.items_summary}. They are deducted from stock now, the QR code is marked used, and you are recorded as the person who released them.`}
          confirmLabel="Confirm release"
          onClose={() => setConfirming(false)}
          onConfirm={async () => {
            const res = await deliveryService.release(d.id, code)
            setConfirming(false)
            setResult(null)
            setReleased(res)
          }}
        />
      )}
    </>
  )
}
