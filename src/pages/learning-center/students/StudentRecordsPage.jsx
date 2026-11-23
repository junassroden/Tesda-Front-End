import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import { ErrorState } from '../../../components/EmptyState/EmptyState.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import Modal from '../../../components/Modal/Modal.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../../components/Pagination/Pagination.jsx'
import Tabs from '../../../components/Tabs/Tabs.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import StudentFields from '../../../components/training/StudentFields.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { usePagination } from '../../../hooks/usePagination.js'
import { studentRecordService } from '../../../services/trainingService.js'
import { exportReport } from '../../../utils/exportReport.js'
import { EMPTY_STUDENT, initials } from '../../../utils/training.js'

const docState = (d) => (d.required && d.verified === d.required ? 'complete' : d.rejected ? 'rejected' : d.pending ? 'pending' : 'incomplete')
const DOC_LABEL = { complete: 'Complete', rejected: 'Needs new copy', pending: 'To review', incomplete: 'Incomplete' }

const COLUMNS = [
  {
    key: 'full_name',
    label: 'Student',
    render: (s) => (
      <span className="doc-name">
        <span className="avatar">{initials(s.full_name)}</span>
        <span className="cell-stack">
          <strong>{s.full_name}</strong>
          <small className="num">{s.student_number || 'No student ID yet'}</small>
        </span>
      </span>
    ),
  },
  { key: 'email', label: 'Contact', className: 'cell-wrap', render: (s) => <span className="cell-stack"><span>{s.email}</span><small>{s.contact_number || ''}</small></span> },
  {
    key: 'active_batches',
    label: 'Current batch',
    className: 'cell-wrap',
    render: (s) => <span className="muted">{s.active_batches.length ? s.active_batches.join(', ') : s.batch_count ? `${s.batch_count} past ${s.batch_count === 1 ? 'batch' : 'batches'}` : 'Not enrolled'}</span>,
  },
  {
    key: 'documents',
    label: 'Documents',
    render: (s) => {
      const state = docState(s.documents)
      return (
        <span className="cell-stack">
          <span className={`doc-state is-${state}`}>{DOC_LABEL[state]}</span>
          <small className="num">
            {s.documents.verified} of {s.documents.required} verified
          </small>
        </span>
      )
    },
  },
]

export default function StudentRecordsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [students, setStudents] = useState(null)
  const [pending, setPending] = useState(0)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('all')
  const creating = params.get('new') === '1'

  useEffect(() => {
    const id = setTimeout(() => {
      studentRecordService
        .search(q.trim())
        .then((d) => {
          setError('')
          setStudents(d.students ?? [])
          setPending(d.pending_documents ?? 0)
        })
        .catch((err) => setError(err.message))
    }, 250)
    return () => clearTimeout(id)
  }, [q])

  const all = students ?? []
  const toReview = all.filter((s) => s.documents.pending > 0)
  const incomplete = all.filter((s) => docState(s.documents) !== 'complete')
  const list = tab === 'review' ? toReview : tab === 'incomplete' ? incomplete : all
  const { rows, page, pageCount, setPage } = usePagination(list, 15)

  return (
    <>
      <PageHeader
        title="Student records"
        subtitle="Every student of your center with their enrollment documents. Documents are kept once per student and reused for every course they take here."
        search={q}
        onSearch={(v) => {
          setQ(v)
          setPage(1)
        }}
        searchPlaceholder="Search name, email or student ID"
        onExport={(format) =>
          exportReport(format, {
            title: 'Student records',
            columns: [
              { key: 'student_number', label: 'Student ID' },
              { key: 'full_name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'contact_number', label: 'Contact' },
              { key: 'batches', label: 'Current batch' },
              { key: 'docs', label: 'Documents verified' },
            ],
            rows: list.map((s) => ({ ...s, batches: s.active_batches.join(', '), docs: `${s.documents.verified}/${s.documents.required}` })),
          })
        }
      />
      <Workspace
        title="Students"
        actions={
          <Button onClick={() => setParams({ new: '1' })}>
            <Icon name="plus" size={17} />
            New student
          </Button>
        }
        flush
      >
        <Tabs
          tabs={[
            { value: 'all', label: 'All students', count: all.length },
            { value: 'review', label: 'Documents to review', count: toReview.length },
            { value: 'incomplete', label: 'Incomplete documents', count: incomplete.length },
          ]}
          value={tab}
          onChange={(v) => {
            setTab(v)
            setPage(1)
          }}
        />
        {pending > 0 && tab === 'all' && (
          <p className="inline-alert neutral">
            <Icon name="documents" size={16} />
            {pending} {pending === 1 ? 'document is' : 'documents are'} waiting for review.{' '}
            <button type="button" className="link-btn" onClick={() => setTab('review')}>
              Show students
            </button>
          </p>
        )}
        {error && !students ? (
          <ErrorState what="student records" message={error} />
        ) : (
          <>
            <DataTable
              columns={COLUMNS}
              rows={rows}
              loading={students === null}
              empty={q ? { icon: 'search', title: 'No matches', text: `No student matches “${q}”.` } : { icon: 'users', title: tab === 'all' ? 'No students yet' : 'Nothing here', text: tab === 'all' ? 'Add a student record to enroll them in a batch.' : 'No student is in this list right now.' }}
              rowHref={(s) => toPath(ROUTES.CENTER.STUDENT_RECORD, { studentId: s.id })}
              showArrow
            />
            <Pagination page={page} pageCount={pageCount} onChange={setPage} />
          </>
        )}
      </Workspace>

      {creating && <NewStudentModal onClose={() => setParams({})} onCreated={(s) => navigate(toPath(ROUTES.CENTER.STUDENT_RECORD, { studentId: s.id }))} />}
    </>
  )
}

/** Creates a student record. The server refuses a second record for the same person. */
function NewStudentModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ ...EMPTY_STUDENT, password: '' })
  const [duplicates, setDuplicates] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async (event, confirmNew = false) => {
    event?.preventDefault()
    setBusy(true)
    setError('')
    try {
      const data = await studentRecordService.create({ ...form, confirm_new: confirmNew ? 1 : 0 })
      onCreated(data.student)
    } catch (err) {
      setError(err.message)
      setDuplicates(err.data?.duplicates ?? [])
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      title="New student record"
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          {duplicates.length > 0 ? (
            <Button variant="danger" onClick={() => save(null, true)} disabled={busy}>
              It&apos;s a different person
            </Button>
          ) : (
            <Button type="submit" form="student-form" disabled={busy}>
              {busy ? 'Saving…' : 'Create record'}
            </Button>
          )}
        </>
      }
    >
      <form id="student-form" className="form-fields" onSubmit={save}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {duplicates.length > 0 && (
          <ul className="pick-list">
            {duplicates.map((d) => (
              <li key={d.id}>
                <Link to={toPath(ROUTES.CENTER.STUDENT_RECORD, { studentId: d.id })} className="pick-link">
                  <span className="avatar">{initials(d.full_name)}</span>
                  <span className="cell-stack">
                    <strong>{d.full_name}</strong>
                    <small className="num">
                      {d.student_number} · {d.email}
                    </small>
                  </span>
                  <span className="link-btn">Use this record</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <StudentFields form={form} set={(k, v) => setForm((f) => ({ ...f, [k]: v }))} withPassword />
      </form>
    </Modal>
  )
}
