import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ErrorState } from '../../components/EmptyState/EmptyState.jsx'
import { PrintHeader, PrintToolbar } from '../../components/training/PrintParts.jsx'
import { batchService } from '../../services/trainingService.js'
import { shortDate } from '../../utils/format.js'
import { daysLabel, hoursLabel, modeLabel, sessionLabel, trainingState } from '../../utils/training.js'

const MEMBER = { active: 'Active', completed: 'Completed', dropped: 'Removed', transferred: 'Transferred' }

/** Print-ready batch student records: schedule, trainees with attendance, and the session log. */
export default function PrintBatchPage() {
  const { batchId } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    batchService
      .get(batchId)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [batchId])

  useEffect(() => {
    document.title = data ? `Batch student records · ${data.batch.batch_name}` : 'Batch student records'
  }, [data])

  if (error) return <ErrorState what="this batch" message={error} />
  if (!data) return <p className="print-loading">Preparing the sheet…</p>

  const b = data.batch
  const sessions = [...data.sessions].sort((x, y) => x.session_date.localeCompare(y.session_date))

  return (
    <div className="print-doc">
      <PrintToolbar title="Batch student records" />
      <PrintHeader center={b.training_center_name} title="Batch student records" />

      <section className="print-section">
        <h2>
          {b.course_name} ({b.course_code}) · {b.batch_name}
        </h2>
        <dl className="print-grid">
          <div>
            <dt>Status</dt>
            <dd>{trainingState(b)}</dd>
          </div>
          <div>
            <dt>Teacher</dt>
            <dd>{b.instructor_name || '—'}</dd>
          </div>
          <div>
            <dt>Training period</dt>
            <dd>
              {shortDate(b.start_date)} – {shortDate(b.end_date)}
              {b.planned_end_date && b.end_date && b.planned_end_date !== b.end_date ? ` (originally ${shortDate(b.planned_end_date)})` : ''}
            </dd>
          </div>
          <div>
            <dt>Completed</dt>
            <dd>{b.completed_at ? shortDate(b.completed_at) : '—'}</dd>
          </div>
          <div>
            <dt>Training days</dt>
            <dd>{daysLabel(b.days_of_week)}</dd>
          </div>
          <div>
            <dt>Session time</dt>
            <dd>{sessionLabel(b.session_start, b.session_end)}</dd>
          </div>
          <div>
            <dt>Venue · mode</dt>
            <dd>
              {b.venue || '—'} · {modeLabel(b.training_mode)}
            </dd>
          </div>
          <div>
            <dt>Training hours</dt>
            <dd>
              {hoursLabel(b.held_hours)} recorded of {b.required_hours ? `${b.required_hours} h required` : 'no requirement set'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="print-section">
        <h2>Trainees ({data.students.length})</h2>
        <table className="print-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student ID</th>
              <th>Name</th>
              <th>Enrolled</th>
              <th>Sessions attended</th>
              <th>Attendance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((s, i) => (
              <tr key={s.id}>
                <td>{i + 1}</td>
                <td>{s.student_number || '—'}</td>
                <td>{s.full_name}</td>
                <td>{shortDate(s.assigned_at)}</td>
                <td>
                  {s.attended} of {s.sessions_held}
                </td>
                <td>{s.attendance_rate === null ? '—' : `${s.attendance_rate}%`}</td>
                <td>
                  {MEMBER[s.status] ?? s.status}
                  {s.status === 'transferred' && s.transferred_to_batch_name ? ` to ${s.transferred_to_batch_name}` : ''}
                  {s.end_reason && s.status !== 'completed' ? ` (${s.end_reason})` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="print-section">
        <h2>Training sessions ({sessions.length})</h2>
        {sessions.length ? (
          <table className="print-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Hours</th>
                <th>Topic</th>
                <th>Present</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>{shortDate(s.session_date)}</td>
                  <td>{s.status === 'held' ? sessionLabel(s.start_time, s.end_time) : 'Cancelled'}</td>
                  <td>{s.status === 'held' ? s.hours : 0}</td>
                  <td>{s.topic || ''}</td>
                  <td>{s.status === 'held' ? `${s.present} of ${Object.keys(s.marks ?? {}).length}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No sessions recorded.</p>
        )}
      </section>

      <div className="print-sign">
        <div>
          <span />
          Trainer
        </div>
        <div>
          <span />
          Learning center administrator
        </div>
      </div>
      <footer className="print-foot">Generated {new Date().toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' })} from TESDA NEXUS.</footer>
    </div>
  )
}
