import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Breadcrumb from '../../../components/Breadcrumb/Breadcrumb.jsx'
import Button from '../../../components/Button/Button.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { LEARNING_CENTER_SUBTITLE } from '../../../constants/navItems.js'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { programService } from '../../../services/programService.js'

const COLUMNS = [
  { key: 'number', label: 'Batch Number' },
  { key: 'name', label: 'Batch Name' },
  { key: 'enrolled', label: 'Enrolled Students' },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

// Shown until the batch endpoint exists.
const SAMPLE = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, number: 'Batch 00', name: 'Batch Name', enrolled: '00', status: ['Active', 'Pending', 'Completed'][i % 3] }))

// Figma: Batch Lists 06
export default function BatchListPage() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const [program, setProgram] = useState(null)
  const [batches, setBatches] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    programService
      .get(programId)
      .then((data) => setProgram(data?.course ?? data))
      .catch(() => {})
    programService
      .batches(programId)
      .then(setBatches)
      .catch(() => setBatches(null))
  }, [programId])

  const programName = program?.course_name ?? 'Program Name'
  const rows = (batches ?? SAMPLE).filter((b) => String(b.name ?? '').toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <PageHeader title="Program Lists" subtitle={LEARNING_CENTER_SUBTITLE} search={search} onSearch={setSearch} />
      <Workspace
        back={ROUTES.CENTER.PROGRAMS}
        title="List of Batch"
        description={<Breadcrumb items={[{ label: programName, to: ROUTES.CENTER.PROGRAMS }, { label: 'Batch List' }]} />}
        sample={!batches}
        actions={
          <Button className="btn-lg" disabled title="Batches have no backend yet">
            Add Batch
          </Button>
        }
        flush
      >
        <DataTable columns={COLUMNS} rows={rows} onRowClick={(b) => navigate(toPath(ROUTES.CENTER.STUDENTS, { programId, batchId: b.id }))} />
      </Workspace>
    </>
  )
}
