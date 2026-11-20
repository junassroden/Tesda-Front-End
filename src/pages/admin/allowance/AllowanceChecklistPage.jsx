import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import EmptyState from '../../../components/EmptyState/EmptyState.jsx'
import TextArea from '../../../components/form/TextArea.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES } from '../../../constants/routes.js'
import { allowanceService } from '../../../services/allowanceService.js'
import { exportReport } from '../../../utils/exportReport.js'
import { peso, shortDate } from '../../../utils/format.js'

const EXPORT_COLUMNS = [
  { key: 'student_number', label: 'Student ID' },
  { key: 'full_name', label: 'Student name' },
  { key: 'bank_account_number', label: 'Bank account' },
  { key: 'bank_account_holder', label: 'Account holder' },
  { key: 'amount', label: 'Amount (PHP)' },
]

// Figma: Allowance Tracking 9
export default function AllowanceChecklistPage() {
  const { id } = useParams()
  const [data, setData] = useState(null) // { request, students } | false
  const [remarks, setRemarks] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const load = useCallback(
    () =>
      allowanceService
        .get(id)
        .then(setData)
        .catch(() => setData(false)),
    [id],
  )

  useEffect(() => {
    load()
  }, [load])

  const r = data?.request
  const students = data?.students ?? []
  const done = students.filter((s) => Number(s.is_checked)).length
  const editable = r && !['released', 'rejected'].includes(r.status)

  const toggle = async (s, checked) => {
    setData((d) => ({ ...d, students: d.students.map((x) => (x.student_id === s.student_id ? { ...x, is_checked: checked ? 1 : 0 } : x)) }))
    try {
      const res = await allowanceService.checkStudent(id, s.student_id, checked)
      setData((d) => ({ ...d, students: res.students }))
    } catch (err) {
      setMessage({ ok: false, text: err.message })
      load()
    }
  }

  const setStatus = async (status, success) => {
    setBusy(true)
    setMessage(null)
    try {
      await allowanceService.setStatus(id, status, remarks)
      setMessage({ ok: true, text: success })
      setRemarks('')
      await load()
    } catch (err) {
      setMessage({ ok: false, text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    {
      key: 'check',
      label: 'Verified',
      render: (s) => (
        <input type="checkbox" className="row-check" checked={!!Number(s.is_checked)} disabled={!editable} onChange={(e) => toggle(s, e.target.checked)} aria-label={`Mark ${s.full_name} as verified`} />
      ),
    },
    { key: 'full_name', label: 'Student name' },
    { key: 'student_number', label: 'Student ID', render: (s) => <span className="num muted">{s.student_number || '—'}</span> },
    { key: 'bank_account_number', label: 'Bank account', render: (s) => <span className="num">{s.bank_account_number || 'Not on file'}</span> },
    { key: 'bank_account_holder', label: 'Account holder', render: (s) => <span className="muted">{s.bank_account_holder || '—'}</span> },
    { key: 'amount', label: 'Amount', align: 'end', render: (s) => <span className="num">{peso(s.amount)}</span> },
  ]

  return (
    <>
      <PageHeader
        title="Allowance tracking"
        subtitle="Check each trainee’s bank details before the allowance is released."
        onExport={r ? (format) => exportReport(format, { title: `${r.request_code} ${r.batch_name}`, columns: EXPORT_COLUMNS, rows: students }) : undefined}
      />
      <Workspace
        back={ROUTES.ADMIN.ALLOWANCE}
        backLabel="All requests"
        title={r ? `${r.request_code} · ${r.batch_name}` : data === false ? 'Request not found' : 'Loading…'}
        description={r ? `${r.center_name} · ${peso(r.amount_per_student)} per trainee · requested by ${r.requested_by_name || 'a center admin'} on ${shortDate(r.created_at)}` : null}
        actions={r && <StatusBadge status={r.status} />}
        flush
      >
        {data === false && <EmptyState icon="coins" title="Request not found" text="It may have been removed, or the link is incomplete." />}
        {r && (
          <>
            <DataTable columns={columns} rows={students} empty={{ icon: 'users', title: 'No trainees', text: 'This request has no trainees attached.' }} />

            <div className="allowance-form">
              {r.notes && (
                <p className="lede-text">
                  <strong>Center note:</strong> {r.notes}
                </p>
              )}
              {r.admin_remarks && (
                <p className="lede-text">
                  <strong>Main office note:</strong> {r.admin_remarks}
                </p>
              )}

              {editable && (
                <>
                  {r.status !== 'approved' && (
                    <TextArea id="remarks" label="Note to the learning center" rows={2} placeholder="Required when rejecting" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                  )}
                  <div className="form-actions">
                    <span className="notice">
                      {done} of {students.length} verified · total {peso(students.reduce((s, x) => s + Number(x.amount), 0))}
                    </span>
                    {r.status !== 'approved' && (
                      <>
                        <Button variant="danger" disabled={busy} onClick={() => setStatus('rejected', 'Request rejected.')}>
                          Reject
                        </Button>
                        <Button disabled={busy || done !== students.length} title={done !== students.length ? 'Verify every trainee first' : undefined} onClick={() => setStatus('approved', 'Request approved.')}>
                          <Icon name="check" size={17} />
                          Approve
                        </Button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <Button disabled={busy} onClick={() => setStatus('released', 'Allowance released and recorded.')}>
                        <Icon name="coins" size={17} />
                        Release allowance
                      </Button>
                    )}
                  </div>
                </>
              )}
              {r.status === 'released' && <p className="notice">Released on {shortDate(r.released_at)} and recorded on the ledger.</p>}
              {message && (
                <p className={message.ok ? 'notice' : 'notice is-error'} role="status">
                  {message.text}
                </p>
              )}
            </div>
          </>
        )}
      </Workspace>
    </>
  )
}
