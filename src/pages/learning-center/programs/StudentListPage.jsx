import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumb from '../../../components/Breadcrumb/Breadcrumb.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { programService } from '../../../services/programService.js'
import { exportReport } from '../../../utils/exportReport.js'

const COLUMNS = [
  { key: 'name', label: 'Student' },
  { key: 'email', label: 'Email' },
  { key: 'contact', label: 'Contact' },
  { key: 'status', label: 'Requirements', render: (r) => <StatusBadge status={r.status} /> },
]

// Figma: Student Lists 05
export default function StudentListPage() {
  const { programId, batchId } = useParams()
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    programService
      .students(programId, batchId)
      .then(setStudents)
      .catch((err) => setError(err.message))
  }, [programId, batchId])

  const filtered = students.filter((s) => String(s.name ?? '').toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Program Name', to: ROUTES.CENTER.PROGRAMS },
          { label: 'Batch List', to: toPath(ROUTES.CENTER.BATCHES, { programId }) },
          { label: 'Student Lists' },
        ]}
      />
      <PageHeader title="Student Lists" subtitle={`Batch #${batchId}`} search={search} onSearch={setSearch} onExport={(format) => exportReport(format, { title: 'Student List', columns: COLUMNS, rows: filtered })} />
      {error && <p className="notice">{error}</p>}
      <DataTable title="List of Students" columns={COLUMNS} rows={filtered} />
    </>
  )
}
