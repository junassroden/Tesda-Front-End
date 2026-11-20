import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import DataTable from '../../components/DataTable/DataTable.jsx'
import EmptyState from '../../components/EmptyState/EmptyState.jsx'
import TextArea from '../../components/form/TextArea.jsx'
import TextInput from '../../components/form/TextInput.jsx'
import Icon from '../../components/Icon/Icon.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import { ROUTES } from '../../constants/routes.js'
import { toList } from '../../services/api.js'
import { allowanceService } from '../../services/allowanceService.js'
import { programService } from '../../services/programService.js'
import { peso } from '../../utils/format.js'

const STUDENT_COLUMNS = [
  { key: 'full_name', label: 'Trainee' },
  { key: 'student_number', label: 'Student ID', render: (s) => <span className="num muted">{s.student_number || '—'}</span> },
  { key: 'bank_account_number', label: 'Bank account', render: (s) => <span className="num">{s.bank_account_number || 'Not on file'}</span> },
  { key: 'bank_account_holder', label: 'Account holder', render: (s) => <span className="muted">{s.bank_account_holder || '—'}</span> },
]

// Figma: Request Allowance 01
export default function RequestAllowancePage() {
  const [programs, setPrograms] = useState([])
  const [batches, setBatches] = useState([])
  const [programId, setProgramId] = useState('')
  const [batchId, setBatchId] = useState('')
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    programService
      .list()
      .then((data) => setPrograms(toList(data)))
      .catch(() => {})
    programService
      .centerBatches()
      .then((data) => setBatches(data.batches ?? []))
      .catch(() => {})
  }, [])

  const programBatches = batches.filter((b) => String(b.course_id) === programId && b.status !== 'cancelled')

  const chooseBatch = (id) => {
    setBatchId(id)
    setStudents([])
    if (!id) return
    setLoadingStudents(true)
    programService
      .students(id)
      .then((data) => setStudents((data.students ?? []).filter((s) => s.status !== 'dropped')))
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      const res = await allowanceService.request({ batch_id: Number(batchId), amount_per_student: Number(amount), notes: notes.trim() })
      setMessage({ ok: true, text: res.message })
      setNotes('')
    } catch (err) {
      setMessage({ ok: false, text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const total = (Number(amount) || 0) * students.length

  return (
    <>
      <PageHeader title="Request allowance" subtitle="Ask the main office to release the training allowance for one batch." />
      <Workspace flush>
        <form className="allowance-form" onSubmit={handleSubmit}>
          <div className="form-row even">
            <label className="field" htmlFor="program">
              <span>Program</span>
              <select
                id="program"
                value={programId}
                onChange={(e) => {
                  setProgramId(e.target.value)
                  chooseBatch('')
                }}
                required
              >
                <option value="">Choose a program</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.course_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" htmlFor="batch">
              <span>Batch</span>
              <select id="batch" value={batchId} onChange={(e) => chooseBatch(e.target.value)} required disabled={!programId}>
                <option value="">{!programId ? 'Choose a program first' : programBatches.length ? 'Choose a batch' : 'This program has no batches yet'}</option>
                {programBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_name} · {b.enrolled} trainees
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="section-title">
            <h3>Trainees in this batch</h3>
            <span>{students.length ? `${students.length} trainees` : ''}</span>
          </div>
          <div className="allowance-students">
            {batchId ? (
              <DataTable columns={STUDENT_COLUMNS} rows={students} loading={loadingStudents} empty={{ icon: 'users', title: 'No trainees yet', text: 'Assign trainees to this batch before requesting an allowance.' }} />
            ) : (
              <EmptyState icon="users" title="No batch selected" text="Choose a program and batch to see the trainees and the bank accounts the allowance will go to." />
            )}
          </div>

          <div className="form-row even">
            <TextInput id="amount" label="Allowance per trainee (₱)" type="number" min={1} step="0.01" placeholder="e.g. 3000" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <TextArea id="notes" label="Notes (optional)" rows={1} placeholder="e.g. Training allowance for weeks 1–8" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="form-actions">
            {message ? (
              <span className={message.ok ? 'notice' : 'notice is-error'} role="status">
                {message.text} {message.ok && <Link to={ROUTES.CENTER.DASHBOARD}>Track it on your dashboard</Link>}
              </span>
            ) : (
              <span className="notice">{students.length > 0 && amount ? `Total ${peso(total)} for ${students.length} trainees` : ''}</span>
            )}
            <Button type="submit" disabled={busy || !batchId || !students.length}>
              <Icon name="coins" size={17} />
              {busy ? 'Sending…' : 'Request allowance'}
            </Button>
          </div>
        </form>
      </Workspace>
    </>
  )
}
