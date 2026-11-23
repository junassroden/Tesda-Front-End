import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Breadcrumb from '../../../components/Breadcrumb/Breadcrumb.jsx'
import Button from '../../../components/Button/Button.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import EmptyState, { ErrorState } from '../../../components/EmptyState/EmptyState.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import Modal from '../../../components/Modal/Modal.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import SearchBar from '../../../components/SearchBar/SearchBar.jsx'
import Tabs from '../../../components/Tabs/Tabs.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import AttendancePanel from '../../../components/training/AttendancePanel.jsx'
import BatchFields from '../../../components/training/BatchFields.jsx'
import ConfirmDialog from '../../../components/training/ConfirmDialog.jsx'
import Meter from '../../../components/training/Meter.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { batchService, studentRecordService } from '../../../services/trainingService.js'
import { exportReport } from '../../../utils/exportReport.js'
import { fullDateTime, shortDate } from '../../../utils/format.js'
import { batchBadge, batchPayload, batchToForm, daysLabel, hoursLabel, initials, modeLabel, sessionLabel, trainingState } from '../../../utils/training.js'

const MEMBER_LABEL = { active: 'Active', completed: 'Completed', dropped: 'Removed', transferred: 'Transferred' }

/**
 * A batch's management page. portal 'center' (learning center admin: full control)
 * or 'admin' (main office: read only, for regional monitoring).
 */
export default function BatchPage({ portal = 'center' }) {
  const { programId, batchId } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('trainees')
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState(null) // { kind, student? }

  const load = useCallback(
    () =>
      batchService
        .get(batchId)
        .then((d) => {
          setError('')
          setData(d)
        })
        .catch((err) => setError(err.message)),
    [batchId],
  )

  useEffect(() => {
    load()
  }, [load])

  const merge = (payload) => {
    setData((d) => ({ ...d, ...Object.fromEntries(Object.entries(payload).filter(([k]) => ['batch', 'students', 'sessions'].includes(k))) }))
    if (payload.message) setNotice(payload.message)
  }

  const done = async (payload) => {
    setDialog(null)
    setNotice(payload.message)
    await load()
  }

  const batch = data?.batch
  const manage = portal === 'center' && data?.can_manage
  const active = batch && !batch.in_history
  const courseId = programId ?? batch?.course_id
  const links =
    portal === 'admin'
      ? { list: ROUTES.ADMIN.TRAINING, listLabel: 'Training history', crumbs: [{ label: 'Training history', to: ROUTES.ADMIN.TRAINING }] }
      : {
          list: toPath(ROUTES.CENTER.BATCHES, { programId: courseId }),
          listLabel: 'Course',
          crumbs: [
            { label: 'Courses', to: ROUTES.CENTER.PROGRAMS },
            { label: batch?.course_name ?? 'Course', to: toPath(ROUTES.CENTER.BATCHES, { programId: courseId }) },
          ],
        }

  if (error && !data) {
    return (
      <>
        <PageHeader title="Batch" />
        <Workspace back={links.list} backLabel={links.listLabel}>
          <ErrorState what="this batch" message={error} onRetry={load} />
        </Workspace>
      </>
    )
  }

  const students = data?.students ?? []
  const current = students.filter((s) => s.status === 'active' || s.status === 'completed')
  const former = students.filter((s) => s.status === 'dropped' || s.status === 'transferred')

  const traineeColumns = [
    {
      key: 'full_name',
      label: 'Trainee',
      render: (s) => (
        <span className="doc-name">
          <span className="avatar">{initials(s.full_name)}</span>
          <span className="cell-stack">
            {portal === 'center' ? (
              <Link to={toPath(ROUTES.CENTER.STUDENT_RECORD, { studentId: s.id })}>
                <strong>{s.full_name}</strong>
              </Link>
            ) : (
              <strong>{s.full_name}</strong>
            )}
            <small className="num">{s.student_number || s.email}</small>
          </span>
        </span>
      ),
    },
    {
      key: 'attendance',
      label: 'Attendance',
      render: (s) => (
        <span className="cell-stack">
          <span className="num">{s.attendance_rate === null ? '—' : `${s.attendance_rate}%`}</span>
          <small className="num">
            {s.attended} of {s.sessions_held} sessions{s.late ? ` · ${s.late} late` : ''}
          </small>
        </span>
      ),
    },
    { key: 'assigned_at', label: 'Enrolled', render: (s) => <span className="muted num">{shortDate(s.assigned_at)}</span> },
    {
      key: 'status',
      label: 'Status',
      className: 'cell-wrap',
      render: (s) => (
        <span className="cell-stack">
          <StatusBadge status={s.status === 'dropped' ? 'removed' : s.status} />
          {s.status === 'transferred' && s.transferred_to_batch_name && <small>To {s.transferred_to_batch_name}</small>}
          {s.end_reason && s.status !== 'completed' && <small title={s.end_reason}>{s.end_reason}</small>}
        </span>
      ),
    },
    ...(manage && active
      ? [
          {
            key: 'actions',
            label: '',
            align: 'end',
            render: (s) =>
              s.status === 'active' ? (
                <span className="row-actions">
                  <button type="button" className="link-btn" onClick={() => setDialog({ kind: 'transfer', student: s })}>
                    Transfer
                  </button>
                  <button type="button" className="link-btn danger" onClick={() => setDialog({ kind: 'remove', student: s })}>
                    Remove
                  </button>
                </span>
              ) : null,
          },
        ]
      : []),
  ]

  const exportRows = students.map((s) => ({
    ...s,
    status: MEMBER_LABEL[s.status] ?? s.status,
    attendance: s.attendance_rate === null ? '' : `${s.attendance_rate}%`,
  }))

  return (
    <>
      <PageHeader
        title={batch?.batch_name ?? 'Batch'}
        subtitle={batch ? `${batch.course_name} · Batch ${String(batch.batch_number).padStart(2, '0')}${portal === 'admin' ? ` · ${batch.training_center_name}` : ''}` : 'Loading…'}
        onExport={
          batch
            ? (format) =>
                exportReport(format, {
                  title: `${batch.batch_name} trainees`,
                  columns: [
                    { key: 'student_number', label: 'Student ID' },
                    { key: 'full_name', label: 'Name' },
                    { key: 'attendance', label: 'Attendance' },
                    { key: 'status', label: 'Status' },
                  ],
                  rows: exportRows,
                })
            : undefined
        }
        actions={
          batch && (
            <Button variant="secondary" to={toPath(ROUTES.PRINT.BATCH, { batchId: batch.id })} target="_blank">
              <Icon name="download" size={16} />
              Print records
            </Button>
          )
        }
      />

      {notice && (
        <p className="notice-bar" role="status">
          <Icon name="check" size={16} />
          {notice}
          <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => setNotice('')}>
            <Icon name="x" size={14} />
          </button>
        </p>
      )}

      {batch?.needs_review && (
        <div className="review-banner" role="alert">
          <Icon name="alert" size={18} />
          <div>
            <strong>Needs review</strong>
            <p>{batch.review_reason}</p>
          </div>
          {manage && (
            <div className="review-actions">
              <Button variant="secondary" onClick={() => setDialog({ kind: 'extend' })}>
                Extend
              </Button>
              <Button onClick={() => setDialog({ kind: 'complete' })}>Confirm completion</Button>
            </div>
          )}
        </div>
      )}

      {batch?.status === 'suspended' && (
        <div className="review-banner is-warning" role="status">
          <Icon name="clock" size={18} />
          <div>
            <strong>Training suspended{batch.suspended_at ? ` since ${shortDate(batch.suspended_at)}` : ''}</strong>
            <p>{batch.status_reason || 'No reason recorded.'} The batch will not complete automatically while suspended.</p>
          </div>
          {manage && (
            <div className="review-actions">
              <Button onClick={() => setDialog({ kind: 'resume' })}>Resume training</Button>
            </div>
          )}
        </div>
      )}

      {batch && (
        <section className="card batch-summary">
          <div className="batch-summary-main">
            <div className="batch-summary-status">
              <StatusBadge status={batchBadge(batch)} />
              {['upcoming', 'completed'].includes(batch.status) && <span className="muted">{batch.status === 'completed' ? `On ${shortDate(batch.completed_at)}` : trainingState(batch)}</span>}
            </div>
            <Meter
              label="Training progress"
              value={batch.progress}
              tone={batch.progress >= 100 ? 'success' : 'brand'}
              detail={`${hoursLabel(batch.held_hours)} recorded over ${batch.sessions_held} ${batch.sessions_held === 1 ? 'session' : 'sessions'}${batch.required_hours ? ` · ${batch.required_hours} hours required` : ' · set the required hours to track progress'}`}
            />
          </div>
          <dl className="fact-row">
            <div>
              <dt>Training period</dt>
              <dd className="num">
                {batch.start_date ? shortDate(batch.start_date) : 'Not set'} – {batch.end_date ? shortDate(batch.end_date) : 'Not set'}
              </dd>
              {batch.planned_end_date && batch.end_date && batch.planned_end_date !== batch.end_date && <small>Originally {shortDate(batch.planned_end_date)}</small>}
            </div>
            <div>
              <dt>Schedule</dt>
              <dd>{daysLabel(batch.days_of_week)}</dd>
              <small>{sessionLabel(batch.session_start, batch.session_end)}</small>
            </div>
            <div>
              <dt>Venue · mode</dt>
              <dd>{batch.venue || 'Venue not set'}</dd>
              <small>
                {modeLabel(batch.training_mode)}
                {batch.session_frequency ? ` · ${batch.session_frequency}` : ''}
              </small>
            </div>
            <div>
              <dt>Teacher</dt>
              <dd>{batch.instructor_name || 'Not assigned'}</dd>
              {manage && active && (
                <button type="button" className="link-btn" onClick={() => setDialog({ kind: 'teacher' })}>
                  {batch.instructor_name ? 'Change' : 'Assign'}
                </button>
              )}
            </div>
            <div>
              <dt>Trainees</dt>
              <dd className="num">
                {students.filter((s) => s.status === 'active').length || batch.enrolled} / {batch.capacity}
              </dd>
              {batch.training_days && <small className="num">{batch.training_days} training days</small>}
            </div>
          </dl>
          {manage && active && (
            <div className="batch-summary-actions">
              <Button variant="secondary" onClick={() => setDialog({ kind: 'edit' })}>
                <Icon name="edit" size={16} />
                Edit
              </Button>
              {batch.status !== 'suspended' && (
                <Button variant="secondary" onClick={() => setDialog({ kind: 'extend' })}>
                  Extend
                </Button>
              )}
              {batch.status !== 'suspended' && (
                <Button variant="secondary" onClick={() => setDialog({ kind: 'suspend' })}>
                  Suspend
                </Button>
              )}
              {(batch.status === 'ongoing' || batch.status === 'suspended') && !batch.needs_review && (
                <Button variant="secondary" onClick={() => setDialog({ kind: 'complete' })}>
                  Complete
                </Button>
              )}
              <Button variant="ghost" onClick={() => setDialog({ kind: 'cancel' })}>
                Cancel batch
              </Button>
            </div>
          )}
          {batch.in_history && (
            <p className="history-note">
              <Icon name="calendar" size={15} />
              {batch.status === 'completed'
                ? `Completed ${shortDate(batch.completed_at)}${batch.completion_mode === 'auto' ? ' automatically' : batch.completed_by_name ? `, confirmed by ${batch.completed_by_name}` : ''}. This batch is in history; its records are kept read-only.`
                : `Cancelled. ${batch.status_reason || ''} Its records are kept read-only.`}
            </p>
          )}
        </section>
      )}

      <Workspace
        back={links.list}
        backLabel={links.listLabel}
        title="Batch records"
        description={<Breadcrumb items={[...links.crumbs, { label: batch?.batch_name ?? 'Batch' }]} />}
        actions={
          manage &&
          active &&
          tab === 'trainees' && (
            <Button onClick={() => setDialog({ kind: 'enroll' })}>
              <Icon name="plus" size={17} />
              Enroll student
            </Button>
          )
        }
        flush
      >
        <Tabs
          tabs={[
            { value: 'trainees', label: 'Trainees', count: current.length },
            { value: 'attendance', label: 'Sessions and attendance', count: data?.sessions?.length ?? 0 },
            { value: 'activity', label: 'Activity' },
          ]}
          value={tab}
          onChange={setTab}
        />
        {!data ? (
          <DataTable columns={traineeColumns.slice(0, 4)} rows={[]} loading />
        ) : tab === 'trainees' ? (
          <>
            <DataTable
              columns={traineeColumns}
              rows={current}
              empty={{ icon: 'users', title: 'No trainees yet', text: manage && active ? 'Enroll students from your student records. They get classroom access right away.' : 'No trainees were enrolled in this batch.' }}
            />
            {former.length > 0 && (
              <>
                <h3 className="subsection-title">Former trainees</h3>
                <DataTable columns={traineeColumns.filter((c) => c.key !== 'actions')} rows={former} />
              </>
            )}
          </>
        ) : tab === 'attendance' ? (
          <AttendancePanel batch={batch} students={students} sessions={data.sessions} canRecord={data.can_record_attendance && portal === 'center'} onSaved={merge} />
        ) : data.activity.length ? (
          <ol className="timeline">
            {data.activity.map((a) => (
              <li key={a.id}>
                <span className={`timeline-dot action-${a.action}`} aria-hidden="true" />
                <div>
                  <p>{a.description}</p>
                  <small>
                    {fullDateTime(a.created_at)} · {a.user_name || 'System (automatic)'}
                  </small>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState icon="clock" title="No activity yet" text="Status changes, enrollments and attendance are recorded here." />
        )}
      </Workspace>

      {batch && dialog && <BatchDialogs key={`${dialog.kind}-${dialog.student?.id ?? ''}`} dialog={dialog} batch={batch} onClose={() => setDialog(null)} onDone={done} />}
    </>
  )
}

/** Every modal of the batch page. Each one reports back through onDone(payload). */
function BatchDialogs({ dialog, batch, onClose, onDone }) {
  const { kind, student } = dialog
  const status = (action, extra) => batchService.changeStatus(batch.id, action, extra).then(onDone)

  if (kind === 'edit') return <EditBatchModal batch={batch} onClose={onClose} onDone={onDone} />
  if (kind === 'teacher') return <TeacherModal batch={batch} onClose={onClose} onDone={onDone} />
  if (kind === 'enroll') return <EnrollModal batch={batch} onClose={onClose} onDone={onDone} />
  if (kind === 'transfer') return <TransferModal batch={batch} student={student} onClose={onClose} onDone={onDone} />

  const dayAfterEnd = batch.end_date ? new Date(new Date(batch.end_date).getTime() + 86400000).toISOString().slice(0, 10) : batch.start_date || undefined
  const configs = {
    suspend: {
      title: 'Suspend training',
      message: 'Training pauses: attendance stops and the batch will not complete automatically until it is resumed.',
      confirmLabel: 'Suspend',
      variant: 'danger',
      reason: { label: 'Reason', required: true, placeholder: 'e.g. Typhoon damage to the workshop' },
      run: ({ reason }) => status('suspend', { reason }),
    },
    resume: {
      title: 'Resume training',
      message: 'Training continues. Move the expected completion date if the suspension used up training days.',
      confirmLabel: 'Resume',
      date: { label: 'New expected completion (optional)', min: dayAfterEnd },
      reason: { label: 'Note (optional)' },
      run: ({ reason, date }) => status('resume', { reason, end_date: date }),
    },
    extend: {
      title: 'Extend training',
      message: batch.end_date ? `The batch currently ends ${shortDate(batch.end_date)}.` : 'Set the new expected completion date.',
      confirmLabel: 'Extend',
      date: { label: 'New expected completion', required: true, min: dayAfterEnd },
      reason: { label: 'Reason', required: true, placeholder: 'e.g. 40 hours lost to holidays' },
      run: ({ reason, date }) => status('extend', { reason, end_date: date }),
    },
    complete: {
      title: 'Confirm completion',
      message: `${batch.held_hours} of ${batch.required_hours ?? '—'} required hours are recorded. Completing moves the batch to history and marks its active trainees as completed. This cannot be undone.`,
      confirmLabel: 'Complete training',
      reason: { label: 'Note (optional)', placeholder: 'e.g. Institutional assessment done on Nov 20' },
      run: ({ reason }) => status('complete', { reason }),
    },
    cancel: {
      title: 'Cancel this batch',
      message: 'The batch moves to history as cancelled and its active trainees are removed from it. Their records stay. This cannot be undone.',
      confirmLabel: 'Cancel batch',
      variant: 'danger',
      reason: { label: 'Reason', required: true },
      run: ({ reason }) => status('cancel', { reason }),
    },
    remove: {
      title: `Remove ${student?.full_name ?? 'trainee'}`,
      message: 'They leave this batch and lose classroom access. Attendance, submissions and documents stay on record.',
      confirmLabel: 'Remove',
      variant: 'danger',
      reason: { label: 'Reason', required: true, placeholder: 'e.g. Stopped attending' },
      run: ({ reason }) => batchService.remove(batch.id, student.id, reason).then(onDone),
    },
  }
  const c = configs[kind]
  if (!c) return null
  return <ConfirmDialog open title={c.title} message={c.message} confirmLabel={c.confirmLabel} variant={c.variant} reason={c.reason} date={c.date} onClose={onClose} onConfirm={c.run} />
}

function EditBatchModal({ batch, onClose, onDone }) {
  const [form, setForm] = useState(() => batchToForm(batch))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      // eslint-disable-next-line no-unused-vars
      const { instructor_id, ...rest } = form
      onDone(await batchService.update(batch.id, batchPayload(rest)))
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }
  return (
    <Modal
      open
      title={`Edit ${batch.batch_name}`}
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="edit-batch-form" disabled={busy}>
            {busy ? 'Saving…' : 'Save batch'}
          </Button>
        </>
      }
    >
      <form id="edit-batch-form" className="form-fields" onSubmit={save}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <BatchFields form={form} set={(k, v) => setForm((f) => ({ ...f, [k]: v }))} course={{ course_code: batch.course_code, duration_hours: batch.course_hours, training_mode: batch.course_training_mode }} />
      </form>
    </Modal>
  )
}

function TeacherModal({ batch, onClose, onDone }) {
  const [teachers, setTeachers] = useState(null)
  const [choice, setChoice] = useState(batch.instructor_id ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    batchService
      .instructors()
      .then((d) => setTeachers(d.instructors ?? []))
      .catch((err) => setError(err.message))
  }, [])
  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      onDone(await batchService.assignTeacher(batch.id, choice))
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }
  return (
    <Modal
      open
      title="Assign a teacher"
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="teacher-form" disabled={busy || teachers === null}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="teacher-form" className="form-fields" onSubmit={save}>
        {error && <p className="form-error">{error}</p>}
        <p className="confirm-message">The teacher runs this batch&apos;s virtual classroom and records its attendance.</p>
        <label className="field" htmlFor="teacher-choice">
          <span>Teacher</span>
          <select id="teacher-choice" value={choice} onChange={(e) => setChoice(e.target.value)} disabled={teachers === null}>
            <option value="">No teacher</option>
            {(teachers ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </label>
      </form>
    </Modal>
  )
}

/** Search the center's student records, review the student's documents on file, then enroll. */
function EnrollModal({ batch, onClose, onDone }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [picked, setPicked] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = setTimeout(() => {
      studentRecordService
        .search(q.trim())
        .then((d) => setResults(d.students ?? []))
        .catch((err) => setError(err.message))
    }, 250)
    return () => clearTimeout(id)
  }, [q])

  const enroll = async () => {
    setBusy(true)
    setError('')
    try {
      onDone(await batchService.enroll(batch.id, picked.id))
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const docs = picked?.documents
  return (
    <Modal
      open
      title={`Enroll in ${batch.batch_name}`}
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button variant="ghost" to={`${ROUTES.CENTER.STUDENT_RECORDS}?new=1`} className="push-left">
            <Icon name="plus" size={16} />
            New student record
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={enroll} disabled={!picked || busy}>
            {busy ? 'Enrolling…' : 'Enroll'}
          </Button>
        </>
      }
    >
      <div className="form-fields">
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <SearchBar value={q} onChange={setQ} placeholder="Search name, email or student ID" />
        <ul className="pick-list" role="listbox" aria-label="Students">
          {results === null ? (
            <li className="muted">Loading…</li>
          ) : results.length === 0 ? (
            <li className="muted">No student matches. Check the spelling, or create a new student record.</li>
          ) : (
            results.slice(0, 30).map((s) => (
              <li key={s.id}>
                <button type="button" role="option" aria-selected={picked?.id === s.id} className={picked?.id === s.id ? 'on' : undefined} onClick={() => setPicked(s)}>
                  <span className="avatar">{initials(s.full_name)}</span>
                  <span className="cell-stack">
                    <strong>{s.full_name}</strong>
                    <small className="num">
                      {s.student_number || 'No student ID'} · {s.active_batches.length ? `In ${s.active_batches.join(', ')}` : 'Not in an active batch'}
                    </small>
                  </span>
                  <span className="num muted">
                    {s.documents.verified}/{s.documents.required} docs
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
        {picked && (
          <div className={docs.verified === docs.required ? 'doc-reuse is-complete' : 'doc-reuse'}>
            <Icon name={docs.verified === docs.required ? 'check' : 'documents'} size={16} />
            <p>
              {docs.verified === docs.required
                ? `All ${docs.required} required documents of ${picked.full_name} are verified and on file. They are reused for this enrollment; nothing needs to be submitted again.`
                : `${docs.verified} of ${docs.required} required documents are verified${docs.pending ? `, ${docs.pending} waiting for review` : ''}${docs.rejected ? `, ${docs.rejected} rejected` : ''}. Verified documents are reused; the rest can be completed after enrolling.`}{' '}
              <Link to={toPath(ROUTES.CENTER.STUDENT_RECORD, { studentId: picked.id })} target="_blank">
                Review documents
              </Link>
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}

function TransferModal({ batch, student, onClose, onDone }) {
  const [targets, setTargets] = useState(null)
  const [target, setTarget] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    batchService
      .forCourse(batch.course_id)
      .then((d) => setTargets((d.batches ?? []).filter((b) => !b.in_history && b.id !== batch.id)))
      .catch((err) => setError(err.message))
  }, [batch.course_id, batch.id])
  const save = async (event) => {
    event.preventDefault()
    if (!target) return setError('Choose the batch to move to.')
    setBusy(true)
    setError('')
    try {
      onDone(await batchService.transfer(batch.id, student.id, target, reason.trim()))
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }
  return (
    <Modal
      open
      title={`Transfer ${student.full_name}`}
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="transfer-form" disabled={busy || !targets?.length}>
            {busy ? 'Moving…' : 'Transfer'}
          </Button>
        </>
      }
    >
      <form id="transfer-form" className="form-fields" onSubmit={save}>
        {error && <p className="form-error">{error}</p>}
        <p className="confirm-message">The trainee moves to another batch of {batch.course_name}. Their classroom access follows them; their record in this batch is kept as transferred.</p>
        {targets && !targets.length ? (
          <p className="muted">There is no other active batch of this course. Create one first.</p>
        ) : (
          <label className="field" htmlFor="transfer-target">
            <span>Move to</span>
            <select id="transfer-target" required value={target} onChange={(e) => setTarget(e.target.value)} disabled={!targets}>
              <option value="">Choose a batch</option>
              {(targets ?? []).map((b) => (
                <option key={b.id} value={b.id} disabled={b.enrolled >= b.capacity}>
                  {b.batch_name} · {b.enrolled}/{b.capacity}
                  {b.enrolled >= b.capacity ? ' (full)' : ''}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="field" htmlFor="transfer-reason">
          <span>Reason (optional)</span>
          <textarea id="transfer-reason" rows={2} maxLength={255} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
      </form>
    </Modal>
  )
}
