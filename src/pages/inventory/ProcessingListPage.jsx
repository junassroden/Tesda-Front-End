import { useEffect, useState } from 'react'
import DataTable from '../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import { ErrorState } from '../../components/EmptyState/EmptyState.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import StatStrip from '../../components/StatStrip/StatStrip.jsx'
import Tabs from '../../components/Tabs/Tabs.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../constants/routes.js'
import { requestService } from '../../services/requestService.js'
import { shortDate } from '../../utils/format.js'
import { REQUEST_STATUS_LABEL } from '../../utils/requestStatus.js'

const TABS = [
  { value: 'todo', label: 'To prepare', statuses: ['approved', 'processing'] },
  { value: 'ready', label: 'Ready for delivery', statuses: ['ready_for_delivery'] },
  { value: 'released', label: 'Released', statuses: ['in_transit', 'delivered', 'discrepancy', 'completed'] },
]

const COLUMNS = [
  {
    key: 'request_code',
    label: 'Request',
    render: (r) => (
      <span className="cell-stack">
        <strong className="num">{r.request_code}</strong>
        <small>{r.center_name}</small>
      </span>
    ),
  },
  { key: 'reviewed_at', label: 'Approved', render: (r) => <span className="muted num">{shortDate(r.reviewed_at)}</span> },
  { key: 'items', label: 'Items and quantities', className: 'cell-wrap', render: (r) => <span>{r.items_summary}</span> },
  { key: 'qty', label: 'Units', align: 'end', render: (r) => <span className="num">{r.total_quantity}</span> },
  {
    key: 'status',
    label: 'Processing status',
    render: (r) => (
      <span className="cell-stack">
        <StatusBadge status={r.status} label={REQUEST_STATUS_LABEL[r.status]} />
        {r.delivery && <small className="num">{r.delivery.delivery_code}</small>}
      </span>
    ),
  },
]

/** Inventory Request Processing: only requests the main office approved. */
export default function ProcessingListPage() {
  const [requests, setRequests] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('todo')

  useEffect(() => {
    requestService
      .list()
      .then((d) => setRequests(d.requests ?? []))
      .catch((err) => setError(err.message))
  }, [])

  const all = requests ?? []
  const count = (statuses) => all.filter((r) => statuses.includes(r.status)).length
  const rows = all.filter((r) => TABS.find((t) => t.value === tab).statuses.includes(r.status)).sort((a, b) => String(a.reviewed_at).localeCompare(String(b.reviewed_at)))

  return (
    <>
      <PageHeader title="Inventory request processing" subtitle="Approved requests to prepare. Check stock, then generate the delivery QR code. Stock is deducted only when delivery personnel release it." />
      <StatStrip
        id="processing-queue"
        loading={requests === null}
        error={error && !requests ? error : ''}
        cells={[
          { label: 'Newly approved', value: count(['approved']), detail: 'Not started yet', attention: true },
          { label: 'Being prepared', value: count(['processing']), detail: 'Generate the QR code when ready', attention: true },
          { label: 'Waiting for release', value: count(['ready_for_delivery']), detail: 'QR code generated' },
          { label: 'Released', value: count(['in_transit', 'delivered', 'discrepancy', 'completed']), detail: 'Out of the main office' },
        ]}
      />
      <Workspace title="Approved requests" flush>
        <Tabs tabs={TABS.map((t) => ({ value: t.value, label: t.label, count: count(t.statuses) }))} value={tab} onChange={setTab} />
        {error && !requests ? (
          <ErrorState what="approved requests" message={error} />
        ) : (
          <DataTable
            columns={COLUMNS}
            rows={rows}
            loading={requests === null}
            empty={{ icon: 'inventory', title: 'Nothing here', text: tab === 'todo' ? 'Requests appear here once the main office approves them.' : 'No request is in this list.' }}
            rowHref={(r) => toPath(ROUTES.INVENTORY.REQUEST, { id: r.id })}
            showArrow
          />
        )}
      </Workspace>
    </>
  )
}
