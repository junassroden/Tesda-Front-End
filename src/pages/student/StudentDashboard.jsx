import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import EmptyState, { ErrorState, ListSkeleton } from '../../components/EmptyState/EmptyState.jsx'
import Icon from '../../components/Icon/Icon.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import Meter from '../../components/training/Meter.jsx'
import { ROUTES, toPath } from '../../constants/routes.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentService } from '../../services/trainingService.js'
import { shortDate } from '../../utils/format.js'
import { batchBadge, daysLabel, durationLabel, hoursLabel, modeLabel, sessionLabel, trainingState } from '../../utils/training.js'

/** The student's home: each batch's training details, progress and attendance, plus document status. */
export default function StudentDashboard() {
  const { user } = useAuth()
  const [training, setTraining] = useState(null)
  const [docs, setDocs] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    studentService
      .training()
      .then((d) => {
        setError('')
        setTraining(d.training ?? [])
      })
      .catch((err) => setError(err.message))
    studentService
      .documents()
      .then((d) => setDocs(d.summary))
      .catch(() => setDocs(null))
  }

  useEffect(() => {
    load()
  }, [])

  const current = (training ?? []).filter((t) => t.membership_status === 'active')
  const past = (training ?? []).filter((t) => t.membership_status !== 'active')
  const firstName = (user?.full_name || '').split(' ')[0]

  return (
    <>
      <PageHeader title={firstName ? `Hello, ${firstName}` : 'My training'} subtitle="Your course, batch schedule and training progress." />

      {docs && !docs.complete && (
        <div className="review-banner is-info">
          <Icon name="documents" size={18} />
          <div>
            <strong>
              {docs.verified} of {docs.required} enrollment documents verified
            </strong>
            <p>
              {docs.rejected ? `${docs.rejected} need a new copy. ` : ''}
              {docs.missing ? `${docs.missing} not submitted yet. ` : ''}
              {docs.submitted ? `${docs.submitted} waiting for review.` : ''}
            </p>
          </div>
          <div className="review-actions">
            <Button to={ROUTES.STUDENT.DOCUMENTS}>Open my documents</Button>
          </div>
        </div>
      )}

      {error && !training ? (
        <Workspace>
          <ErrorState what="your training" message={error} onRetry={load} />
        </Workspace>
      ) : training === null ? (
        <Workspace>
          <ListSkeleton rows={3} />
        </Workspace>
      ) : current.length === 0 ? (
        <Workspace>
          <EmptyState icon="programs" title="Not enrolled in a batch" text="Your learning center enrolls you in a batch. Once they do, your schedule and classroom appear here." />
        </Workspace>
      ) : (
        current.map((t) => <TrainingCard key={t.batch.id} t={t} />)
      )}

      {past.length > 0 && (
        <Workspace title="Past training" flush>
          <ul className="list-rows pad-list">
            {past.map((t) => (
              <li key={t.batch.id} className="list-row">
                <span className="cell-stack">
                  <strong>{t.batch.course_name}</strong>
                  <small>
                    {t.batch.batch_name} · {shortDate(t.batch.start_date)} – {shortDate(t.batch.end_date)}
                    {t.end_reason && t.membership_status !== 'completed' ? ` · ${t.end_reason}` : ''}
                  </small>
                </span>
                <span className="row-actions">
                  <StatusBadge status={t.membership_status === 'dropped' ? 'removed' : t.membership_status} />
                  {t.membership_status === 'completed' && (
                    <Link to={toPath(ROUTES.STUDENT.CLASSROOM, { batchId: t.batch.id })} className="link-btn">
                      Classroom
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Workspace>
      )}
    </>
  )
}

function TrainingCard({ t }) {
  const b = t.batch
  const a = t.attendance
  return (
    <section className="workspace training-card">
      <div className="workspace-head">
        <div className="workspace-title">
          <span className="eyebrow">
            {b.course_code} · {b.qualification}
          </span>
          <h2>{b.course_name}</h2>
          <div className="workspace-desc">
            {b.batch_name} · {b.training_center_name}
          </div>
        </div>
        <div className="workspace-actions">
          <StatusBadge status={batchBadge(b) === 'needs_review' ? 'ongoing' : b.status} />
          <Button to={toPath(ROUTES.STUDENT.CLASSROOM, { batchId: b.id })} trailingIcon="arrowRight">
            Open classroom
          </Button>
        </div>
      </div>
      <div className="workspace-body">
        {b.status === 'suspended' && (
          <p className="inline-alert standalone">
            <Icon name="clock" size={16} />
            Training is suspended{b.status_reason ? `: ${b.status_reason}` : '.'} Your learning center will announce when it resumes.
          </p>
        )}
        <div className="training-grid">
          <dl className="fact-row">
            <div>
              <dt>Start date</dt>
              <dd className="num">{b.start_date ? shortDate(b.start_date) : 'Not set'}</dd>
            </div>
            <div>
              <dt>Expected completion</dt>
              <dd className="num">{b.end_date ? shortDate(b.end_date) : 'Not set'}</dd>
              {b.planned_end_date && b.end_date && b.planned_end_date !== b.end_date && <small>Extended from {shortDate(b.planned_end_date)}</small>}
            </div>
            <div>
              <dt>Training duration</dt>
              <dd>{t.course?.duration_value ? durationLabel(t.course) : b.training_days ? `${b.training_days} training days` : 'Not set'}</dd>
            </div>
            <div>
              <dt>Total training hours</dt>
              <dd className="num">{b.required_hours ? `${b.required_hours} hours` : 'Not set'}</dd>
            </div>
            <div>
              <dt>Training days</dt>
              <dd>{daysLabel(b.days_of_week)}</dd>
            </div>
            <div>
              <dt>Session schedule</dt>
              <dd>{sessionLabel(b.session_start, b.session_end)}</dd>
              {b.venue && <small>{b.venue}</small>}
            </div>
            <div>
              <dt>Training mode</dt>
              <dd>{modeLabel(b.training_mode)}</dd>
            </div>
            <div>
              <dt>Current status</dt>
              <dd>{b.needs_review ? 'Ongoing (awaiting completion)' : trainingState(b)}</dd>
            </div>
          </dl>
          <div className="training-progress">
            <Meter
              label="Batch training progress"
              value={b.progress}
              detail={b.required_hours ? `${hoursLabel(b.held_hours)} of ${b.required_hours} hours held` : 'Progress shows once required hours are set'}
            />
            <Meter
              label="Your attendance"
              value={a.rate}
              tone={a.rate !== null && a.rate < 80 ? 'warning' : 'success'}
              detail={a.sessions_held ? `${a.attended} of ${a.sessions_held} sessions · ${hoursLabel(a.hours_attended)} attended` : 'No sessions recorded yet'}
            />
            <p className="field-hint">Training completes when the required hours are held and your learning center confirms it, not only when the end date passes.</p>
          </div>
        </div>
        {a.recent.length > 0 && (
          <details className="recent-sessions">
            <summary>Recent sessions</summary>
            <ul className="list-rows">
              {a.recent.map((s) => (
                <li key={s.session_date} className="list-row">
                  <span className="cell-stack">
                    <strong className="num">{shortDate(s.session_date)}</strong>
                    <small>
                      {s.topic || 'No topic recorded'} · {hoursLabel(s.hours)}
                    </small>
                  </span>
                  <StatusBadge status={s.status === 'not_recorded' ? 'absent' : s.status} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </section>
  )
}
