import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import EmptyState, { ErrorState, ListSkeleton } from '../../components/EmptyState/EmptyState.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import Meter from '../../components/training/Meter.jsx'
import { ROUTES, toPath } from '../../constants/routes.js'
import { classroomService } from '../../services/trainingService.js'
import { dateRange } from '../../utils/format.js'
import { daysLabel, sessionLabel } from '../../utils/training.js'

/** The user's virtual classrooms: one per batch they teach or are enrolled in. portal: 'teacher' | 'student'. */
export default function ClassroomsPage({ portal }) {
  const [rooms, setRooms] = useState(null)
  const [error, setError] = useState('')
  const teacher = portal === 'teacher'

  const load = () =>
    classroomService
      .list()
      .then((d) => {
        setError('')
        setRooms(d.classrooms ?? [])
      })
      .catch((err) => setError(err.message))

  useEffect(() => {
    load()
  }, [])

  const current = (rooms ?? []).filter((r) => !r.read_only)
  const past = (rooms ?? []).filter((r) => r.read_only)
  const route = teacher ? ROUTES.TEACHER.CLASSROOM : ROUTES.STUDENT.CLASSROOM

  const card = (r) => (
    <li key={r.batch.id}>
      <Link to={toPath(route, { batchId: r.batch.id })} className="room-card">
        <div className="room-card-head">
          <span className="eyebrow">{r.batch.course_code}</span>
          <StatusBadge status={r.batch.status} />
        </div>
        <strong>{r.batch.course_name}</strong>
        <span className="muted">
          {r.batch.batch_name} · {teacher ? `${r.batch.enrolled} trainees` : r.batch.instructor_name || 'No teacher yet'}
        </span>
        <small className="num">
          {dateRange(r.batch.start_date, r.batch.end_date)}
          {r.batch.days_of_week ? ` · ${daysLabel(r.batch.days_of_week)}` : ''}
          {r.batch.session_start ? `, ${sessionLabel(r.batch.session_start, r.batch.session_end)}` : ''}
        </small>
        <Meter value={r.batch.progress} />
        <span className="room-card-foot">
          {teacher
            ? r.to_grade
              ? `${r.to_grade} to grade`
              : `${r.assignments} ${r.assignments === 1 ? 'assignment' : 'assignments'}`
            : r.missing
              ? `${r.missing} missing`
              : r.to_do
                ? `${r.to_do} to do`
                : 'All caught up'}
        </span>
      </Link>
    </li>
  )

  return (
    <>
      <PageHeader
        title="Classrooms"
        subtitle={
          teacher
            ? 'The virtual classroom of every batch the learning center assigned to you. Trainees join automatically when they are enrolled.'
            : 'A classroom for each batch you are enrolled in. Your learning center adds you; there is nothing to join.'
        }
      />
      <Workspace title="Current">
        {error && !rooms ? (
          <ErrorState what="your classrooms" message={error} onRetry={load} />
        ) : rooms === null ? (
          <ListSkeleton rows={3} />
        ) : current.length ? (
          <ul className="room-grid">{current.map(card)}</ul>
        ) : (
          <EmptyState icon="inbox" title="No active classrooms" text={teacher ? 'When the learning center assigns you to a batch, its classroom appears here.' : 'When the learning center enrolls you in a batch, its classroom appears here.'} />
        )}
      </Workspace>
      {past.length > 0 && (
        <Workspace title="Completed" description="Kept for reference. Nothing new can be posted or turned in.">
          <ul className="room-grid">{past.map(card)}</ul>
        </Workspace>
      )}
    </>
  )
}
