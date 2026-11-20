import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import DataTable from '../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import EmptyState, { ListSkeleton } from '../../components/EmptyState/EmptyState.jsx'
import Icon from '../../components/Icon/Icon.jsx'
import KpiCard from '../../components/KpiCard/KpiCard.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import { ROUTES } from '../../constants/routes.js'
import { useAuth } from '../../hooks/useAuth.js'
import { toList } from '../../services/api.js'
import { inventoryService } from '../../services/inventoryService.js'
import { programService } from '../../services/programService.js'
import { summaryService } from '../../services/summaryService.js'
import { countOf, peso, shortDate } from '../../utils/format.js'

const BATCH_COLUMNS = [
  { key: 'batch_name', label: 'Batch' },
  { key: 'course_name', label: 'Program', render: (r) => <span className="muted">{r.course_name}</span> },
  { key: 'enrolled', label: 'Trainees', align: 'end', render: (r) => <span className="num">{r.enrolled}</span> },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

// Figma: Dashboard Page (Learning Center) 08
export default function LCDashboard() {
  const { user } = useAuth()
  const [programs, setPrograms] = useState(null)
  const [summary, setSummary] = useState(null)
  const [confirming, setConfirming] = useState(null)

  const loadSummary = useCallback(
    () =>
      summaryService
        .get()
        .then(setSummary)
        .catch(() => setSummary(false)),
    [],
  )

  useEffect(() => {
    programService
      .list()
      .then((data) => setPrograms(toList(data)))
      .catch(() => setPrograms([]))
    loadSummary()
  }, [loadSummary])

  const confirmReceived = async (id) => {
    setConfirming(id)
    try {
      await inventoryService.markReceived(id)
      await loadSummary()
    } finally {
      setConfirming(null)
    }
  }

  const loading = summary === null
  const enrolled = programs?.reduce((sum, p) => sum + Number(p.enrollment_count || 0), 0)
  const req = summary?.inventory_requests?.by_status ?? {}
  const alw = summary?.allowance?.by_status ?? {}
  const supplyRows = summary?.inventory_requests?.recent ?? []
  const allowanceRows = summary?.allowance?.recent ?? []

  return (
    <>
      <PageHeader title={user?.training_center_name || 'Learning center overview'} subtitle="Your programs, student batches, and requests to the main office." />

      <div className="kpi-grid">
        <KpiCard icon="programs" label="Programs offered" value={programs?.length} hint="NC programs at this center" loading={programs === null} />
        <KpiCard
          icon="users"
          label="Trainees enrolled"
          value={enrolled}
          bars={programs?.map((p) => ({ label: p.course_name, value: Number(p.enrollment_count) || 0 }))}
          hint="Per program"
          loading={programs === null}
        />
        <KpiCard
          icon="request"
          label="Supply requests"
          value={Object.values(req).reduce((a, b) => a + Number(b), 0)}
          loading={loading}
          split={[
            { label: 'waiting', value: countOf(req, ['pending', 'in_review', 'approved']), tone: 'warning' },
            { label: 'on the way', value: countOf(req, ['released']), tone: 'info' },
            { label: 'received', value: countOf(req, ['received']), tone: 'success' },
          ]}
        />
        <KpiCard
          icon="coins"
          label="Allowance requests"
          value={Object.values(alw).reduce((a, b) => a + b.count, 0)}
          loading={loading}
          split={[
            { label: 'open', value: countOf(alw, ['pending', 'budget_check', 'for_approval', 'approved']), tone: 'warning' },
            { label: 'released', value: countOf(alw, ['released']), tone: 'success' },
          ]}
        />
      </div>

      <div className="dash-grid">
        <section className="card flush">
          <div className="card-head">
            <h2>Current batches</h2>
            <Link to={ROUTES.CENTER.PROGRAMS}>
              Programs <Icon name="arrowRight" size={15} />
            </Link>
          </div>
          <DataTable
            columns={BATCH_COLUMNS}
            rows={summary?.batches ?? []}
            loading={loading}
            empty={{ icon: 'calendar', title: 'No batches yet', text: 'Open a batch from a program’s page.' }}
          />
        </section>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>Supply requests</h2>
              <Link to={ROUTES.CENTER.AVAILABLE_INVENTORY}>
                New <Icon name="plus" size={15} />
              </Link>
            </div>
            {loading ? (
              <ListSkeleton />
            ) : supplyRows.length ? (
              <ul className="list-rows">
                {supplyRows.map((r) => (
                  <li key={r.id} className="list-row">
                    <span>
                      <strong>
                        {r.request_code} · {r.items_summary}
                      </strong>
                      <small>Sent {shortDate(r.created_at)}</small>
                    </span>
                    {r.status === 'released' ? (
                      <Button variant="secondary" disabled={confirming === r.id} onClick={() => confirmReceived(r.id)}>
                        Confirm received
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
                New <Icon name="plus" size={15} />
              </Link>
            </div>
            {loading ? (
              <ListSkeleton />
            ) : allowanceRows.length ? (
              <ul className="list-rows">
                {allowanceRows.map((r) => (
                  <li key={r.id} className="list-row">
                    <span>
                      <strong>
                        {r.request_code} · {r.batch_name}
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

