import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import { ErrorState } from '../../../components/EmptyState/EmptyState.jsx'
import TextArea from '../../../components/form/TextArea.jsx'
import TextInput from '../../../components/form/TextInput.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { programService } from '../../../services/programService.js'
import { MODES } from '../../../utils/training.js'

const EMPTY = {
  course_code: '',
  course_name: '',
  qualification: 'NC II',
  capacity: 25,
  status: 'open',
  description: '',
  duration_hours: '',
  training_days: '',
  duration_value: '',
  duration_unit: 'weeks',
  training_mode: 'face_to_face',
  class_days: '',
  class_schedule: '',
  course_outline: '',
}

const fromCourse = (c) => Object.fromEntries(Object.keys(EMPTY).map((k) => [k, c[k] ?? EMPTY[k]]))

/** Register a course, or edit one (route with :programId). Field names follow the backend's /courses endpoint. */
export default function RegisterProgramPage() {
  const { programId } = useParams()
  const editing = Boolean(programId)
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(editing)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!editing) return
    programService
      .get(programId)
      .then((data) => setForm(fromCourse(data.course)))
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [editing, programId])

  const field = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })
  const back = editing ? toPath(ROUTES.CENTER.BATCHES, { programId }) : ROUTES.CENTER.PROGRAMS

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.course_code.trim() || !form.course_name.trim()) return setError('Enter both the course code and name.')
    setBusy(true)
    setError('')
    try {
      const payload = { ...form, capacity: Number(form.capacity) || 25 }
      const data = editing ? await programService.update(programId, payload) : await programService.create(payload)
      navigate(toPath(ROUTES.CENTER.BATCHES, { programId: editing ? programId : data.course.id }))
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  if (loadError) {
    return (
      <>
        <PageHeader title="Courses" />
        <Workspace back={ROUTES.CENTER.PROGRAMS} backLabel="Courses">
          <ErrorState what="this course" message={loadError} />
        </Workspace>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Courses" subtitle={editing ? 'Update the course details and its standard training duration.' : 'Register a course your center is accredited to offer.'} />
      <Workspace back={back} backLabel={editing ? 'Course' : 'Courses'} title={editing ? `Edit ${form.course_name || 'course'}` : 'Register a course'} flush>
        <form className="form-card" onSubmit={handleSubmit} noValidate aria-busy={loading}>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-section">
            <div className="form-section-intro">
              <h3>Course</h3>
              <p>Use the code and title from the training regulations.</p>
            </div>
            <div className="form-fields">
              <div className="form-row">
                <TextInput id="course_name" label="Course name" placeholder="e.g. Shielded Metal Arc Welding" required disabled={loading} {...field('course_name')} />
                <TextInput id="course_code" label="Course code" placeholder="e.g. SMAW-NCII" required disabled={loading} {...field('course_code')} />
              </div>
              <div className="form-row even">
                <TextInput id="qualification" label="Qualification level" placeholder="e.g. NC II" disabled={loading} {...field('qualification')} />
                <TextInput id="capacity" label="Trainees per batch" type="number" min={1} disabled={loading} {...field('capacity')} />
              </div>
              <TextArea id="description" label="Description" rows={4} placeholder="What trainees learn, e.g. welding carbon steel plates and pipes using SMAW." disabled={loading} {...field('description')} />
              {editing && (
                <label className="field" htmlFor="status">
                  <span>Status</span>
                  <select id="status" {...field('status')}>
                    <option value="open">Open: accepting new batches</option>
                    <option value="closed">Closed: not offered right now</option>
                    <option value="archived">Archived: kept for history only</option>
                  </select>
                </label>
              )}
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-intro">
              <h3>Training duration</h3>
              <p>The standard for this course. Each batch can set its own dates and hours.</p>
            </div>
            <div className="form-fields">
              <div className="form-row even">
                <TextInput id="duration_hours" label="Total training hours" type="number" min={1} max={5000} placeholder="e.g. 280" disabled={loading} {...field('duration_hours')} />
                <TextInput id="training_days" label="Estimated training days" type="number" min={1} max={1000} placeholder="e.g. 35" disabled={loading} {...field('training_days')} />
              </div>
              <div className="form-row even">
                <div className="field">
                  <label htmlFor="duration_value">Estimated duration</label>
                  <div className="input-pair">
                    <input id="duration_value" type="number" min={1} max={120} placeholder="e.g. 10" disabled={loading} {...field('duration_value')} />
                    <select aria-label="Duration unit" disabled={loading} {...field('duration_unit')}>
                      <option value="weeks">weeks</option>
                      <option value="months">months</option>
                    </select>
                  </div>
                </div>
                <label className="field" htmlFor="training_mode">
                  <span>Training mode</span>
                  <select id="training_mode" disabled={loading} {...field('training_mode')}>
                    {MODES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Button variant="secondary" to={back}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || loading}>
              {busy ? 'Saving…' : editing ? 'Save course' : 'Register course'}
            </Button>
          </div>
        </form>
      </Workspace>
    </>
  )
}
