import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import EmptyState, { ErrorState } from '../../../components/EmptyState/EmptyState.jsx'
import TextArea from '../../../components/form/TextArea.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES } from '../../../constants/routes.js'
import { inventoryService } from '../../../services/inventoryService.js'
import { shortDate } from '../../../utils/format.js'

const ITEM_COLUMNS = [
  { key: 'product_name', label: 'Item' },
  { key: 'quantity_requested', label: 'Requested', align: 'end', render: (r) => <span className="num">{r.quantity_requested}</span> },
  { key: 'quantity_approved', label: 'Approved', align: 'end', render: (r) => <span className="num">{r.quantity_approved ?? '—'}</span> },
  {
    key: 'stock',
    label: 'In stock',
    align: 'end',
    render: (r) => <span className={Number(r.stock) < Number(r.quantity_requested) ? 'num low-stock' : 'num muted'}>{r.stock}</span>,
  },
]

// Figma: Inventory Request Mesage 12
export default function InventoryRequestDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState(null) // { request, items } | false (not found) | undefined (failed)
  const [loadError, setLoadError] = useState('')
  const [remarks, setRemarks] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const load = useCallback(
    () =>
      inventoryService
        .request(id)
        .then((d) => {
          setLoadError('')
          setData(d)
        })
        .catch((err) => {
          if (err?.status === 404) return setData(false)
          setLoadError(err?.message || 'Something went wrong.')
          setData((prev) => prev || undefined)
        }),
    [id],
  )

  useEffect(() => {
    load()
  }, [load])

  const act = async (fn, success) => {
    setBusy(true)
    setMessage(null)
    try {
      await fn()
      setMessage({ ok: true, text: success })
      setRemarks('')
      await load()
    } catch (err) {
      setMessage({ ok: false, text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const r = data?.request
  const canReview = r && ['pending', 'in_review'].includes(r.status)

  return (
    <>
      <PageHeader title="Supply requests" subtitle="Review the request, then approve, reject, or release it." />
      <Workspace back={ROUTES.ADMIN.INVENTORY_REQUESTS} backLabel="All requests" flush>
        {data === null && <p className="notice inset-text">Loading request…</p>}
        {data === undefined && loadError && (
          <ErrorState
            what="this request"
            message={loadError}
            onRetry={() => {
              setData(null)
              load()
            }}
          />
        )}
        {data === false && <EmptyState icon="request" title="Request not found" text="It may have been removed, or the link is incomplete." />}

        {r && (
          <>
            <div className="detail-head">
              <div>
                <h2>
                  {r.request_code} <StatusBadge status={r.status} />
                </h2>
                <p>
                  {r.center_name} · sent by {r.requested_by_name || 'a center admin'} on {shortDate(r.created_at)}
                </p>
              </div>
            </div>

            <div className="detail-layout">
              <div className="stack">
                <section>
                  <div className="section-title">
                    <h3>Purpose</h3>
                  </div>
                  <p className="lede-text">{r.purpose}</p>
                </section>
                <div className="allowance-students">
                  <DataTable columns={ITEM_COLUMNS} rows={data.items} />
                </div>
                {r.admin_remarks && (
                  <section>
                    <div className="section-title">
                      <h3>Main office note</h3>
                      <span>{r.reviewed_by_name}</span>
                    </div>
                    <p className="lede-text">{r.admin_remarks}</p>
                  </section>
                )}
              </div>

              <aside className="side-panel">
                <h3>{canReview ? 'Decision' : r.status === 'approved' ? 'Release' : 'Status'}</h3>
                <p className="notice">
                  <Icon name="truck" size={16} />
                  {r.delivery_name ? `Pickup: ${r.delivery_name}${r.delivery_vehicle ? ` · ${r.delivery_vehicle}` : ''}${r.delivery_plate ? ` · ${r.delivery_plate}` : ''}` : 'No delivery personnel named'}
                </p>

                {canReview && (
                  <>
                    <TextArea id="remarks" label="Note to the learning center" rows={3} placeholder="e.g. Approved in full. Ready for pickup on Friday." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                    <div className="form-actions">
                      {r.status === 'pending' && (
                        <Button variant="ghost" disabled={busy} onClick={() => act(() => inventoryService.review(id, 'in_review', remarks), 'Marked in review.')}>
                          Mark in review
                        </Button>
                      )}
                      <Button variant="danger" disabled={busy} onClick={() => act(() => inventoryService.review(id, 'rejected', remarks), 'Request rejected.')}>
                        Reject
                      </Button>
                      <Button disabled={busy} onClick={() => act(() => inventoryService.review(id, 'approved', remarks), 'Request approved.')}>
                        <Icon name="check" size={17} />
                        Approve
                      </Button>
                    </div>
                  </>
                )}

                {r.status === 'approved' && (
                  <>
                    <p className="notice">Releasing takes the items out of stock and records the release on the ledger.</p>
                    <Button disabled={busy} onClick={() => act(() => inventoryService.release(id), 'Items released and recorded.')}>
                      <Icon name="inventory" size={17} />
                      Release items
                    </Button>
                  </>
                )}

                {['released', 'received', 'rejected', 'cancelled'].includes(r.status) && (
                  <p className="notice">
                    {r.status === 'released' && `Released ${shortDate(r.released_at)}. Waiting for the center to confirm receipt.`}
                    {r.status === 'received' && `Received by the center on ${shortDate(r.received_at)}.`}
                    {r.status === 'rejected' && `Rejected on ${shortDate(r.reviewed_at)}.`}
                    {r.status === 'cancelled' && 'Cancelled by the center.'}
                  </p>
                )}

                {message && (
                  <p className={message.ok ? 'notice' : 'notice is-error'} role="status">
                    {message.text}
                  </p>
                )}
              </aside>
            </div>
          </>
        )}
      </Workspace>
    </>
  )
}
