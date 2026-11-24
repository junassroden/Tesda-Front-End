import { useCallback, useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import { ErrorState } from '../../../components/EmptyState/EmptyState.jsx'
import TextArea from '../../../components/form/TextArea.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import RequestOverview from '../../../components/requests/RequestOverview.jsx'
import ConfirmDialog from '../../../components/training/ConfirmDialog.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { requestService } from '../../../services/requestService.js'
import { REQUEST_STATUS_LABEL } from '../../../utils/requestStatus.js'

/** A learning center's view of one request: documents, progress, delivery, and receipt. */
export default function InventoryRequestPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(
    () =>
      requestService
        .get(id)
        .then((d) => {
          setError('')
          setData(d)
        })
        .catch((err) => setError(err.message)),
    [id],
  )
  useEffect(() => {
    load()
  }, [load])

  if (error && !data) {
    return (
      <>
        <PageHeader title="Inventory request" />
        <Workspace back={ROUTES.CENTER.INVENTORY_REQUESTS} backLabel="Inventory requests">
          <ErrorState what="this request" message={error} onRetry={load} />
        </Workspace>
      </>
    )
  }
  if (data?.request.status === 'draft') return <Navigate to={toPath(ROUTES.CENTER.EDIT_INVENTORY_REQUEST, { id })} replace />

  const r = data?.request
  return (
    <>
      <PageHeader title={r ? r.request_code : 'Inventory request'} subtitle={r ? `${r.letter_subject || r.purpose} · ${REQUEST_STATUS_LABEL[r.status]}` : 'Loading…'} />
      {notice && (
        <p className="notice-bar" role="status">
          <Icon name="check" size={16} />
          {notice}
          <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => setNotice('')}>
            <Icon name="x" size={14} />
          </button>
        </p>
      )}
      <Workspace back={ROUTES.CENTER.INVENTORY_REQUESTS} backLabel="Inventory requests" flush>
        {!data ? (
          <div className="workspace-pad muted">Loading the request…</div>
        ) : (
          <RequestOverview
            data={data}
            actions={
              ['in_transit', 'delivered'].includes(r.status) && (
                <ReceiptPanel
                  data={data}
                  onDone={(d) => {
                    setData(d)
                    setNotice(d.message)
                  }}
                />
              )
            }
          />
        )}
      </Workspace>
    </>
  )
}

/** Confirm receipt; different quantities become a discrepancy report instead of completing. */
function ReceiptPanel({ data, onDone }) {
  const [counts, setCounts] = useState(() => Object.fromEntries(data.items.map((i) => [i.id, String(i.quantity_approved ?? i.quantity_requested)])))
  const [notes, setNotes] = useState('')
  const [confirming, setConfirming] = useState(false)
  const differs = data.items.some((i) => Number(counts[i.id]) !== Number(i.quantity_approved ?? i.quantity_requested))

  return (
    <section className="side-box action-box">
      <h3>Confirm receipt</h3>
      <p className="field-hint">
        {data.request.status === 'delivered' ? 'Delivery personnel marked this delivered.' : 'These items are on the way.'} Count what arrived; change a number if it differs.
      </p>
      <ul className="receipt-list">
        {data.items.map((i) => (
          <li key={i.id}>
            <label htmlFor={`rcv-${i.id}`}>
              <strong>{i.product_name}</strong>
              <small>
                Released: {i.quantity_approved ?? i.quantity_requested} {i.unit}
              </small>
            </label>
            <input id={`rcv-${i.id}`} type="number" min={0} value={counts[i.id]} onChange={(e) => setCounts((c) => ({ ...c, [i.id]: e.target.value }))} />
          </li>
        ))}
      </ul>
      <TextArea
        id="receipt-notes"
        label={differs ? 'What is different? (required)' : 'Notes (optional)'}
        rows={3}
        maxLength={2000}
        required={differs}
        placeholder={differs ? 'e.g. 2 pairs of gloves missing; 1 goggles cracked' : ''}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <Button variant={differs ? 'danger' : 'primary'} className="btn-block" onClick={() => setConfirming(true)}>
        {differs ? 'Report discrepancy' : 'Confirm receipt'}
      </Button>
      {confirming && (
        <ConfirmDialog
          open
          title={differs ? 'Report a discrepancy?' : 'Confirm receipt?'}
          message={
            differs
              ? 'The main office is told which quantities differ. The request stays open until they resolve it.'
              : 'The request is marked completed with you as the receiving administrator. This cannot be undone.'
          }
          confirmLabel={differs ? 'Report discrepancy' : 'Confirm receipt'}
          variant={differs ? 'danger' : 'primary'}
          onClose={() => setConfirming(false)}
          onConfirm={async () => {
            const d = await requestService.receive(
              data.request.id,
              data.items.map((i) => ({ id: i.id, quantity_received: Number(counts[i.id]) })),
              notes.trim(),
            )
            setConfirming(false)
            onDone(d)
          }}
        />
      )}
    </section>
  )
}
