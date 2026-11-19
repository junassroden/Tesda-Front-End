import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { allowanceService } from '../../../services/allowanceService.js'
import { exportReport } from '../../../utils/exportReport.js'

const COLUMNS = [
  { key: 'center', label: 'Learning center' },
  { key: 'program', label: 'Program' },
  { key: 'batch', label: 'Batch' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

// Figma: Allowance Tracking 16
export default function AllowanceTrackerPage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    allowanceService
      .requests()
      .then(setRequests)
      .catch((err) => setError(err.message))
  }, [])

  const filtered = requests.filter((r) => String(r.center ?? '').toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <PageHeader title="Allowance Tracking" subtitle="Allowance requests from learning centers" search={search} onSearch={setSearch} onExport={(format) => exportReport(format, { title: 'Allowance Tracking', columns: COLUMNS, rows: filtered })} />
      {error && <p className="notice">{error}</p>}
      <DataTable title="List of Request" columns={COLUMNS} rows={filtered} onRowClick={(r) => navigate(toPath(ROUTES.ADMIN.ALLOWANCE_CHECKLIST, { id: r.id }))} />
    </>
  )
}
