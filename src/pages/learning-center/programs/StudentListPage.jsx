import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumb from '../../../components/Breadcrumb/Breadcrumb.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { programService } from '../../../services/programService.js'
import { exportReport } from '../../../utils/exportReport.js'
import { dateRange } from '../../../utils/format.js'

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')

const COLUMNS = [
  {
    key: 'full_name',
    label: 'Trainee',
    render: (s) => (
      <span className="doc-name">
        <span className="avatar">{initials(s.full_name)}</span>
        <span>{s.full_name}</span>
      </span>
    ),
  },
  { key: 'student_number', label: 'Student ID', render: (s) => <span className="num muted">{s.student_number || '—'}</span> },
  { key: 'bank_account_number', label: 'Bank account', render: (s) => <span className="num">{s.bank_account_number || 'Not on file'}</span> },
  { key: 'bank_account_holder', label: 'Account holder', render: (s) => <span className="muted">{s.bank_account_holder || '—'}</span> },
  { key: 'status', label: 'Status', render: (s) => <StatusBadge status={s.status} /> },
]

const EXPORT_COLUMNS = [
  { key: 'student_number', label: 'Student ID' },
  { key: 'full_name', label: 'Student name' },
  { key: 'bank_account_number', label: 'Bank account' },
  { key: 'bank_account_holder', label: 'Account holder' },
  { key: 'status', label: 'Status' },
]

// Figma: Student Lists 05
export default function StudentListPage() {
  const { programId, batchId } = useParams()
  const [batch, setBatch] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    programService
      .students(batchId)
      .then((data) => {
        setBatch(data.batch)
        setStudents(data.students ?? [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [batchId])

  const rows = students.filter((s) => `${s.full_name} ${s.student_number ?? ''}`.toLowerCase().includes(search.toLowerCase()))
  const title = batch?.batch_name ?? 'Batch'

  return (
    <>
      <PageHeader
        title="Trainees"
        subtitle="Trainees assigned to this batch, with the bank account used for their allowance."
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search name or ID"
        onExport={(format) => exportReport(format, { title: `${title} trainees`, columns: EXPORT_COLUMNS, rows })}
      />
      <Workspace
        back={toPath(ROUTES.CENTER.BATCHES, { programId })}
        backLabel="Batches"
        title={title}
        description={
          <Breadcrumb
            items={[
              { label: 'Programs', to: ROUTES.CENTER.PROGRAMS },
              { label: batch?.course_name ?? 'Program', to: toPath(ROUTES.CENTER.BATCHES, { programId }) },
              { label: batch ? `${dateRange(batch.start_date, batch.end_date)} · ${batch.instructor_name || 'No teacher yet'}` : title },
            ]}
          />
        }
        actions={batch && <StatusBadge status={batch.status} />}
        flush
      >
        {error && (
          <p className="form-error inset" role="alert">
            {error}
          </p>
        )}
        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          empty={{ icon: 'users', title: 'No trainees in this batch', text: 'Teachers assign trainees to a batch from their class list.' }}
        />
      </Workspace>
    </>
  )
}
