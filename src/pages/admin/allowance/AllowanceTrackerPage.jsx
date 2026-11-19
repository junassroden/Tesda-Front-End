import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ADMIN_SUBTITLE } from '../../../constants/navItems.js'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { allowanceService } from '../../../services/allowanceService.js'
import { exportReport } from '../../../utils/exportReport.js'

const COLUMNS = [
  { key: 'school', label: 'School Name' },
  { key: 'batch', label: 'Student Batch' },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'date', label: 'Date', align: 'end' },
]

// Shown until the allowance endpoint exists.
const SAMPLE = Array.from({ length: 9 }, (_, i) => ({ id: i + 1, school: 'School Name', batch: 'Student Batch', status: ['Pending', 'In review', 'Approved'][i % 3], date: 'Date' }))

// Figma: Allowance Tracking 16
export default function AllowanceTrackerPage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    allowanceService
      .requests()
      .then(setRequests)
      .catch(() => setRequests(null))
  }, [])

  const isSample = !requests
  const rows = (requests ?? SAMPLE).filter((r) => String(r.school ?? '').toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <PageHeader
        title="Allowance Tracker"
        subtitle={ADMIN_SUBTITLE}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search requests"
        onExport={(format) => exportReport(format, { title: 'Allowance Tracking', columns: COLUMNS, rows })}
      />
      <Workspace title="List of Request" sample={isSample} flush>
        <DataTable columns={COLUMNS} rows={rows} showHeader={false} leadingIcon onRowClick={(r) => navigate(toPath(ROUTES.ADMIN.ALLOWANCE_CHECKLIST, { id: r.id }))} />
      </Workspace>
    </>
  )
}
