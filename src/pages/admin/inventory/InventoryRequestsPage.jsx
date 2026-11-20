import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Tabs from '../../../components/Tabs/Tabs.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { inventoryService } from '../../../services/inventoryService.js'
import { exportReport } from '../../../utils/exportReport.js'
import { shortDate } from '../../../utils/format.js'

const COLUMNS = [
  { key: 'request_code', label: 'Request' },
  { key: 'center_name', label: 'Learning center', render: (r) => <span className="muted">{r.center_name}</span> },
  { key: 'items_summary', label: 'Items', render: (r) => <span className="muted">{r.items_summary || '—'}</span> },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'created_at', label: 'Submitted', align: 'end', render: (r) => <span className="muted num">{shortDate(r.created_at)}</span> },
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

  useEffect(() => {
    inventoryService
      .requests()
      .then((data) => setRequests(data.requests ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

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
      <Workspace back={ROUTES.ADMIN.INVENTORY} backLabel="Inventory" title="Requests from learning centers" flush>
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        {error && (
          <p className="form-error inset" role="alert">
            {error}
          </p>
        )}
        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          leadingIcon="request"
          empty={{ icon: 'request', title: 'No requests here', text: 'New requests from learning centers show up under “Needs action”.' }}
          onRowClick={(r) => navigate(toPath(ROUTES.ADMIN.INVENTORY_REQUEST_DETAIL, { id: r.id }))}
        />
      </Workspace>
    </>
  )
}
