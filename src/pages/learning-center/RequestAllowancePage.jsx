import { useEffect, useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import DataTable from '../../components/DataTable/DataTable.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import { LEARNING_CENTER_SUBTITLE } from '../../constants/navItems.js'
import { toList } from '../../services/api.js'
import { allowanceService } from '../../services/allowanceService.js'
import { programService } from '../../services/programService.js'

const STUDENT_COLUMNS = [
  { key: 'studentId', label: 'Student ID' },
  { key: 'name', label: 'Student Name' },
  { key: 'account', label: 'Bank Account' },
  { key: 'holder', label: 'Holder Name' },
]

// Figma: Request Allowance 01
export default function RequestAllowancePage() {
  const [programs, setPrograms] = useState([])
  const [programId, setProgramId] = useState('')
  const [batchId, setBatchId] = useState('')
  const [students, setStudents] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    programService
      .list()
      .then((data) => setPrograms(toList(data)))
      .catch(() => {})
  }, [])

  // Batches and students have no endpoints yet; the lists stay empty until they do.
  useEffect(() => {
    if (!programId || !batchId) return
    programService
      .students(programId, batchId)
      .then(setStudents)
      .catch(() => setStudents([]))
  }, [programId, batchId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      await allowanceService.request({ program_id: programId, batch_id: batchId })
      setMessage('Request sent.')
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <>
      <PageHeader title="Request Allowance" subtitle={LEARNING_CENTER_SUBTITLE} />
      <Workspace flush>
        <form className="allowance-form" onSubmit={handleSubmit}>
          <div className="form-row even">
            <label className="field" htmlFor="program">
              <span>Program Name</span>
              <select id="program" value={programId} onChange={(e) => setProgramId(e.target.value)} required>
                <option value="">Select a program</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.course_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" htmlFor="batch">
              <span>Batch List</span>
              <select id="batch" value={batchId} onChange={(e) => setBatchId(e.target.value)} required>
                <option value="">Select a batch</option>
              </select>
            </label>
          </div>

          <h3>Student Lists</h3>
          {students.length ? (
            <div className="allowance-students card">
              <DataTable columns={STUDENT_COLUMNS} rows={students} />
            </div>
          ) : (
            <div className="ph allowance-students" role="img" aria-label="Student list appears after choosing a program and batch" />
          )}

          <div className="form-actions">
            {message && <span className="notice">{message}</span>}
            <Button type="submit" className="btn-lg">
              Request Allowance
            </Button>
          </div>
        </form>
      </Workspace>
    </>
  )
}
