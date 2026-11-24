import { useEffect, useState } from 'react'
import Button from '../../../components/Button/Button.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import { ErrorState } from '../../../components/EmptyState/EmptyState.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../../components/Pagination/Pagination.jsx'
import Tabs from '../../../components/Tabs/Tabs.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { usePagination } from '../../../hooks/usePagination.js'
import { requestService } from '../../../services/requestService.js'
import { exportReport } from '../../../utils/exportReport.js'
import { fullDateTime, shortDate } from '../../../utils/format.js'
import { REQUEST_STATUS_LABEL } from '../../../utils/requestStatus.js'

const ACTIVE = ['pending', 'approved', 'processing', 'ready_for_delivery', 'in_transit', 'delivered', 'discrepancy']
const TRACKING = ['approved', 'processing', 'ready_for_delivery', 'in_transit', 'delivered', 'discrepancy', 'completed']
const CLOSED = ['completed', 'rejected', 'cancelled']

const refCell = (r) => (
  <span className="cell-stack">
    <strong className="num">{r.status === 'draft' ? 'Draft' : r.request_code}</strong>
    <small className="truncate">{r.letter_subject || r.purpose}</small>
  </span>
)
const statusCell = (r) => <StatusBadge status={r.status} label={REQUEST_STATUS_LABEL[r.status]} />

const COLUMNS = [
  { key: 'request_code', label: 'Request', className: 'cell-wrap', render: refCell },
  { key: 'items', label: 'Items', className: 'cell-wrap', render: (r) => <span className="muted">{r.items_summary || 'No items yet'}</span> },
  { key: 'submitted_at', label: 'Submitted', render: (r) => <span className="muted num">{r.submitted_at ? shortDate(r.submitted_at) : '—'}</span> },
  { key: 'status', label: 'Status', render: statusCell },
]

const TRACKING_COLUMNS = [
  { key: 'request_code', label: 'Request', className: 'cell-wrap', render: refCell },
  { key: 'approved', label: 'Approved', render: (r) => <span className="muted num">{r.reviewed_at ? shortDate(r.reviewed_at) : '—'}</span> },
  {
    key: 'delivery',
    label: 'Delivery',
    render: (r) =>
      r.delivery ? (
        <span className="cell-stack">
          <strong className="num">{r.delivery.delivery_code}</strong>
          <small>{r.delivery.status === 'ready' ? 'QR active · awaiting release' : r.delivery.status === 'in_transit' ? 'QR used · on the way' : r.delivery.status === 'delivered' ? 'Delivered' : r.delivery.status}</small>
        </span>
      ) : (
        <span className="muted">{r.released_at ? 'Released (before QR deliveries)' : r.status === 'processing' ? 'Being prepared' : 'Not prepared yet'}</span>
      ),
  },
  { key: 'released', label: 'Released', render: (r) => <span className="muted num">{r.released_at ? fullDateTime(r.released_at) : '—'}</span> },
  { key: 'items', label: 'Quantities', className: 'cell-wrap', render: (r) => <span className="muted">{r.items_summary}</span> },
  { key: 'status', label: 'Status', render: statusCell },
]

/** The learning center's inventory requests to the main office, with delivery tracking. */
export default function InventoryRequestsPage() {
  const [requests, setRequests] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('active')
  const [search, setSearch] = useState('')

  useEffect(() => {
    requestService
      .list()
      .then((d) => setRequests(d.requests ?? []))
      .catch((err) => setError(err.message))
  }, [])

  const all = requests ?? []
  const groups = {
    active: all.filter((r) => ACTIVE.includes(r.status)),
    tracking: all.filter((r) => TRACKING.includes(r.status)),
    drafts: all.filter((r) => r.status === 'draft'),
    history: all.filter((r) => CLOSED.includes(r.status)),
  }
  const toConfirm = all.filter((r) => ['in_transit', 'delivered'].includes(r.status)).length
  const list = groups[tab].filter((r) => `${r.request_code} ${r.letter_subject ?? ''} ${r.items_summary ?? ''}`.toLowerCase().includes(search.toLowerCase()))
  const { rows, page, pageCount, setPage } = usePagination(list, 12)

  return (
    <>
      <PageHeader
        title="Inventory requests"
        subtitle="Formal requests to the TESDA main office, from approval through preparation, delivery and receipt."
        search={search}
        onSearch={(v) => {
          setSearch(v)
          setPage(1)
        }}
        searchPlaceholder="Search reference, subject or item"
        onExport={(format) =>
          exportReport(format, {
            title: 'Inventory requests',
            columns: [
              { key: 'request_code', label: 'Reference' },
              { key: 'letter_subject', label: 'Subject' },
              { key: 'items_summary', label: 'Items' },
              { key: 'submitted', label: 'Submitted' },
              { key: 'status_label', label: 'Status' },
            ],
            rows: list.map((r) => ({ ...r, submitted: r.submitted_at ? shortDate(r.submitted_at) : '', status_label: REQUEST_STATUS_LABEL[r.status] })),
          })
        }
        actions={
          <Button to={ROUTES.CENTER.NEW_INVENTORY_REQUEST}>
            <Icon name="plus" size={16} />
            New request
          </Button>
        }
      />
      <Workspace title="Requests" flush>
        <Tabs
          tabs={[
            { value: 'active', label: 'In progress', count: groups.active.length },
            { value: 'tracking', label: 'Delivery tracking', count: groups.tracking.length },
            { value: 'drafts', label: 'Drafts', count: groups.drafts.length },
            { value: 'history', label: 'History', count: groups.history.length },
          ]}
          value={tab}
          onChange={(v) => {
            setTab(v)
            setPage(1)
          }}
        />
        {toConfirm > 0 && (
          <p className="inline-alert">
            <Icon name="truck" size={16} />
            {toConfirm === 1 ? 'One delivery is' : `${toConfirm} deliveries are`} on the way or delivered. Open {toConfirm === 1 ? 'it' : 'each one'} to confirm receipt when the items arrive.
          </p>
        )}
        {error && !requests ? (
          <ErrorState what="your requests" message={error} />
        ) : (
          <>
            <DataTable
              columns={tab === 'tracking' ? TRACKING_COLUMNS : COLUMNS}
              rows={rows}
              loading={requests === null}
              empty={
                search
                  ? { icon: 'search', title: 'No matches', text: `No request matches “${search}”.` }
                  : {
                      active: { icon: 'request', title: 'No requests in progress', text: 'Create a request letter and list the items you need from the main office.' },
                      tracking: { icon: 'truck', title: 'Nothing to track yet', text: 'Approved requests appear here while they are prepared and delivered.' },
                      drafts: { icon: 'documents', title: 'No drafts', text: 'Requests you save without submitting are kept here.' },
                      history: { icon: 'calendar', title: 'No history yet', text: 'Completed and disapproved requests are kept here with their documents.' },
                    }[tab]
              }
              rowHref={(r) => (r.status === 'draft' ? toPath(ROUTES.CENTER.EDIT_INVENTORY_REQUEST, { id: r.id }) : toPath(ROUTES.CENTER.INVENTORY_REQUEST, { id: r.id }))}
              showArrow
            />
            <Pagination page={page} pageCount={pageCount} onChange={setPage} />
          </>
        )}
      </Workspace>
    </>
  )
}
