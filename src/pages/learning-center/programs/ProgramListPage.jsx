import { useEffect, useState } from 'react'
import Button from '../../../components/Button/Button.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../../components/Pagination/Pagination.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { usePagination } from '../../../hooks/usePagination.js'
import { toList } from '../../../services/api.js'
import { programService } from '../../../services/programService.js'
import { exportReport } from '../../../utils/exportReport.js'

const EXPORT_COLUMNS = [
  { key: 'course_code', label: 'Code' },
  { key: 'course_name', label: 'Program' },
  { key: 'qualification', label: 'Level' },
  { key: 'enrollment_count', label: 'Trainees' },
  { key: 'status', label: 'Status' },
]

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
  { key: 'enrollment_count', label: 'Trainees', align: 'end', render: (p) => <span className="num">{p.enrollment_count ?? 0}</span> },
  { key: 'status', label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
  {
    key: 'open',
    label: 'Batches',
    align: 'end',
    render: () => (
      <span className="row-when">
        <span className="row-time">View batches</span>
        <span className="row-hover-actions">
          <span className="row-open">
            Open
            <Icon name="arrowRight" size={14} />
          </span>
        </span>
      </span>
    ),
  },
]

// Figma: Student List 3
export default function ProgramListPage() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    programService
      .list()
      .then((data) => setPrograms(toList(data)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = programs.filter((p) => `${p.course_code ?? ''} ${p.course_name ?? ''}`.toLowerCase().includes(search.toLowerCase()))
  const { rows, page, pageCount, setPage } = usePagination(filtered, 10)

  return (
    <>
      <PageHeader
        title="Programs"
        subtitle="NC programs your center offers. Open one to see its batches and trainees."
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search code or name"
        onExport={(format) => exportReport(format, { title: 'Programs', columns: EXPORT_COLUMNS, rows: filtered })}
      />
      <Workspace
        title="All programs"
        actions={
          <Button to={ROUTES.CENTER.REGISTER_PROGRAM}>
            <Icon name="plus" size={17} />
            Add program
          </Button>
        }
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
          empty={search ? { icon: 'search', title: 'No matches', text: `No program matches “${search}”.` } : { icon: 'programs', title: 'No programs yet', text: 'Add your first NC program to start opening batches.' }}
          rowHref={(p) => toPath(ROUTES.CENTER.BATCHES, { programId: p.id })}
        />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Workspace>
    </>
  )
}
