import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { allowanceService } from '../../../services/allowanceService.js'
import { exportReport } from '../../../utils/exportReport.js'
import { peso, shortDate } from '../../../utils/format.js'

const COLUMNS = [
  { key: 'request_code', label: 'Request' },
  { key: 'center_name', label: 'Learning center', render: (r) => <span className="muted">{r.center_name}</span> },
  { key: 'batch_name', label: 'Batch', render: (r) => `${r.batch_name} · ${r.student_count} trainees` },
  { key: 'checked', label: 'Verified', align: 'end', render: (r) => <span className="num muted">{`${r.checked_count}/${r.student_count}`}</span> },
  { key: 'total_amount', label: 'Total', align: 'end', render: (r) => <span className="num">{peso(r.total_amount)}</span> },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'created_at', label: 'Submitted', align: 'end', render: (r) => <span className="muted num">{shortDate(r.created_at)}</span> },
]

const EXPORT_COLUMNS = [
  { key: 'request_code', label: 'Request' },
  { key: 'center_name', label: 'Learning center' },
  { key: 'batch_name', label: 'Batch' },
  { key: 'student_count', label: 'Trainees' },
  { key: 'total_amount', label: 'Total (PHP)' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Submitted' },
]

// Figma: Allowance Tracking 16
export default function AllowanceTrackerPage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    allowanceService
      .list()
      .then((data) => setRequests(data.requests ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const rows = requests.filter((r) => `${r.request_code} ${r.center_name} ${r.batch_name}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <PageHeader
        title="Allowance tracking"
        subtitle="Training allowance requests from learning centers, one per student batch."
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search center or batch"
        onExport={(format) => exportReport(format, { title: 'Allowance tracking', columns: EXPORT_COLUMNS, rows })}
      />
      <Workspace title="Allowance requests" flush>
        {error && (
          <p className="form-error inset" role="alert">
            {error}
          </p>
        )}
        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          leadingIcon="coins"
          empty={{ icon: 'coins', title: 'No allowance requests', text: 'Requests appear here when a learning center submits a batch.' }}
          onRowClick={(r) => navigate(toPath(ROUTES.ADMIN.ALLOWANCE_CHECKLIST, { id: r.id }))}
        />
      </Workspace>
    </>
  )
}
