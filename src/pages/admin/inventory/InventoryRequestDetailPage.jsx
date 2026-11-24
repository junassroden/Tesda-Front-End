import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import { ErrorState } from '../../../components/EmptyState/EmptyState.jsx'
import TextArea from '../../../components/form/TextArea.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import RequestOverview from '../../../components/requests/RequestOverview.jsx'
import ConfirmDialog from '../../../components/training/ConfirmDialog.jsx'
import { ROUTES } from '../../../constants/routes.js'
import { requestService } from '../../../services/requestService.js'
import { REQUEST_STATUS_LABEL } from '../../../utils/requestStatus.js'

/** Request Review: the main office administrator approves or disapproves, and resolves discrepancies. */
export default function InventoryRequestDetailPage() {
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

  const done = (d) => {
    setData(d)
    setNotice(d.message)
  }

  if (error && !data) {
    return (
      <>
        <PageHeader title="Inventory request" />
        <Workspace back={ROUTES.ADMIN.INVENTORY_REQUESTS} backLabel="Request approvals">
          <ErrorState what="this request" message={error} onRetry={load} />
        </Workspace>
      </>
    )
  }
  const r = data?.request
  return (
    <>
      <PageHeader title={r ? r.request_code : 'Inventory request'} subtitle={r ? `${r.center_name} · ${REQUEST_STATUS_LABEL[r.status]}` : 'Loading…'} />
      {notice && (
        <p className="notice-bar" role="status">
          <Icon name="check" size={16} />
          {notice}
          <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => setNotice('')}>
            <Icon name="x" size={14} />
          </button>
        </p>
      )}
      <Workspace back={ROUTES.ADMIN.INVENTORY_REQUESTS} backLabel="Request approvals" flush>
        {!data ? (
          <div className="workspace-pad muted">Loading the request…</div>
        ) : (
          <RequestOverview
            data={data}
            showStock={['pending', 'approved', 'processing'].includes(r.status)}
            actions={r.status === 'pending' ? <ReviewPanel data={data} onDone={done} /> : r.status === 'discrepancy' ? <ResolvePanel request={r} onDone={done} /> : null}
          />
        )}
      </Workspace>
    </>
  )
}

function ReviewPanel({ data, onDone }) {
  const [remarks, setRemarks] = useState('')
  const [dialog, setDialog] = useState(null) // 'approved' | 'rejected'
  const short = data.items.filter((i) => !i.enough)
  return (
    <section className="side-box action-box">
      <h3>Review</h3>
      {short.length > 0 ? (
        <p className="inline-alert standalone">
          <Icon name="alert" size={16} />
          {short.map((i) => i.product_name).join(', ')} {short.length === 1 ? 'is' : 'are'} short in stock right now. You can still approve; inventory personnel cannot prepare it until stock is enough.
        </p>
      ) : (
        <p className="field-hint">All items are available in the main office inventory. Approving does not deduct stock.</p>
      )}
      <TextArea id="review-remarks" label="Remarks" rows={4} maxLength={1000} placeholder="Required when disapproving" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      <div className="action-row">
        <Button variant="danger" onClick={() => setDialog('rejected')}>
          Disapprove
        </Button>
        <Button onClick={() => setDialog('approved')}>
          <Icon name="check" size={16} />
          Approve
        </Button>
      </div>
      {dialog && (
        <ConfirmDialog
          open
          title={dialog === 'approved' ? `Approve ${data.request.request_code}?` : `Disapprove ${data.request.request_code}?`}
          message={
            dialog === 'approved'
              ? 'The learning center is notified and the request moves to Inventory Request Processing. Stock is not deducted yet.'
              : 'The learning center is notified with your reason. The request and its documents are kept on record.'
          }
          confirmLabel={dialog === 'approved' ? 'Approve' : 'Disapprove'}
          variant={dialog === 'approved' ? 'primary' : 'danger'}
          reason={{ label: dialog === 'approved' ? 'Approval remarks (optional)' : 'Reason for disapproval', required: dialog === 'rejected' }}
          onClose={() => setDialog(null)}
          onConfirm={async ({ reason }) => {
            const d = await requestService.review(data.request.id, dialog, reason || remarks.trim())
            setDialog(null)
            onDone(d)
          }}
        />
      )}
    </section>
  )
}

function ResolvePanel({ request, onDone }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="side-box action-box">
      <h3>Discrepancy</h3>
      <p className="field-hint">The learning center received different quantities. Look into it, then record the outcome to close the request.</p>
      <Button className="btn-block" onClick={() => setOpen(true)}>
        Resolve discrepancy
      </Button>
      {open && (
        <ConfirmDialog
          open
          title={`Resolve the discrepancy on ${request.request_code}`}
          message="The request is completed and the learning center is notified with your notes."
          confirmLabel="Resolve"
          reason={{ label: 'How was it resolved?', required: true, placeholder: 'e.g. 2 missing pairs found at the warehouse and sent with REQ-0012' }}
          onClose={() => setOpen(false)}
          onConfirm={async ({ reason }) => {
            const d = await requestService.resolve(request.id, reason)
            setOpen(false)
            onDone(d)
          }}
        />
      )}
    </section>
  )
}
