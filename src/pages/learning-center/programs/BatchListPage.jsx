import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Breadcrumb from '../../../components/Breadcrumb/Breadcrumb.jsx'
import Button from '../../../components/Button/Button.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import { ErrorState } from '../../../components/EmptyState/EmptyState.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import Modal from '../../../components/Modal/Modal.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Tabs from '../../../components/Tabs/Tabs.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import BatchFields from '../../../components/training/BatchFields.jsx'
import Meter from '../../../components/training/Meter.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { batchService } from '../../../services/trainingService.js'
import { exportReport } from '../../../utils/exportReport.js'
import { dateRange, shortDate } from '../../../utils/format.js'
import { batchBadge, batchPayload, batchToForm, daysLabel, durationLabel, hoursLabel, modeLabel, sessionLabel } from '../../../utils/training.js'

const batchCell = (r) => (
  <span className="cell-stack">
    <strong>{r.batch_name}</strong>
    <small>
      Batch {String(r.batch_number).padStart(2, '0')} · {r.instructor_name || 'No teacher yet'}
    </small>
  </span>
)

const ACTIVE_COLUMNS = [
  { key: 'batch_name', label: 'Batch', className: 'cell-wrap', render: batchCell },
  {
    key: 'dates',
    label: 'Schedule',
    className: 'cell-wrap',
    render: (r) => (
      <span className="cell-stack">
        <span className="num">{dateRange(r.start_date, r.end_date)}</span>
        <small>
          {daysLabel(r.days_of_week)}
          {r.session_start ? ` · ${sessionLabel(r.session_start, r.session_end)}` : ''}
        </small>
      </span>
    ),
  },
  {
    key: 'progress',
    label: 'Progress',
    render: (r) => (
      <div className="cell-meter">
        <Meter value={r.progress} />
        <small className="num">
          {hoursLabel(r.held_hours)} of {r.required_hours ? `${r.required_hours} h` : '—'}
        </small>
      </div>
    ),
  },
  { key: 'enrolled', label: 'Trainees', align: 'end', render: (r) => <span className="num">{`${r.enrolled}/${r.capacity}`}</span> },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={batchBadge(r)} /> },
]

const HISTORY_COLUMNS = [
  { key: 'batch_name', label: 'Batch', className: 'cell-wrap', render: batchCell },
  { key: 'dates', label: 'Training period', render: (r) => <span className="muted num">{dateRange(r.start_date, r.end_date)}</span> },
  {
    key: 'completed_at',
    label: 'Closed',
    render: (r) => (
      <span className="cell-stack">
        <span className="num">{shortDate(r.completed_at || r.end_date)}</span>
        <small>{r.status === 'cancelled' ? 'Cancelled' : r.completion_mode === 'auto' ? 'Completed automatically' : 'Completion confirmed'}</small>
      </span>
    ),
  },
  { key: 'hours', label: 'Hours', align: 'end', render: (r) => <span className="num">{hoursLabel(r.held_hours)}</span> },
  { key: 'enrolled', label: 'Trainees', align: 'end', render: (r) => <span className="num">{r.enrolled}</span> },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

const EXPORT_COLUMNS = [
  { key: 'batch_number', label: 'No.' },
  { key: 'batch_name', label: 'Batch' },
  { key: 'instructor_name', label: 'Teacher' },
  { key: 'start_date', label: 'Start' },
  { key: 'end_date', label: 'End' },
  { key: 'held_hours', label: 'Hours recorded' },
  { key: 'required_hours', label: 'Hours required' },
  { key: 'enrolled', label: 'Trainees' },
  { key: 'status', label: 'Status' },
]

/** One course: its details and its batches, split into active and history. */
export default function BatchListPage() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('active')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(batchToForm())
  const [teachers, setTeachers] = useState([])
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(
    () =>
      batchService
        .forCourse(programId)
        .then((data) => {
          setError('')
          setCourse(data.course)
          setBatches(data.batches ?? [])
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false)),
    [programId],
  )

  useEffect(() => {
    load()
  }, [load])

  const startNew = () => {
    setForm(batchToForm())
    setFormError('')
    setOpen(true)
    batchService
      .instructors()
      .then((d) => setTeachers(d.instructors ?? []))
      .catch(() => setTeachers([]))
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const data = await batchService.create(programId, batchPayload(form))
      navigate(toPath(ROUTES.CENTER.BATCH, { programId, batchId: data.batch.id }))
    } catch (err) {
      setFormError(err.message)
      setSaving(false)
    }
  }

  const active = batches.filter((b) => !b.in_history)
  const history = batches.filter((b) => b.in_history).sort((a, b) => String(b.completed_at || b.end_date).localeCompare(String(a.completed_at || a.end_date)))
  const list = (tab === 'active' ? active : history).filter((b) => `${b.batch_name} ${b.instructor_name ?? ''}`.toLowerCase().includes(search.toLowerCase()))
  const review = active.filter((b) => b.needs_review).length
  const programName = course?.course_name ?? 'Course'

  if (error && !course) {
    return (
      <>
        <PageHeader title="Course" />
        <Workspace back={ROUTES.CENTER.PROGRAMS} backLabel="Courses">
          <ErrorState what="this course" message={error} onRetry={load} />
        </Workspace>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={programName}
        subtitle={course ? `${course.course_code} · ${course.qualification}` : 'Loading…'}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search batches"
        onExport={(format) => exportReport(format, { title: `${programName} ${tab === 'active' ? 'active batches' : 'batch history'}`, columns: EXPORT_COLUMNS, rows: list })}
      />

      {course && (
        <section className="card fact-card">
          <dl className="fact-row">
            <div>
              <dt>Total training hours</dt>
              <dd className="num">{course.duration_hours ? `${course.duration_hours} hours` : 'Not set'}</dd>
            </div>
            <div>
              <dt>Estimated training days</dt>
              <dd className="num">{course.training_days || 'Not set'}</dd>
            </div>
            <div>
              <dt>Estimated duration</dt>
              <dd>{durationLabel(course)}</dd>
            </div>
            <div>
              <dt>Training mode</dt>
              <dd>{modeLabel(course.training_mode)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={course.status} />
              </dd>
            </div>
          </dl>
          <Button variant="secondary" to={toPath(ROUTES.CENTER.EDIT_PROGRAM, { programId })}>
            <Icon name="edit" size={16} />
            Edit course
          </Button>
        </section>
      )}

      <Workspace
        back={ROUTES.CENTER.PROGRAMS}
        backLabel="Courses"
        title="Batches"
        description={<Breadcrumb items={[{ label: 'Courses', to: ROUTES.CENTER.PROGRAMS }, { label: programName }]} />}
        actions={
          <Button onClick={startNew} disabled={!course || course.status === 'archived'} title={course?.status === 'archived' ? 'Archived courses do not take new batches' : undefined}>
            <Icon name="plus" size={17} />
            New batch
          </Button>
        }
        flush
      >
        <Tabs
          tabs={[
            { value: 'active', label: 'Active and upcoming', count: active.length },
            { value: 'history', label: 'History', count: history.length },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === 'active' && review > 0 && (
          <p className="inline-alert" role="status">
            <Icon name="alert" size={16} />
            {review === 1 ? 'One batch is' : `${review} batches are`} past the expected completion date without meeting the completion conditions. Open {review === 1 ? 'it' : 'each one'} to extend or confirm completion.
          </p>
        )}
        {error && (
          <p className="form-error inset" role="alert">
            {error}
          </p>
        )}
        <DataTable
          columns={tab === 'active' ? ACTIVE_COLUMNS : HISTORY_COLUMNS}
          rows={list}
          loading={loading}
          empty={
            search
              ? { icon: 'search', title: 'No matches', text: `No batch matches “${search}”.` }
              : tab === 'active'
                ? { icon: 'calendar', title: 'No active batches', text: 'Open a batch when a new class starts. Finished batches move to History on their own.' }
                : { icon: 'calendar', title: 'No history yet', text: 'Completed and cancelled batches of this course are kept here with their records.' }
          }
          rowHref={(b) => toPath(ROUTES.CENTER.BATCH, { programId, batchId: b.id })}
          showArrow
        />
      </Workspace>

      <Modal
        open={open}
        title={`New batch · ${programName}`}
        onClose={() => !saving && setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="batch-form" disabled={saving}>
              {saving ? 'Saving…' : 'Create batch'}
            </Button>
          </>
        }
      >
        <form id="batch-form" className="form-fields" onSubmit={save}>
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
          <BatchFields form={form} set={(key, value) => setForm((f) => ({ ...f, [key]: value }))} course={course} teachers={teachers} />
        </form>
      </Modal>
    </>
  )
}
