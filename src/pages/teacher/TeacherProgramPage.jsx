import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import DataTable from '../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import EmptyState, { ErrorState } from '../../components/EmptyState/EmptyState.jsx'
import TextArea from '../../components/form/TextArea.jsx'
import TextInput from '../../components/form/TextInput.jsx'
import Icon from '../../components/Icon/Icon.jsx'
import Modal from '../../components/Modal/Modal.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../constants/routes.js'
import { useAuth } from '../../hooks/useAuth.js'
import { teacherService } from '../../services/teacherService.js'
import { dateRange, listTime } from '../../utils/format.js'

const EMPTY_MATERIAL = { title: '', description: '', resource_url: '' }

const BATCH_COLUMNS = [
  {
    key: 'batch_name',
    label: 'Batch',
    className: 'cell-wrap',
    render: (b) => (
      <span className="cell-stack">
        <strong>{b.batch_name}</strong>
        <small>{b.instructor_name || 'No teacher yet'}</small>
      </span>
    ),
  },
  { key: 'dates', label: 'Schedule', render: (b) => <span className="muted num">{dateRange(b.start_date, b.end_date)}</span> },
  { key: 'enrolled', label: 'Trainees', align: 'end', render: (b) => <span className="num">{`${b.enrolled ?? 0}/${b.capacity}`}</span> },
  { key: 'status', label: 'Status', render: (b) => <StatusBadge status={b.status} /> },
]

// One program from the teacher's side: schedule and outline, materials, batches.
export default function TeacherProgramPage() {
  const { programId } = useParams()
  const { user } = useAuth()
  const [data, setData] = useState(null) // { course, roster, materials } | false (not found) | undefined (failed)
  const [loadError, setLoadError] = useState('')
  const [batches, setBatches] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const [editing, setEditing] = useState(false)
  const [schedule, setSchedule] = useState({ class_days: '', class_schedule: '', course_outline: '' })
  const [savingSchedule, setSavingSchedule] = useState(false)

  const [materialOpen, setMaterialOpen] = useState(false)
  const [material, setMaterial] = useState(EMPTY_MATERIAL)
  const [materialError, setMaterialError] = useState('')
  const [savingMaterial, setSavingMaterial] = useState(false)

  const load = useCallback(() => {
    teacherService
      .program(programId)
      .then((d) => {
        setLoadError('')
        setData(d)
      })
      .catch((err) => {
        if (err?.status === 404) return setData(false)
        setLoadError(err?.message || 'Something went wrong.')
        setData((prev) => prev || undefined)
      })
    teacherService
      .batches(programId)
      .then((res) => setBatches(res.batches ?? []))
      .catch(() => setBatches([]))
  }, [programId])

  useEffect(() => {
    load()
  }, [load])

  const course = data?.course
  const materials = data?.materials ?? []
  const roster = data?.roster ?? []
  const mine = (batches ?? []).filter((b) => Number(b.instructor_id) === Number(user?.id)).length

  const startEdit = () => {
    setSchedule({ class_days: course.class_days ?? '', class_schedule: course.class_schedule ?? '', course_outline: course.course_outline ?? '' })
    setError('')
    setEditing(true)
  }

  const saveSchedule = async (event) => {
    event.preventDefault()
    setSavingSchedule(true)
    setError('')
    try {
      await teacherService.updateSchedule(programId, schedule)
      setData((d) => ({ ...d, course: { ...d.course, ...schedule } }))
      setEditing(false)
      setNotice('Schedule and outline saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingSchedule(false)
    }
  }

  const saveMaterial = async (event) => {
    event.preventDefault()
    setSavingMaterial(true)
    setMaterialError('')
    try {
      await teacherService.addMaterial(programId, material)
      setMaterialOpen(false)
      setMaterial(EMPTY_MATERIAL)
      setNotice('Material shared with enrolled trainees.')
      load()
    } catch (err) {
      setMaterialError(err.message)
    } finally {
      setSavingMaterial(false)
    }
  }

  const bind = (setter, values) => (key) => ({ value: values[key], onChange: (e) => setter((v) => ({ ...v, [key]: e.target.value })) })
  const materialField = bind(setMaterial, material)
  const scheduleField = bind(setSchedule, schedule)

  if (data === undefined) {
    return (
      <>
        <PageHeader title="Program" />
        <Workspace back={ROUTES.TEACHER.PROGRAMS} backLabel="Programs">
          <ErrorState
            what="this program"
            message={loadError}
            onRetry={() => {
              setData(null)
              load()
            }}
          />
        </Workspace>
      </>
    )
  }

  if (data === false) {
    return (
      <>
        <PageHeader title="Program" />
        <Workspace back={ROUTES.TEACHER.PROGRAMS} backLabel="Programs">
          <EmptyState icon="programs" title="Program not found" text="It may belong to another center, or the link is incomplete." />
        </Workspace>
      </>
    )
  }

  return (
    <>
      <PageHeader title={course?.course_name ?? 'Program'} subtitle={course ? `${course.course_code} · ${course.qualification}${course.duration_hours ? ` · ${course.duration_hours} hours` : ''}` : 'Loading…'} />

      {notice && (
        <p className="notice inset teacher-notice" role="status">
          {notice}
        </p>
      )}

      <div className="teacher-layout">
        <div className="teacher-main">
          <Workspace
            title="Batches"
            description={batches === null ? 'Loading…' : `${batches.length} in this course · ${mine} assigned to you. The learning center opens batches and enrolls trainees.`}
            flush
          >
            <DataTable
              columns={BATCH_COLUMNS}
              rows={batches ?? []}
              loading={batches === null}
              empty={{ icon: 'calendar', title: 'No batches yet', text: 'The learning center opens batches for this course and assigns their teachers.' }}
              rowHref={(b) => (Number(b.instructor_id) === Number(user?.id) ? toPath(ROUTES.TEACHER.CLASSROOM, { batchId: b.id }) : toPath(ROUTES.TEACHER.STUDENTS, { programId, batchId: b.id }))}
            />
          </Workspace>

          <Workspace
            title="Enrolled trainees"
            description={`${roster.length} enrolled in this program`}
            flush
          >
            <DataTable
              columns={[
                {
                  key: 'full_name',
                  label: 'Trainee',
                  render: (s) => (
                    <span className="cell-stack">
                      <strong>{s.full_name}</strong>
                      <small>{s.email}</small>
                    </span>
                  ),
                },
                { key: 'enrolled_at', label: 'Enrolled', align: 'end', render: (s) => <span className="muted num">{listTime(s.enrolled_at)}</span> },
              ]}
              rows={roster}
              rowKey="email"
              loading={data === null}
              empty={{ icon: 'users', title: 'No trainees enrolled yet', text: 'Trainees enrolled in this program show up here.' }}
            />
          </Workspace>
        </div>

        <aside className="teacher-side">
          <section className="alw-card alw-pad">
            <div className="teacher-card-head">
              <h3>Class schedule</h3>
              {course && !editing && (
                <button type="button" className="icon-btn" onClick={startEdit} aria-label="Edit schedule and outline" title="Edit">
                  <Icon name="edit" size={16} />
                </button>
              )}
            </div>
            {error && <p className="form-error">{error}</p>}
            {editing ? (
              <form className="form-fields" onSubmit={saveSchedule}>
                <TextInput id="class_days" label="Class days" placeholder="e.g. Monday, Wednesday, Friday" {...scheduleField('class_days')} />
                <TextArea id="class_schedule" label="Schedule" rows={3} placeholder="e.g. 8:00 AM – 12:00 NN, Room 2" {...scheduleField('class_schedule')} />
                <TextArea id="course_outline" label="Course outline" rows={6} placeholder="Modules and topics, one per line" {...scheduleField('course_outline')} />
                <div className="teacher-form-actions">
                  <Button variant="secondary" onClick={() => setEditing(false)} disabled={savingSchedule}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={savingSchedule}>
                    {savingSchedule ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </form>
            ) : (
              <dl className="teacher-facts">
                <div>
                  <dt>Class days</dt>
                  <dd>{course?.class_days || 'Not set'}</dd>
                </div>
                <div>
                  <dt>Schedule</dt>
                  <dd className="teacher-pre">{course?.class_schedule || 'Not set'}</dd>
                </div>
                <div>
                  <dt>Course outline</dt>
                  <dd className="teacher-pre">{course?.course_outline || 'Not set'}</dd>
                </div>
              </dl>
            )}
          </section>

          <section className="alw-card alw-pad">
            <div className="teacher-card-head">
              <h3>Learning materials</h3>
              <button type="button" className="icon-btn" onClick={() => setMaterialOpen(true)} disabled={!course} aria-label="Add material" title="Add material">
                <Icon name="plus" size={16} />
              </button>
            </div>
            {materials.length ? (
              <ul className="teacher-materials">
                {materials.map((m) => (
                  <li key={m.id}>
                    <a href={m.resource_url} target="_blank" rel="noreferrer noopener">
                      <Icon name="documents" size={16} />
                      <span className="cell-stack">
                        <strong>{m.title}</strong>
                        {m.description && <small>{m.description}</small>}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="alw-help">No materials yet. Share a link to slides, modules, or videos for your trainees.</p>
            )}
          </section>
        </aside>
      </div>

      <Modal
        open={materialOpen}
        title="Share a learning material"
        onClose={() => setMaterialOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setMaterialOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="teacher-material-form" disabled={savingMaterial}>
              {savingMaterial ? 'Saving…' : 'Share'}
            </Button>
          </>
        }
      >
        <form id="teacher-material-form" className="form-fields" onSubmit={saveMaterial}>
          {materialError && <p className="form-error">{materialError}</p>}
          <TextInput id="material_title" label="Title" placeholder="e.g. Module 1: Computer hardware" required maxLength={150} {...materialField('title')} />
          <TextInput id="resource_url" label="Link" type="url" placeholder="https://…" required {...materialField('resource_url')} />
          <TextArea id="material_description" label="Description (optional)" rows={2} maxLength={500} {...materialField('description')} />
        </form>
      </Modal>
    </>
  )
}
