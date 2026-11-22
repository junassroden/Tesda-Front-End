import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import EmptyState, { ErrorState } from '../../../components/EmptyState/EmptyState.jsx'
import TextArea from '../../../components/form/TextArea.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES } from '../../../constants/routes.js'
import { allowanceService } from '../../../services/allowanceService.js'
import { exportReport } from '../../../utils/exportReport.js'
import { fullDateTime, peso, shortDate } from '../../../utils/format.js'

const EXPORT_COLUMNS = [
  { key: 'student_number', label: 'Student ID' },
  { key: 'full_name', label: 'Student name' },
  { key: 'bank_account_number', label: 'Bank account' },
  { key: 'bank_account_holder', label: 'Account holder' },
  { key: 'amount', label: 'Amount (PHP)' },
]

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

// "Paolo R. Bautista" matches "Paolo Bautista": every word of the trainee's name must appear in the holder's name.
const words = (name = '') => name.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter((w) => w.length > 1)
const holderMatches = (student, holder) => {
  const holderWords = new Set(words(holder))
  return words(student).every((w) => holderWords.has(w))
}

/** Requested → Reviewed → Released, with who and when. */
function Timeline({ r }) {
  const rejected = r.status === 'rejected'
  const reviewed = ['approved', 'released', 'rejected'].includes(r.status)
  const inReview = ['budget_check', 'for_approval'].includes(r.status)
  const steps = [
    { label: 'Requested', state: 'done', detail: `${r.requested_by_name || 'Center admin'} · ${shortDate(r.created_at)}`, when: r.created_at },
    {
      label: rejected ? 'Rejected' : inReview ? (r.status === 'budget_check' ? 'Budget check' : 'For approval') : 'Approved',
      state: rejected ? 'failed' : reviewed ? 'done' : inReview ? 'current' : 'todo',
      detail: reviewed ? `${r.reviewed_by_name || 'Main office'} · ${shortDate(r.reviewed_at)}` : inReview ? 'In progress' : 'Waiting for review',
      when: r.reviewed_at,
    },
  ]
  if (!rejected) {
    steps.push({
      label: 'Released',
      state: r.status === 'released' ? 'done' : r.status === 'approved' ? 'current' : 'todo',
      detail: r.status === 'released' ? `${shortDate(r.released_at)} · on the ledger` : r.status === 'approved' ? 'Ready to release' : 'After approval',
      when: r.released_at,
    })
  }

  return (
    <ol className="alw-timeline">
      {steps.map((s) => (
        <li key={s.label} className={`is-${s.state}`}>
          <span className="alw-dot" aria-hidden="true">
            {s.state === 'done' && <Icon name="check" size={12} />}
            {s.state === 'failed' && <Icon name="x" size={12} />}
          </span>
          <div>
            <strong>{s.label}</strong>
            <small title={s.when ? fullDateTime(s.when) : undefined}>{s.detail}</small>
          </div>
        </li>
      ))}
    </ol>
  )
}

// Figma: Allowance Tracking 9
export default function AllowanceChecklistPage() {
  const { id } = useParams()
  const [data, setData] = useState(null) // { request, students } | false (not found) | undefined (failed)
  const [loadError, setLoadError] = useState('')
  const [remarks, setRemarks] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const load = useCallback(
    () =>
      allowanceService
        .get(id)
        .then((d) => {
          setLoadError('')
          setData(d)
        })
        .catch((err) => {
          if (err?.status === 404) return setData(false)
          setLoadError(err?.message || 'Something went wrong.')
          setData((prev) => prev || undefined)
        }),
    [id],
  )

  useEffect(() => {
    load()
  }, [load])

  const r = data?.request
  const students = data?.students ?? []
  const done = students.filter((s) => Number(s.is_checked)).length
  const total = students.reduce((sum, x) => sum + Number(x.amount), 0)
  const allVerified = students.length > 0 && done === students.length
  const editable = r && !['released', 'rejected'].includes(r.status)
  const progress = students.length ? Math.round((done / students.length) * 100) : 0

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

  const verifyAll = async () => {
    setBusy(true)
    setMessage(null)
    try {
      for (const s of students.filter((x) => !Number(x.is_checked))) {
        await allowanceService.checkStudent(id, s.student_id, true)
      }
    } catch (err) {
      setMessage({ ok: false, text: err.message })
    } finally {
      await load()
      setBusy(false)
    }
  }

  const setStatus = async (status, success) => {
    if (status === 'rejected' && !remarks.trim()) {
      setMessage({ ok: false, text: 'Add a note telling the learning center why the request is rejected.' })
      return
    }
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
      className: 'alw-check-cell',
      render: (s) =>
        editable ? (
          <input type="checkbox" className="row-check" checked={!!Number(s.is_checked)} onChange={(e) => toggle(s, e.target.checked)} aria-label={`Mark ${s.full_name} as verified`} />
        ) : Number(s.is_checked) ? (
          <span className="alw-verified" title="Verified">
            <Icon name="check" size={13} label="Verified" />
          </span>
        ) : (
          <span className="alw-unverified" title="Not verified" />
        ),
    },
    {
      key: 'full_name',
      label: 'Trainee',
      render: (s) => (
        <span className="alw-person">
          <span className="alw-avatar" aria-hidden="true">
            {initials(s.full_name)}
          </span>
          <span className="cell-stack">
            <strong>{s.full_name}</strong>
            <small className="num">{s.student_number || 'No student ID'}</small>
          </span>
        </span>
      ),
    },
    {
      key: 'bank_account_number',
      label: 'Bank account',
      render: (s) => {
        if (!s.bank_account_number) return <span className="alw-flag is-danger">No bank account on file</span>
        const match = holderMatches(s.full_name, s.bank_account_holder)
        return (
          <span className="cell-stack">
            <span className="num alw-account">{s.bank_account_number}</span>
            <small>
              {s.bank_account_holder || 'Holder not given'}
              {s.bank_account_holder && !match && (
                <span className="alw-flag is-warning" title="The account holder's name is different from the trainee's name. Check before verifying.">
                  Name differs
                </span>
              )}
            </small>
          </span>
        )
      },
    },
    { key: 'amount', label: 'Amount', align: 'end', render: (s) => <span className="num alw-amount">{peso(s.amount)}</span> },
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
        title={r ? r.request_code : data === false ? 'Request not found' : data === undefined ? 'Couldn’t load request' : 'Loading…'}
        description={r ? `${r.batch_name} · ${r.center_name}` : null}
        actions={r && <StatusBadge status={r.status} />}
        flush
      >
        {data === undefined && loadError && (
          <ErrorState
            what="this allowance request"
            message={loadError}
            onRetry={() => {
              setData(null)
              load()
            }}
          />
        )}
        {data === false && <EmptyState icon="coins" title="Request not found" text="It may have been removed, or the link is incomplete." />}
        {r && (
          <>
            <dl className="alw-stats">
              <div>
                <dt>Trainees</dt>
                <dd className="num">{students.length}</dd>
              </div>
              <div>
                <dt>Per trainee</dt>
                <dd className="num">{peso(r.amount_per_student)}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd className="num">{peso(total)}</dd>
              </div>
              <div>
                <dt>Verified</dt>
                <dd>
                  <span className="num">
                    {done}/{students.length}
                  </span>
                  <span className={`alw-meter${allVerified ? ' is-full' : ''}`} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Trainees verified">
                    <span style={{ width: `${progress}%` }} />
                  </span>
                </dd>
              </div>
            </dl>

            <div className="alw-layout">
              <section className="alw-card" aria-labelledby="alw-trainees">
                <header className="alw-card-head">
                  <div>
                    <h3 id="alw-trainees">Trainees</h3>
                    <p>{editable ? 'Tick each trainee after checking their bank details.' : 'Bank details checked for this request.'}</p>
                  </div>
                  {editable && !allVerified && students.length > 0 && (
                    <Button variant="secondary" onClick={verifyAll} disabled={busy}>
                      <Icon name="check" size={16} />
                      Verify all
                    </Button>
                  )}
                </header>
                <DataTable columns={columns} rows={students} rowKey="student_id" empty={{ icon: 'users', title: 'No trainees', text: 'This request has no trainees attached.' }} />
                <footer className="alw-card-foot">
                  <span>Total for {students.length} {students.length === 1 ? 'trainee' : 'trainees'}</span>
                  <strong className="num">{peso(total)}</strong>
                </footer>
              </section>

              <aside className="alw-side">
                <section className="alw-card alw-pad">
                  <h3>Progress</h3>
                  <Timeline r={r} />
                </section>

                {(r.notes || r.admin_remarks) && (
                  <section className="alw-card alw-pad">
                    <h3>Notes</h3>
                    {r.notes && (
                      <blockquote className="alw-note">
                        <p>{r.notes}</p>
                        <cite>{r.center_name}</cite>
                      </blockquote>
                    )}
                    {r.admin_remarks && (
                      <blockquote className="alw-note is-office">
                        <p>{r.admin_remarks}</p>
                        <cite>Main office{r.reviewed_by_name ? ` · ${r.reviewed_by_name}` : ''}</cite>
                      </blockquote>
                    )}
                  </section>
                )}

                {editable && (
                  <section className="alw-card alw-pad">
                    <h3>{r.status === 'approved' ? 'Release' : 'Decision'}</h3>
                    {r.status === 'approved' ? (
                      <>
                        <p className="alw-help">Approved. Release once the transfer to all {students.length} trainees is made; it is recorded on the ledger.</p>
                        <Button className="btn-block" disabled={busy} onClick={() => setStatus('released', 'Allowance released and recorded.')}>
                          <Icon name="coins" size={17} />
                          Release {peso(total)}
                        </Button>
                      </>
                    ) : (
                      <>
                        {!allVerified && (
                          <p className="alw-help">
                            Verify every trainee to approve. {students.length - done} left.
                          </p>
                        )}
                        <TextArea id="remarks" label="Note to the learning center" rows={3} placeholder="Required when rejecting" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                        <div className="alw-decision">
                          <Button variant="secondary" className="alw-reject" disabled={busy} onClick={() => setStatus('rejected', 'Request rejected.')}>
                            <Icon name="x" size={16} />
                            Reject
                          </Button>
                          <Button disabled={busy || !allVerified} title={!allVerified ? 'Verify every trainee first' : undefined} onClick={() => setStatus('approved', 'Request approved.')}>
                            <Icon name="check" size={16} />
                            Approve
                          </Button>
                        </div>
                      </>
                    )}
                  </section>
                )}

                {r.status === 'released' && (
                  <section className="alw-card alw-pad alw-done">
                    <Icon name="check" size={18} />
                    <div>
                      <strong>{peso(total)} released</strong>
                      <p>
                        On {shortDate(r.released_at)} to {students.length} {students.length === 1 ? 'trainee' : 'trainees'}, and recorded on the ledger.
                      </p>
                    </div>
                  </section>
                )}

                {message && (
                  <p className={message.ok ? 'notice inset alw-message' : 'form-error alw-message'} role="status">
                    {message.text}
                  </p>
                )}
              </aside>
            </div>
          </>
        )}
      </Workspace>
    </>
  )
}
