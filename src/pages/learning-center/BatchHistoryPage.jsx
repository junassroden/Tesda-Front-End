import { useEffect, useMemo, useState } from 'react'
import DataTable from '../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import { ErrorState } from '../../components/EmptyState/EmptyState.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../components/Pagination/Pagination.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../constants/routes.js'
import { usePagination } from '../../hooks/usePagination.js'
import { toList } from '../../services/api.js'
import { programService } from '../../services/programService.js'
import { batchService } from '../../services/trainingService.js'
import { exportReport } from '../../utils/exportReport.js'
import { dateRange, shortDate } from '../../utils/format.js'
import { hoursLabel } from '../../utils/training.js'

const EXPORT_COLUMNS = [
  { key: 'course_code', label: 'Course' },
  { key: 'batch_name', label: 'Batch' },
  { key: 'instructor_name', label: 'Teacher' },
  { key: 'start_date', label: 'Start' },
  { key: 'end_date', label: 'End' },
  { key: 'closed', label: 'Closed' },
  { key: 'held_hours', label: 'Hours recorded' },
  { key: 'enrolled', label: 'Trainees' },
  { key: 'status', label: 'Status' },
]

/**
 * Completed and cancelled batches, newest first, searchable by course and year.
 * portal 'center' (own center) or 'admin' (every center, read only).
 */
export default function BatchHistoryPage({ portal = 'center' }) {
  const [batches, setBatches] = useState(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [course, setCourse] = useState('')
  const [year, setYear] = useState('')
  const [center, setCenter] = useState('')
  const [courses, setCourses] = useState([])
  const [centers, setCenters] = useState([])
  const admin = portal === 'admin'

  useEffect(() => {
    programService
      .list()
      .then((d) => setCourses(toList(d)))
      .catch(() => setCourses([]))
    if (admin) {
      programService
        .formOptions()
        .then((d) => setCenters(d.training_centers ?? []))
        .catch(() => setCenters([]))
    }
  }, [admin])

  useEffect(() => {
    const id = setTimeout(() => {
      batchService
        .history({ q: q.trim(), course_id: course, year, center_id: center })
        .then((d) => {
          setError('')
          setBatches(d.batches ?? [])
        })
        .catch((err) => setError(err.message))
    }, 250)
    return () => clearTimeout(id)
  }, [q, course, year, center])

  const years = useMemo(() => {
    const now = new Date().getFullYear()
    return Array.from({ length: 6 }, (_, i) => now - i)
  }, [])

  const rows = batches ?? []
  const { rows: pageRows, page, pageCount, setPage } = usePagination(rows, 15)
  const courseOptions = courses.filter((c) => !center || String(c.training_center_id) === String(center))

  const columns = [
    {
      key: 'batch_name',
      label: 'Batch',
      className: 'cell-wrap',
      render: (b) => (
        <span className="cell-stack">
          <strong>{b.batch_name}</strong>
          <small>
            {b.course_name} · {b.course_code}
            {admin ? ` · ${b.training_center_name}` : ''}
          </small>
        </span>
      ),
    },
    { key: 'instructor_name', label: 'Teacher', render: (b) => <span className="muted">{b.instructor_name || '—'}</span> },
    { key: 'dates', label: 'Training period', render: (b) => <span className="muted num">{dateRange(b.start_date, b.end_date)}</span> },
    {
      key: 'closed',
      label: 'Closed',
      render: (b) => (
        <span className="cell-stack">
          <span className="num">{shortDate(b.completed_at || b.end_date)}</span>
          <small>{b.status === 'cancelled' ? 'Cancelled' : b.completion_mode === 'auto' ? 'Automatic' : 'Confirmed'}</small>
        </span>
      ),
    },
    { key: 'hours', label: 'Hours', align: 'end', render: (b) => <span className="num">{hoursLabel(b.held_hours)}</span> },
    { key: 'enrolled', label: 'Trainees', align: 'end', render: (b) => <span className="num">{b.enrolled}</span> },
    { key: 'status', label: 'Status', render: (b) => <StatusBadge status={b.status} /> },
  ]

  const href = (b) => (admin ? toPath(ROUTES.ADMIN.TRAINING_BATCH, { batchId: b.id }) : toPath(ROUTES.CENTER.BATCH, { programId: b.course_id, batchId: b.id }))

  return (
    <>
      <PageHeader
        title={admin ? 'Training history' : 'Batch history'}
        subtitle={
          admin
            ? 'Completed and cancelled batches of every learning center, for regional monitoring. Records are read only.'
            : 'Completed and cancelled batches move here on their own. Their trainees, teachers, schedules and attendance stay on record.'
        }
        search={q}
        onSearch={(v) => {
          setQ(v)
          setPage(1)
        }}
        searchPlaceholder="Search batch, course or teacher"
        onExport={(format) =>
          exportReport(format, {
            title: admin ? 'Training history' : 'Batch history',
            columns: EXPORT_COLUMNS,
            rows: rows.map((b) => ({ ...b, closed: shortDate(b.completed_at || b.end_date) })),
          })
        }
      />
      <Workspace
        title={batches === null ? 'Loading…' : `${rows.length} ${rows.length === 1 ? 'batch' : 'batches'}`}
        actions={
          <div className="filter-row">
            {admin && (
              <select
                aria-label="Learning center"
                value={center}
                onChange={(e) => {
                  setCenter(e.target.value)
                  setCourse('')
                  setPage(1)
                }}
              >
                <option value="">All centers</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <select
              aria-label="Course"
              value={course}
              onChange={(e) => {
                setCourse(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All courses</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_code} · {c.course_name}
                </option>
              ))}
            </select>
            <select
              aria-label="Year closed"
              value={year}
              onChange={(e) => {
                setYear(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Any year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        }
        flush
      >
        {error && !batches ? (
          <ErrorState what="the batch history" message={error} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={pageRows}
              loading={batches === null}
              empty={q || course || year || center ? { icon: 'search', title: 'No matches', text: 'No batch in history matches these filters.' } : { icon: 'calendar', title: 'No history yet', text: 'Batches appear here once they are completed or cancelled.' }}
              rowHref={href}
              showArrow
            />
            <Pagination page={page} pageCount={pageCount} onChange={setPage} />
          </>
        )}
      </Workspace>
    </>
  )
}
