import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import { ErrorState } from '../../components/EmptyState/EmptyState.jsx'
import Icon from '../../components/Icon/Icon.jsx'
import Modal from '../../components/Modal/Modal.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import QrCode from '../../components/requests/QrCode.jsx'
import RequestOverview from '../../components/requests/RequestOverview.jsx'
import ConfirmDialog from '../../components/training/ConfirmDialog.jsx'
import { ROUTES } from '../../constants/routes.js'
import { requestService } from '../../services/requestService.js'
import { REQUEST_STATUS_LABEL } from '../../utils/requestStatus.js'

/** Inventory personnel: review an approved request, verify stock and generate its delivery QR code. */
export default function ProcessingRequestPage() {
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
        <PageHeader title="Approved request" />
        <Workspace back={ROUTES.INVENTORY.DASHBOARD} backLabel="Request processing">
          <ErrorState what="this request" message={error} onRetry={load} />
        </Workspace>
      </>
    )
  }
  const r = data?.request
  return (
    <>
      <PageHeader title={r ? r.request_code : 'Approved request'} subtitle={r ? `${r.center_name} · ${REQUEST_STATUS_LABEL[r.status]}` : 'Loading…'} />
      {notice && (
        <p className="notice-bar" role="status">
          <Icon name="check" size={16} />
          {notice}
          <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => setNotice('')}>
            <Icon name="x" size={14} />
          </button>
        </p>
      )}
      <Workspace back={ROUTES.INVENTORY.DASHBOARD} backLabel="Request processing" flush>
        {!data ? (
          <div className="workspace-pad muted">Loading the request…</div>
        ) : (
          <RequestOverview
            data={data}
            showStock={['approved', 'processing'].includes(r.status)}
            actions={
              <PreparePanel
                data={data}
                onDone={(d) => {
                  setData(d)
                  setNotice(d.message)
                }}
                onError={setNotice}
              />
            }
          />
        )}
      </Workspace>
    </>
  )
}

function PreparePanel({ data, onDone, onError }) {
  const r = data.request
  const [confirming, setConfirming] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const short = data.items.filter((i) => !i.enough)

  if (data.delivery && data.delivery.status === 'ready') {
    return (
      <section className="side-box action-box">
        <h3>Delivery QR code</h3>
        <QrCode value={data.delivery.qr_payload} size={180} label={data.delivery.delivery_code} />
        <p className="field-hint">Attach this to the prepared items. Delivery personnel scan it to release them; stock is deducted then, once.</p>
        <Button variant="secondary" className="btn-block" onClick={() => setShowQr(true)}>
          <Icon name="download" size={16} />
          Print QR label
        </Button>
        <Modal open={showQr} title={`QR label · ${data.delivery.delivery_code}`} onClose={() => setShowQr(false)} footer={<Button onClick={() => window.print()}>Print</Button>}>
          <div className="qr-label print-area">
            <QrCode value={data.delivery.qr_payload} size={260} />
            <strong className="num">{data.delivery.delivery_code}</strong>
            <span>
              {r.request_code} · {r.center_name}
            </span>
            <small>{data.delivery.items_summary}</small>
          </div>
        </Modal>
      </section>
    )
  }
  if (!['approved', 'processing'].includes(r.status)) return null

  return (
    <section className="side-box action-box">
      <h3>Prepare this request</h3>
      {short.length ? (
        <p className="inline-alert standalone">
          <Icon name="alert" size={16} />
          Not enough available for{' '}
          {short
            .map((i) => `${i.product_name}: ${i.available} available${i.committed ? ` (${i.committed} of ${i.stock} held for other prepared deliveries)` : ''}, ${(i.quantity_approved ?? i.quantity_requested) - i.available} short`)
            .join('; ')}
          . {short.some((i) => i.committed) ? 'Wait for those deliveries to be released or restock' : 'Restock'} before generating the QR code.
        </p>
      ) : (
        <p className="field-hint">Every item exists in the main office inventory and the approved quantities are available. Generating the QR code holds these units for this delivery but does not deduct them.</p>
      )}
      {r.status === 'approved' && (
        <Button
          variant="secondary"
          className="btn-block"
          onClick={async () => {
            try {
              onDone(await requestService.startProcessing(r.id))
            } catch (err) {
              onError(err.message)
            }
          }}
        >
          Start preparing
        </Button>
      )}
      <Button className="btn-block" disabled={short.length > 0} onClick={() => setConfirming(true)}>
        Generate QR code
      </Button>
      {confirming && (
        <ConfirmDialog
          open
          title={`Generate the QR code for ${r.request_code}?`}
          message={`This creates one delivery with: ${data.items.map((i) => `${i.product_name} × ${i.quantity_approved ?? i.quantity_requested}`).join(', ')}. The request becomes Ready for delivery. Stock is deducted only when delivery personnel scan and release it.`}
          confirmLabel="Generate QR code"
          onClose={() => setConfirming(false)}
          onConfirm={async () => {
            const d = await requestService.generateQr(r.id)
            setConfirming(false)
            onDone(d)
          }}
        />
      )}
    </section>
  )
}
