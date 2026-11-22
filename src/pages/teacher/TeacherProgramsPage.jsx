import { useEffect, useState } from 'react'
import DataTable from '../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../constants/routes.js'
import { teacherService } from '../../services/teacherService.js'

const COLUMNS = [
  {
    key: 'course_name',
    label: 'Program',
    className: 'cell-wrap',
    render: (p) => (
      <span className="cell-stack">
        <strong>{p.course_name}</strong>
        <small className="num">{p.course_code}</small>
      </span>
    ),
  },
  { key: 'qualification', label: 'Level', render: (p) => <span className="muted">{p.qualification || '—'}</span> },
  { key: 'class_days', label: 'Class days', className: 'cell-wrap', render: (p) => <span className="muted">{p.class_days || 'Not set'}</span> },
  { key: 'status', label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
]

// Open programs at the teacher's center.
export default function TeacherProgramsPage() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    teacherService
      .overview()
      .then((data) => setPrograms(data.courses ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const rows = programs.filter((p) => `${p.course_code} ${p.course_name}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <PageHeader title="Programs" subtitle="Open NC programs at your center. Open one to set its schedule, share materials, and open batches." search={search} onSearch={setSearch} searchPlaceholder="Search code or name" />
      <Workspace title="Programs at your center" flush>
        {error && (
          <p className="form-error inset" role="alert">
            {error}
          </p>
        )}
        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          empty={search ? { icon: 'search', title: 'No matches', text: `No program matches “${search}”.` } : { icon: 'programs', title: 'No open programs', text: 'Your center has no open programs yet.' }}
          rowHref={(p) => toPath(ROUTES.TEACHER.PROGRAM, { programId: p.id })}
        />
      </Workspace>
    </>
  )
}
