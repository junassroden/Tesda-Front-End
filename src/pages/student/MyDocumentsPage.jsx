import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState, { ErrorState, ListSkeleton } from '../../components/EmptyState/EmptyState.jsx'
import Icon from '../../components/Icon/Icon.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import DocumentChecklist from '../../components/training/DocumentChecklist.jsx'
import Meter from '../../components/training/Meter.jsx'
import { ROUTES } from '../../constants/routes.js'
import { documentFiles, studentService } from '../../services/trainingService.js'
import { fullDateTime } from '../../utils/format.js'
import { civilLabel } from '../../utils/training.js'

const ACTION = { uploaded: 'Uploaded', removed: 'Removed a copy', under_review: 'Review started', verified: 'Verified', rejected: 'Returned for a new copy', reused: 'Reused for enrollment' }

/** My Documents: the student's enrollment requirements, uploaded once and reused for every course at the center. */
export default function MyDocumentsPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(
    () =>
      studentService
        .documents()
        .then((d) => {
          setError('')
          setData(d)
        })
        .catch((err) => setError(err.message)),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  const apply = (payload) => {
    setData(payload)
    if (payload.message) setNotice(payload.message)
    return payload
  }

  const s = data?.summary
  const pct = s?.required ? Math.round((s.verified / s.required) * 100) : 0

  return (
    <>
      <PageHeader title="My documents" subtitle="Your enrollment requirements. Submit them once: your learning center reuses verified documents for every course you take there." />
      {notice && (
        <p className="notice-bar" role="status">
          <Icon name="check" size={16} />
          {notice}
          <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => setNotice('')}>
            <Icon name="x" size={14} />
          </button>
        </p>
      )}
      {s && (
        <section className="card doc-summary">
          <Meter label="Verified" value={pct} tone={s.complete ? 'success' : 'brand'} detail={`${s.verified} of ${s.required} required documents`} />
          <dl className="fact-row">
            <div>
              <dt>Waiting for review</dt>
              <dd className="num">{s.submitted}</dd>
            </div>
            <div>
              <dt>Need a new copy</dt>
              <dd className={s.rejected ? 'num text-danger' : 'num'}>{s.rejected}</dd>
            </div>
            <div>
              <dt>Not submitted</dt>
              <dd className="num">{s.missing}</dd>
            </div>
            <div>
              <dt>Civil status</dt>
              <dd>{civilLabel(data.student.civil_status)}</dd>
              <Link to={ROUTES.STUDENT.PROFILE} className="link-btn">
                Change in profile
              </Link>
            </div>
          </dl>
        </section>
      )}
      <Workspace title="Requirements" description="Each copy is a separate file: scan or photograph every copy. PDF, JPG, PNG or WebP up to 10 MB." flush>
        {error && !data ? (
          <ErrorState what="your documents" message={error} onRetry={load} />
        ) : !data ? (
          <ListSkeleton rows={4} />
        ) : (
          <div className="workspace-pad">
            <DocumentChecklist
              documents={data.documents}
              mode="student"
              onUpload={(typeId, files) => studentService.upload(typeId, files).then(apply)}
              onRemoveFile={(fileId) => documentFiles.remove(fileId).then(apply)}
            />
          </div>
        )}
      </Workspace>
      {data && (
        <Workspace title="History" flush>
          {data.history.length ? (
            <ol className="timeline">
              {data.history.map((h) => (
                <li key={h.id}>
                  <span className={`timeline-dot action-${h.action}`} aria-hidden="true" />
                  <div>
                    <p>
                      <strong>{h.type_name}</strong> · {ACTION[h.action] ?? h.action}
                    </p>
                    {h.remarks && <p className="muted">{h.remarks}</p>}
                    <small>
                      {fullDateTime(h.acted_at)} · {h.acted_by_role === 'student' ? 'You' : h.acted_by_name || 'Learning center'}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState icon="clock" title="Nothing yet" text="Uploads and reviews of your documents are listed here." />
          )}
        </Workspace>
      )}
    </>
  )
}
