import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import EmptyState, { ErrorState } from '../../../components/EmptyState/EmptyState.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import Modal from '../../../components/Modal/Modal.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Tabs from '../../../components/Tabs/Tabs.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import DocumentChecklist from '../../../components/training/DocumentChecklist.jsx'
import Meter from '../../../components/training/Meter.jsx'
import StudentFields from '../../../components/training/StudentFields.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { documentFiles, studentRecordService } from '../../../services/trainingService.js'
import { dateRange, fullDateTime, shortDate } from '../../../utils/format.js'
import { DOC_STATUS_LABEL, civilLabel, initials, studentToForm } from '../../../utils/training.js'

const ACTION_LABEL = { uploaded: 'Uploaded', removed: 'Removed a copy', under_review: 'Review started', verified: 'Verified', rejected: 'Rejected', reused: 'Reused' }

/** One student's record: profile, enrollment documents (review here), and every batch they were in. */
export default function StudentRecordPage() {
  const { studentId } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('documents')
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(
    () =>
      studentRecordService
        .get(studentId)
        .then((d) => {
          setError('')
          setData(d)
        })
        .catch((err) => setError(err.message)),
    [studentId],
  )

  useEffect(() => {
    load()
  }, [load])

  // Document actions return the refreshed checklist; keep the rest of the page.
  const apply = (payload) => {
    setData((d) => ({ ...d, documents: payload.documents, summary: payload.summary, history: payload.history }))
    if (payload.message) setNotice(payload.message)
    return payload
  }

  if (error && !data) {
    return (
      <>
        <PageHeader title="Student record" />
        <Workspace back={ROUTES.CENTER.STUDENT_RECORDS} backLabel="Student records">
          <ErrorState what="this student record" message={error} onRetry={load} />
        </Workspace>
      </>
    )
  }

  const s = data?.student
  const summary = data?.summary
  const pct = summary?.required ? Math.round((summary.verified / summary.required) * 100) : 0

  return (
    <>
      <PageHeader
        title={s?.full_name ?? 'Student record'}
        subtitle={s ? `${s.student_number || 'No student ID'} · ${s.email}` : 'Loading…'}
        actions={
          s && (
            <div className="print-links">
              <Button variant="secondary" to={toPath(ROUTES.PRINT.STUDENT, { studentId: s.id, kind: 'info' })} target="_blank">
                Information sheet
              </Button>
              <Button variant="secondary" to={toPath(ROUTES.PRINT.STUDENT, { studentId: s.id, kind: 'checklist' })} target="_blank">
                Checklist
              </Button>
              <Button to={toPath(ROUTES.PRINT.STUDENT, { studentId: s.id, kind: 'packet' })} target="_blank">
                <Icon name="download" size={16} />
                Enrollment packet
              </Button>
            </div>
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

      {s && (
        <section className="card profile-card">
          <span className="avatar avatar-lg">{initials(s.full_name)}</span>
          <dl className="fact-row">
            <div>
              <dt>Birthdate</dt>
              <dd>{s.birthdate ? shortDate(s.birthdate) : 'Not set'}</dd>
            </div>
            <div>
              <dt>Sex · civil status</dt>
              <dd>
                {s.sex ? s.sex.charAt(0).toUpperCase() + s.sex.slice(1) : 'Not set'} · {civilLabel(s.civil_status)}
              </dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>{s.contact_number || 'Not set'}</dd>
              <small>{s.address || ''}</small>
            </div>
            <div>
              <dt>Guardian / emergency</dt>
              <dd>{s.guardian_name || 'Not set'}</dd>
              <small>{s.guardian_contact || ''}</small>
            </div>
            <div>
              <dt>Documents</dt>
              <dd className="num">
                {summary.verified} of {summary.required} verified
              </dd>
              <Meter value={pct} tone={summary.complete ? 'success' : 'brand'} />
            </div>
          </dl>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Icon name="edit" size={16} />
            Edit profile
          </Button>
        </section>
      )}

      <Workspace back={ROUTES.CENTER.STUDENT_RECORDS} backLabel="Student records" title="Records" flush>
        <Tabs
          tabs={[
            { value: 'documents', label: 'Enrollment documents', count: summary ? `${summary.verified}/${summary.required}` : undefined },
            { value: 'enrollments', label: 'Batches', count: data?.enrollments?.length },
            { value: 'history', label: 'Verification history', count: data?.history?.length },
          ]}
          value={tab}
          onChange={setTab}
        />
        {!data ? (
          <div className="workspace-pad muted">Loading…</div>
        ) : tab === 'documents' ? (
          <div className="workspace-pad">
            <p className="field-hint doc-intro">
              Documents belong to the student at this center and are reused for every course they take here. Only your center can see them.
            </p>
            <DocumentChecklist
              documents={data.documents}
              mode="admin"
              onUpload={(typeId, files) => studentRecordService.uploadFor(s.id, typeId, files).then(apply)}
              onRemoveFile={(fileId) => documentFiles.remove(fileId).then(apply)}
              onReview={(docId, action, remarks) => studentRecordService.review(docId, action, remarks).then(apply)}
            />
          </div>
        ) : tab === 'enrollments' ? (
          <DataTable
            rowKey="batch_id"
            columns={[
              {
                key: 'batch_name',
                label: 'Batch',
                className: 'cell-wrap',
                render: (e) => (
                  <span className="cell-stack">
                    <Link to={toPath(ROUTES.CENTER.BATCH, { programId: e.course_id, batchId: e.batch_id })}>
                      <strong>{e.batch_name}</strong>
                    </Link>
                    <small>
                      {e.course_name} · {e.course_code}
                    </small>
                  </span>
                ),
              },
              { key: 'instructor_name', label: 'Teacher', render: (e) => <span className="muted">{e.instructor_name || '—'}</span> },
              { key: 'dates', label: 'Training period', render: (e) => <span className="muted num">{dateRange(e.start_date, e.end_date)}</span> },
              {
                key: 'membership_status',
                label: 'In batch',
                className: 'cell-wrap',
                render: (e) => (
                  <span className="cell-stack">
                    <StatusBadge status={e.membership_status === 'dropped' ? 'removed' : e.membership_status} />
                    {e.end_reason && <small>{e.end_reason}</small>}
                  </span>
                ),
              },
              { key: 'batch_status', label: 'Batch', render: (e) => <StatusBadge status={e.batch_status} /> },
            ]}
            rows={data.enrollments}
            empty={{ icon: 'calendar', title: 'Not enrolled yet', text: 'Enroll this student from a batch page under Courses.' }}
          />
        ) : data.history.length ? (
          <ol className="timeline">
            {data.history.map((h) => (
              <li key={h.id}>
                <span className={`timeline-dot action-${h.action}`} aria-hidden="true" />
                <div>
                  <p>
                    <strong>{h.type_name}</strong> · {ACTION_LABEL[h.action] ?? h.action}
                    {h.from_status && h.from_status !== h.to_status ? ` (${DOC_STATUS_LABEL[h.from_status] ?? h.from_status} → ${DOC_STATUS_LABEL[h.to_status] ?? h.to_status})` : ''}
                  </p>
                  {h.remarks && <p className="muted">{h.remarks}</p>}
                  <small>
                    {fullDateTime(h.acted_at)} · {h.acted_by_name || 'Unknown'}
                    {h.acted_by_role === 'student' ? ' (student)' : ''}
                  </small>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState icon="clock" title="No document activity yet" text="Uploads, reviews, verifications and reuse are recorded here." />
        )}
      </Workspace>

      {editing && s && (
        <EditStudentModal
          student={s}
          onClose={() => setEditing(false)}
          onSaved={(msg) => {
            setEditing(false)
            setNotice(msg)
            load()
          }}
        />
      )}
    </>
  )
}

function EditStudentModal({ student, onClose, onSaved }) {
  const [form, setForm] = useState(() => studentToForm(student))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const data = await studentRecordService.update(student.id, form)
      onSaved(data.message)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }
  return (
    <Modal
      open
      title={`Edit ${student.full_name}`}
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="edit-student-form" disabled={busy}>
            {busy ? 'Saving…' : 'Save profile'}
          </Button>
        </>
      }
    >
      <form id="edit-student-form" className="form-fields" onSubmit={save}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <StudentFields form={form} set={(k, v) => setForm((f) => ({ ...f, [k]: v }))} />
      </form>
    </Modal>
  )
}
