import { useEffect, useState } from 'react'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import { ErrorState } from '../../../components/EmptyState/EmptyState.jsx'
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

const TABS = [
  { value: 'pending', label: 'Pending approval', statuses: ['pending'] },
  { value: 'discrepancy', label: 'Discrepancies', statuses: ['discrepancy'] },
  { value: 'approved', label: 'Approved', statuses: ['approved', 'processing', 'ready_for_delivery', 'in_transit', 'delivered'] },
  { value: 'closed', label: 'Closed', statuses: ['completed', 'rejected', 'cancelled'] },
  { value: 'all', label: 'All' },
]

const COLUMNS = [
  {
    key: 'request_code',
    label: 'Reference',
    className: 'cell-wrap',
    render: (r) => (
      <span className="cell-stack">
        <strong className="num">{r.request_code}</strong>
        <small className="truncate">{r.letter_subject || r.purpose}</small>
      </span>
    ),
  },
  { key: 'center_name', label: 'Learning center', className: 'cell-wrap', render: (r) => <span>{r.center_name}</span> },
  { key: 'submitted_at', label: 'Submitted', render: (r) => <span className="muted num" title={fullDateTime(r.submitted_at)}>{shortDate(r.submitted_at)}</span> },
  { key: 'item_count', label: 'Items', align: 'end', render: (r) => <span className="num" title={r.items_summary}>{r.item_count}</span> },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} label={REQUEST_STATUS_LABEL[r.status]} /> },
  {
    key: 'action',
    label: 'Action',
    align: 'end',
    render: (r) => <span className="row-open">{r.status === 'pending' ? 'Review' : r.status === 'discrepancy' ? 'Resolve' : 'View'}</span>,
  },
]

/** Inventory Request Approvals: requests from every learning center, for the main office administrator. */
export default function InventoryRequestsPage() {
  const [requests, setRequests] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('pending')
  const [search, setSearch] = useState('')

  useEffect(() => {
    requestService
      .list()
      .then((d) => setRequests(d.requests ?? []))
      .catch((err) => setError(err.message))
  }, [])

  const all = requests ?? []
  const inTab = (t) => (t.statuses ? all.filter((r) => t.statuses.includes(r.status)) : all)
  const current = TABS.find((t) => t.value === tab)
  const list = inTab(current).filter((r) => `${r.request_code} ${r.center_name} ${r.letter_subject ?? ''} ${r.items_summary ?? ''}`.toLowerCase().includes(search.toLowerCase()))
  const { rows, page, pageCount, setPage } = usePagination(list, 15)

  return (
    <>
      <PageHeader
        title="Inventory request approvals"
        subtitle="Requests submitted by learning centers. Approving sends a request to inventory personnel; stock is only deducted when delivery personnel release it."
        search={search}
        onSearch={(v) => {
          setSearch(v)
          setPage(1)
        }}
        searchPlaceholder="Search reference, center or item"
        onExport={(format) =>
          exportReport(format, {
            title: 'Inventory requests',
            columns: [
              { key: 'request_code', label: 'Reference' },
              { key: 'center_name', label: 'Learning center' },
              { key: 'submitted', label: 'Submitted' },
              { key: 'items_summary', label: 'Items' },
              { key: 'status_label', label: 'Status' },
            ],
            rows: list.map((r) => ({ ...r, submitted: shortDate(r.submitted_at), status_label: REQUEST_STATUS_LABEL[r.status] })),
          })
        }
      />
      <Workspace title="Requests" flush>
        <Tabs
          tabs={TABS.map((t) => ({ value: t.value, label: t.label, count: inTab(t).length }))}
          value={tab}
          onChange={(v) => {
            setTab(v)
            setPage(1)
          }}
        />
        {error && !requests ? (
          <ErrorState what="inventory requests" message={error} />
        ) : (
          <>
            <DataTable
              columns={COLUMNS}
              rows={rows}
              loading={requests === null}
              empty={search ? { icon: 'search', title: 'No matches', text: `No request matches “${search}”.` } : { icon: 'request', title: 'Nothing here', text: tab === 'pending' ? 'No request is waiting for approval.' : 'No request is in this list.' }}
              rowHref={(r) => toPath(ROUTES.ADMIN.INVENTORY_REQUEST_DETAIL, { id: r.id })}
            />
            <Pagination page={page} pageCount={pageCount} onChange={setPage} />
          </>
        )}
      </Workspace>
    </>
  )
}
