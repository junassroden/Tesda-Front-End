import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Breadcrumb from '../../../components/Breadcrumb/Breadcrumb.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { programService } from '../../../services/programService.js'

const COLUMNS = [
  { key: 'name', label: 'Batch' },
  { key: 'start_date', label: 'Start' },
  { key: 'end_date', label: 'End' },
  { key: 'students', label: 'Students' },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

// Figma: Batch Lists 06
export default function BatchListPage() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const [program, setProgram] = useState(null)
  const [batches, setBatches] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    programService
      .get(programId)
      .then((data) => setProgram(data?.course ?? data))
      .catch(() => {})
    programService
      .batches(programId)
      .then(setBatches)
      .catch((err) => setError(err.message))
  }, [programId])

  const programName = program?.course_name ?? 'Program'

  return (
    <>
      <Breadcrumb items={[{ label: programName, to: ROUTES.CENTER.PROGRAMS }, { label: 'Batch List' }]} />
      <PageHeader title="Batch List" subtitle={programName} />
      {error && <p className="notice">{error}</p>}
      <DataTable title="List of Batches" columns={COLUMNS} rows={batches} onRowClick={(b) => navigate(toPath(ROUTES.CENTER.STUDENTS, { programId, batchId: b.id }))} />
    </>
  )
}
