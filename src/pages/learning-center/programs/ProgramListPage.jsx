import { useEffect, useState } from 'react'
import Button from '../../../components/Button/Button.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../../components/Pagination/Pagination.jsx'
import Tabs from '../../../components/Tabs/Tabs.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { usePagination } from '../../../hooks/usePagination.js'
import { toList } from '../../../services/api.js'
import { programService } from '../../../services/programService.js'
import { exportReport } from '../../../utils/exportReport.js'
import { durationLabel, modeLabel } from '../../../utils/training.js'

const EXPORT_COLUMNS = [
  { key: 'course_code', label: 'Code' },
  { key: 'course_name', label: 'Course' },
  { key: 'qualification', label: 'Level' },
  { key: 'duration_hours', label: 'Hours' },
  { key: 'mode', label: 'Mode' },
  { key: 'active_batches', label: 'Active batches' },
  { key: 'history_batches', label: 'Completed batches' },
  { key: 'enrollment_count', label: 'Trainees' },
  { key: 'status', label: 'Status' },
]

const COLUMNS = [
  {
    key: 'course_name',
    label: 'Course',
    className: 'cell-wrap',
    render: (p) => (
      <span className="cell-stack">
        <strong>{p.course_name}</strong>
        <small className="num">
          {p.course_code} · {p.qualification}
        </small>
      </span>
    ),
  },
  {
    key: 'duration',
    label: 'Duration',
    render: (p) => (
      <span className="cell-stack">
        <span className="num">{p.duration_hours ? `${p.duration_hours} hours` : 'Hours not set'}</span>
        <small>
          {durationLabel(p) !== 'Not set' ? `${durationLabel(p)} · ` : ''}
          {modeLabel(p.training_mode)}
        </small>
      </span>
    ),
  },
  {
    key: 'active_batches',
    label: 'Active batches',
    align: 'end',
    render: (p) => (
      <span className="cell-stack end">
        <span className="num">{p.active_batches ?? 0}</span>
        {p.review_batches > 0 && <small className="text-danger">{p.review_batches} need review</small>}
      </span>
    ),
  },
  { key: 'history_batches', label: 'In history', align: 'end', render: (p) => <span className="num muted">{p.history_batches ?? 0}</span> },
  { key: 'enrollment_count', label: 'Trainees', align: 'end', render: (p) => <span className="num">{p.enrollment_count ?? 0}</span> },
  { key: 'status', label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
]

export default function ProgramListPage() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('current')
  const [error, setError] = useState('')

  useEffect(() => {
    programService
      .list()
      .then((data) => setPrograms(toList(data)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const archived = programs.filter((p) => p.status === 'archived')
  const current = programs.filter((p) => p.status !== 'archived')
  const filtered = (tab === 'archived' ? archived : current).filter((p) =>
    `${p.course_code ?? ''} ${p.course_name ?? ''}`.toLowerCase().includes(search.toLowerCase()),
  )
  const { rows, page, pageCount, setPage } = usePagination(filtered, 10)

  return (
    <>
      <PageHeader
        title="Courses"
        subtitle="The courses your center offers. Open a course to manage its batches, schedules and history."
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search code or name"
        onExport={(format) => exportReport(format, { title: 'Courses', columns: EXPORT_COLUMNS, rows: filtered.map((p) => ({ ...p, mode: modeLabel(p.training_mode) })) })}
      />
      <Workspace
        title="Courses"
        actions={
          <Button to={ROUTES.CENTER.REGISTER_PROGRAM}>
            <Icon name="plus" size={17} />
            Add course
          </Button>
        }
        flush
      >
        <Tabs
          tabs={[
            { value: 'current', label: 'Offered', count: current.length },
            { value: 'archived', label: 'Archived', count: archived.length },
          ]}
          value={tab}
          onChange={(v) => {
            setTab(v)
            setPage(1)
          }}
        />
        {error && (
          <p className="form-error inset" role="alert">
            {error}
          </p>
        )}
        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          empty={
            search
              ? { icon: 'search', title: 'No matches', text: `No course matches “${search}”.` }
              : tab === 'archived'
                ? { icon: 'programs', title: 'No archived courses', text: 'Archived courses keep their batch history and stop taking new batches.' }
                : { icon: 'programs', title: 'No courses yet', text: 'Add your first course to start opening batches.' }
          }
          rowHref={(p) => toPath(ROUTES.CENTER.BATCHES, { programId: p.id })}
          showArrow
        />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Workspace>
    </>
  )
}
