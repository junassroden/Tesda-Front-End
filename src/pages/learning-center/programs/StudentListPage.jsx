import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumb from '../../../components/Breadcrumb/Breadcrumb.jsx'
import Button from '../../../components/Button/Button.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { LEARNING_CENTER_SUBTITLE } from '../../../constants/navItems.js'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { programService } from '../../../services/programService.js'
import { exportReport } from '../../../utils/exportReport.js'

const COLUMNS = [
  { key: 'studentId', label: 'Student ID' },
  { key: 'name', label: 'Student Name' },
  { key: 'account', label: 'Bank Account' },
  { key: 'holder', label: 'Holder Name' },
]

// Shown until the student list endpoint exists.
const SAMPLE = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, studentId: 'Student ID', name: 'Student Name', account: '0000-000-0000', holder: 'Holder Name' }))

// Figma: Student Lists 05
export default function StudentListPage() {
  const { programId, batchId } = useParams()
  const [students, setStudents] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    programService
      .students(programId, batchId)
      .then(setStudents)
      .catch(() => setStudents(null))
  }, [programId, batchId])

  const rows = (students ?? SAMPLE).filter((s) => String(s.name ?? '').toLowerCase().includes(search.toLowerCase()))
  const batchLabel = `Batch ${String(batchId).padStart(2, '0')}`

  return (
    <>
      <PageHeader
        title="Program Lists"
        subtitle={LEARNING_CENTER_SUBTITLE}
        search={search}
        onSearch={setSearch}
        onExport={(format) => exportReport(format, { title: `${batchLabel} Student Lists`, columns: COLUMNS, rows })}
      />
      <Workspace
        back={toPath(ROUTES.CENTER.BATCHES, { programId })}
        title={`${batchLabel} Student Lists`}
        description={
          <Breadcrumb
            items={[
              { label: 'Program Name', to: ROUTES.CENTER.PROGRAMS },
              { label: 'Batch List', to: toPath(ROUTES.CENTER.BATCHES, { programId }) },
              { label: 'Student Lists' },
            ]}
          />
        }
        sample={!students}
        actions={
          <Button className="btn-lg" disabled title="Student lists have no backend yet">
            Add Student
          </Button>
        }
        flush
      >
        <DataTable columns={COLUMNS} rows={rows} />
      </Workspace>
    </>
  )
}
