import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { allowanceService } from '../../../services/allowanceService.js'
import { exportReport } from '../../../utils/exportReport.js'
import { fullDateTime, listTime, peso } from '../../../utils/format.js'

// Five compact columns instead of nine wide ones, so the table fits without scrolling:
// related values share a cell (code + center, batch + verification).
const BASE_COLUMNS = [
  {
    key: 'request_code',
    label: 'Request',
    className: 'cell-wrap',
    render: (r) => (
      <span className="cell-stack">
        <strong>{r.request_code}</strong>
        <small title={r.center_name}>{r.center_name}</small>
      </span>
    ),
  },
  {
    key: 'batch_name',
    label: 'Batch',
    className: 'cell-wrap col-hide-sm',
    render: (r) => {
      const total = Number(r.student_count) || 0
      const done = Number(r.checked_count) || 0
      return (
        <span className="cell-stack">
          <span title={r.batch_name}>{r.batch_name}</span>
          <small className="verify">
            <span className="verify-meter" aria-hidden="true">
              <span style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
            </span>
            {done}/{total} verified
          </small>
        </span>
      )
    },
  },
  { key: 'total_amount', label: 'Total', align: 'end', render: (r) => <span className="num">{peso(r.total_amount)}</span> },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
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

  const open = (r) => navigate(toPath(ROUTES.ADMIN.ALLOWANCE_CHECKLIST, { id: r.id }))

  const columns = [
    ...BASE_COLUMNS,
    {
      key: 'created_at',
      label: 'Submitted',
      align: 'end',
      render: (r) => (
        <span className="row-when">
          <time className="row-time" dateTime={r.created_at} title={fullDateTime(r.created_at)}>
            {listTime(r.created_at)}
          </time>
          <span className="row-hover-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={(e) => {
                e.stopPropagation()
                open(r)
              }}
              aria-label={`Open checklist for ${r.request_code}`}
              title="Open checklist"
            >
              <Icon name="eye" size={17} />
            </button>
          </span>
        </span>
      ),
    },
  ]

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
          columns={columns}
          rows={rows}
          loading={loading}
          empty={{ icon: 'coins', title: 'No allowance requests', text: 'Requests appear here when a learning center submits a batch.' }}
          rowHref={(r) => toPath(ROUTES.ADMIN.ALLOWANCE_CHECKLIST, { id: r.id })}
        />
      </Workspace>
    </>
  )
}
