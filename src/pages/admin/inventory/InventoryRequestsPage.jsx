import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import TextArea from '../../../components/form/TextArea.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import Modal from '../../../components/Modal/Modal.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Tabs from '../../../components/Tabs/Tabs.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { inventoryService } from '../../../services/inventoryService.js'
import { exportReport } from '../../../utils/exportReport.js'
import { fullDateTime, listTime } from '../../../utils/format.js'

const BASE_COLUMNS = [
  { key: 'request_code', label: 'Request' },
  { key: 'center_name', label: 'Learning center', render: (r) => <span className="muted">{r.center_name}</span> },
  { key: 'items_summary', label: 'Items', render: (r) => <span className="muted">{r.items_summary || '—'}</span> },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

const EXPORT_COLUMNS = [
  { key: 'request_code', label: 'Request' },
  { key: 'center_name', label: 'Learning center' },
  { key: 'items_summary', label: 'Items' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Submitted' },
]

const OPEN = ['pending', 'in_review', 'approved']

// Figma: Inventory Request 13
export default function InventoryRequestsPage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('open')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [rejecting, setRejecting] = useState(null) // request waiting for reject confirmation
  const [reload, setReload] = useState(0)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  useEffect(() => {
    inventoryService
      .requests()
      .then((data) => setRequests(data.requests ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [reload])

  // Quick actions from the row; the detail page still has remarks and the full history.
  const act = async (r, fn, success) => {
    setBusyId(r.id)
    setError('')
    try {
      await fn()
      setNotice(`${r.request_code}: ${success}`)
      setReload((n) => n + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const startReject = (r) => {
    setRejecting(r)
    setReason('')
    setReasonError('')
  }

  // The server requires a reason when a request is rejected; it is shown to the center.
  const confirmReject = async (event) => {
    event.preventDefault()
    const r = rejecting
    if (!r) return
    if (!reason.trim()) {
      setReasonError('Tell the learning center why the request is rejected.')
      return
    }
    setRejecting(null)
    await act(r, () => inventoryService.review(r.id, 'rejected', reason.trim()), 'Request rejected.')
  }

  const open = (r) => navigate(toPath(ROUTES.ADMIN.INVENTORY_REQUEST_DETAIL, { id: r.id }))

  const columns = [
    ...BASE_COLUMNS,
    {
      key: 'created_at',
      label: 'Submitted',
      align: 'end',
      render: (r) => {
        const busy = busyId === r.id
        const run = (fn) => (e) => {
          e.stopPropagation()
          fn()
        }
        const canReview = r.status === 'pending' || r.status === 'in_review'
        return (
          <span className="row-when">
            <time className="row-time" dateTime={r.created_at} title={fullDateTime(r.created_at)}>
              {busy ? 'Saving…' : listTime(r.created_at)}
            </time>
            {!busy && (
              <span className="row-hover-actions">
                {canReview && (
                  <>
                    <button type="button" className="icon-btn is-success" onClick={run(() => act(r, () => inventoryService.review(r.id, 'approved'), 'Request approved.'))} aria-label={`Approve ${r.request_code}`} title="Approve">
                      <Icon name="check" size={17} />
                    </button>
                    <button type="button" className="icon-btn is-danger" onClick={run(() => startReject(r))} aria-label={`Reject ${r.request_code}`} title="Reject">
                      <Icon name="x" size={17} />
                    </button>
                  </>
                )}
                {r.status === 'approved' && (
                  <button type="button" className="icon-btn is-success" onClick={run(() => act(r, () => inventoryService.release(r.id), 'Items released and recorded.'))} aria-label={`Release ${r.request_code}`} title="Release items">
                    <Icon name="truck" size={17} />
                  </button>
                )}
                <button type="button" className="icon-btn" onClick={run(() => open(r))} aria-label={`View ${r.request_code}`} title="View details">
                  <Icon name="eye" size={17} />
                </button>
              </span>
            )}
          </span>
        )
      },
    },
  ]

  const term = search.toLowerCase()
  const byTab = (r, t) => t === 'all' || (t === 'open' ? OPEN.includes(r.status) : !OPEN.includes(r.status))
  const rows = requests.filter((r) => byTab(r, tab) && `${r.request_code} ${r.center_name} ${r.items_summary ?? ''}`.toLowerCase().includes(term))
  const tabs = [
    { value: 'open', label: 'Needs action' },
    { value: 'closed', label: 'Completed' },
    { value: 'all', label: 'All' },
  ].map((t) => ({ ...t, count: requests.filter((r) => byTab(r, t.value)).length }))

  return (
    <>
      <PageHeader
        title="Supply requests"
        subtitle="Requests for supplies and equipment sent by learning centers."
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search requests"
        onExport={(format) => exportReport(format, { title: 'Supply requests', columns: EXPORT_COLUMNS, rows })}
      />
      <Workspace title="Requests from learning centers" flush>
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        {notice && !error && (
          <p className="notice inset" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="form-error inset" role="alert">
            {error}
          </p>
        )}
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          leadingIcon="request"
          empty={{ icon: 'request', title: 'No requests here', text: 'New requests from learning centers show up under “Needs action”.' }}
          rowHref={(r) => toPath(ROUTES.ADMIN.INVENTORY_REQUEST_DETAIL, { id: r.id })}
        />
      </Workspace>

      <Modal
        open={!!rejecting}
        title="Reject request?"
        onClose={() => setRejecting(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" form="reject-form">
              Reject
            </Button>
          </>
        }
      >
        <form id="reject-form" className="rename-form" onSubmit={confirmReject}>
          <p>
            <strong>{rejecting?.request_code}</strong> from {rejecting?.center_name} will be rejected.
          </p>
          <TextArea id="reject-reason" label="Reason (sent to the learning center)" rows={3} placeholder="e.g. Out of stock until next month." value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} required />
          {reasonError && (
            <p className="form-error" role="alert">
              {reasonError}
            </p>
          )}
        </form>
      </Modal>
    </>
  )
}
