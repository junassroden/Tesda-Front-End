import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import DataTable from '../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import EmptyState, { ErrorState, ListSkeleton } from '../../components/EmptyState/EmptyState.jsx'
import Icon from '../../components/Icon/Icon.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import StatStrip from '../../components/StatStrip/StatStrip.jsx'
import { LEARNING_CENTER_SUBTITLE } from '../../constants/navItems.js'
import { ROUTES, toPath } from '../../constants/routes.js'
import { useAuth } from '../../hooks/useAuth.js'
import { toList } from '../../services/api.js'
import { inventoryService } from '../../services/inventoryService.js'
import { programService } from '../../services/programService.js'
import { summaryService } from '../../services/summaryService.js'
import { countOf, peso, shortDate } from '../../utils/format.js'
import { ALLOWANCE, SUPPLY } from '../../utils/requestStatus.js'
import { batchBadge } from '../../utils/training.js'

const BATCH_COLUMNS = [
  { key: 'batch_name', label: 'Batch' },
  { key: 'course_name', label: 'Course', render: (r) => <span className="muted">{r.course_name}</span> },
  { key: 'enrolled', label: 'Trainees', align: 'end', render: (r) => <span className="num">{r.enrolled}</span> },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={batchBadge(r)} /> },
]

// The learning center's home: what needs the center's action, then its batches and requests.
export default function LCDashboard() {
  const { user } = useAuth()
  const [programs, setPrograms] = useState(null)
  const [programsError, setProgramsError] = useState('')
  const [summary, setSummary] = useState(null) // object | undefined (failed)
  const [summaryError, setSummaryError] = useState('')
  const [confirming, setConfirming] = useState(null)
  const [confirmError, setConfirmError] = useState('')

  const loadSummary = useCallback(
    () =>
      summaryService
        .get()
        .then((data) => {
          setSummaryError('')
          setSummary(data)
        })
        .catch((err) => {
          setSummaryError(err?.message || 'Something went wrong.')
          setSummary((prev) => prev || undefined)
        }),
    [],
  )

  const loadPrograms = useCallback(
    () =>
      programService
        .list()
        .then((data) => {
          setProgramsError('')
          setPrograms(toList(data))
        })
        .catch((err) => {
          setProgramsError(err?.message || 'Something went wrong.')
          setPrograms([])
        }),
    [],
  )

  useEffect(() => {
    loadPrograms()
    loadSummary()
  }, [loadPrograms, loadSummary])

  const retry = () => {
    setSummary(null)
    setPrograms(null)
    loadPrograms()
    loadSummary()
  }

  const confirmReceived = async (id) => {
    setConfirming(id)
    setConfirmError('')
    try {
      await inventoryService.markReceived(id)
      await loadSummary()
    } catch (err) {
      setConfirmError(err?.message || 'Could not confirm the delivery.')
    } finally {
      setConfirming(null)
    }
  }

  const loading = summary === null
  const failed = summary === undefined
  const enrolled = (programs ?? []).reduce((sum, p) => sum + Number(p.enrollment_count || 0), 0)
  const req = summary?.inventory_requests?.by_status ?? {}
  const alw = summary?.allowance?.by_status ?? {}
  const supplyRows = summary?.inventory_requests?.recent ?? []
  const allowanceRows = summary?.allowance?.recent ?? []
  const rejected = countOf(req, SUPPLY.rejected) + countOf(alw, ALLOWANCE.rejected)

  return (
    <>
      <PageHeader
        title={user?.training_center_name || 'Learning center overview'}
        subtitle={LEARNING_CENTER_SUBTITLE}
        actions={
          <>
            <Button variant="secondary" to={ROUTES.CENTER.REQUEST_ALLOWANCE}>
              <Icon name="coins" size={16} />
              Request allowance
            </Button>
            <Button to={ROUTES.CENTER.AVAILABLE_INVENTORY}>
              <Icon name="plus" size={16} />
              Request supplies
            </Button>
          </>
        }
      />

      <StatStrip
        id="training-queue"
        title="Training that needs you"
        loading={loading}
        error={failed ? summaryError : ''}
        onRetry={retry}
        cells={[
          { label: 'Batches to review', value: summary?.training?.needs_review ?? 0, detail: 'Past their end date: extend or confirm completion', attention: true, to: ROUTES.CENTER.PROGRAMS },
          { label: 'Suspended batches', value: summary?.training?.suspended ?? 0, detail: 'Training paused until resumed', attention: true },
          { label: 'Documents to review', value: summary?.training?.pending_documents ?? 0, detail: 'Submitted by students', attention: true, to: ROUTES.CENTER.STUDENT_RECORDS },
          { label: 'Ongoing batches', value: summary?.training?.ongoing ?? 0, detail: 'Batch history keeps the finished ones', to: ROUTES.CENTER.HISTORY },
        ]}
      />

      <StatStrip
        id="center-queue"
        title="Your requests to the main office"
        loading={loading}
        error={failed ? summaryError : ''}
        onRetry={retry}
        cells={[
          { label: 'Deliveries to confirm', value: countOf(req, SUPPLY.onTheWay), detail: 'Released by the main office; confirm when received', attention: true },
          { label: 'Supply requests in progress', value: countOf(req, [...SUPPLY.toReview, ...SUPPLY.toRelease]), detail: 'Waiting for review or release' },
          { label: 'Allowances in progress', value: countOf(alw, [...ALLOWANCE.toDecide, ...ALLOWANCE.toRelease]), detail: 'Waiting for a decision or release' },
          { label: 'Rejected requests', value: rejected, detail: 'Read the main office’s note before resending', attention: true },
        ]}
      />

      <div className="dash-grid">
        <section className="card flush">
          <div className="card-head">
            <div>
              <h2>Current batches</h2>
              {!programsError && programs !== null && (
                <p className="card-sub">
                  {programs.length} course{programs.length === 1 ? '' : 's'} · {enrolled} trainee{enrolled === 1 ? '' : 's'} enrolled
                </p>
              )}
            </div>
            <Link to={ROUTES.CENTER.PROGRAMS}>
              Courses <Icon name="arrowRight" size={15} />
            </Link>
          </div>
          {failed ? (
            <ErrorState compact what="your batches" onRetry={retry} />
          ) : (
            <DataTable
              columns={BATCH_COLUMNS}
              rows={(summary?.batches ?? []).filter((b) => !b.in_history)}
              loading={loading}
              empty={{ icon: 'calendar', title: 'No active batches', text: 'Open a batch from a course’s page. Finished batches move to Batch history.' }}
              rowHref={(b) => toPath(ROUTES.CENTER.BATCH, { programId: b.course_id, batchId: b.id })}
            />
          )}
        </section>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>Supply requests</h2>
              <Link to={ROUTES.CENTER.AVAILABLE_INVENTORY}>
                New request <Icon name="plus" size={15} />
              </Link>
            </div>
            {confirmError && (
              <p className="form-error" role="alert">
                {confirmError}
              </p>
            )}
            {loading ? (
              <ListSkeleton />
            ) : failed ? (
              <ErrorState compact what="supply requests" onRetry={retry} />
            ) : supplyRows.length ? (
              <ul className="list-rows">
                {supplyRows.map((r) => (
                  <li key={r.id} className="list-row">
                    <span>
                      <strong>
                        <span className="code">{r.request_code}</span> · {r.items_summary}
                      </strong>
                      <small>Sent {shortDate(r.created_at)}</small>
                    </span>
                    {r.status === 'released' ? (
                      <Button variant="secondary" disabled={confirming === r.id} onClick={() => confirmReceived(r.id)}>
                        {confirming === r.id ? 'Confirming…' : 'Confirm received'}
                      </Button>
                    ) : (
                      <StatusBadge status={r.status} />
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact icon="request" text="You haven’t requested any supplies yet." />
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Allowance requests</h2>
              <Link to={ROUTES.CENTER.REQUEST_ALLOWANCE}>
                New request <Icon name="plus" size={15} />
              </Link>
            </div>
            {loading ? (
              <ListSkeleton />
            ) : failed ? (
              <ErrorState compact what="allowance requests" onRetry={retry} />
            ) : allowanceRows.length ? (
              <ul className="list-rows">
                {allowanceRows.map((r) => (
                  <li key={r.id} className="list-row">
                    <span>
                      <strong>
                        <span className="code">{r.request_code}</span> · {r.batch_name}
                      </strong>
                      <small>
                        {peso(r.total_amount)} · {r.student_count} trainees · sent {shortDate(r.created_at)}
                      </small>
                    </span>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact icon="coins" text="No allowance requests yet." />
            )}
          </section>
        </div>
      </div>
    </>
  )
}
