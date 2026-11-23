import { useEffect, useState } from 'react'
import DataTable from '../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import { ErrorState } from '../../components/EmptyState/EmptyState.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import StatStrip from '../../components/StatStrip/StatStrip.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../constants/routes.js'
import { useAuth } from '../../hooks/useAuth.js'
import { teacherService } from '../../services/teacherService.js'
import { dateRange } from '../../utils/format.js'

const BATCH_COLUMNS = [
  {
    key: 'batch_name',
    label: 'Batch',
    className: 'cell-wrap',
    render: (b) => (
      <span className="cell-stack">
        <strong>{b.batch_name}</strong>
        <small>
          {b.course_name} · {b.course_code}
        </small>
      </span>
    ),
  },
  { key: 'dates', label: 'Schedule', render: (b) => <span className="muted num">{dateRange(b.start_date, b.end_date)}</span> },
  { key: 'enrolled', label: 'Trainees', align: 'end', render: (b) => <span className="num">{`${b.enrolled ?? 0}/${b.capacity}`}</span> },
  { key: 'status', label: 'Status', render: (b) => <StatusBadge status={b.status} /> },
]

// The teacher's home: the batches they handle, with quick totals.
export default function TeacherDashboard() {
  const { user } = useAuth()
  const [batches, setBatches] = useState(null)
  const [programs, setPrograms] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    teacherService
      .myBatches()
      .then((data) => setBatches(data.batches ?? []))
      .catch((err) => {
        setError(err.message)
        setBatches([])
      })
    teacherService
      .overview()
      .then((data) => setPrograms(data.courses ?? []))
      .catch(() => setPrograms([]))
  }, [])

  const loading = batches === null
  const active = (batches ?? []).filter((b) => b.status === 'ongoing' || b.status === 'upcoming')
  const trainees = (batches ?? []).filter((b) => b.status === 'ongoing').reduce((sum, b) => sum + (Number(b.enrolled) || 0), 0)
  const firstName = (user?.full_name || '').split(' ')[0]

  return (
    <>
      <PageHeader title={firstName ? `Hello, ${firstName}` : 'My batches'} subtitle="The batches the learning center assigned to you. Open one to go to its classroom." />

      <StatStrip
        columns={3}
        loading={loading}
        error={error}
        cells={[
          { label: 'Active batches', value: active.length, detail: 'Ongoing or starting soon' },
          { label: 'Trainees now', value: trainees, detail: 'In your ongoing batches' },
          { label: 'Programs at your center', value: programs?.length ?? '—', detail: 'Open NC programs', to: ROUTES.TEACHER.PROGRAMS },
        ]}
      />

      <Workspace title="My batches" description={loading ? 'Loading…' : `${batches.length} ${batches.length === 1 ? 'batch' : 'batches'} assigned to you`} flush>
        {error ? (
          <ErrorState what="your batches" />
        ) : (
          <DataTable
            columns={BATCH_COLUMNS}
            rows={batches ?? []}
            loading={loading}
            empty={{ icon: 'calendar', title: 'No batches yet', text: 'Batches you open, or that your center assigns to you, show up here. Open one from a program.' }}
            rowHref={(b) => toPath(ROUTES.TEACHER.CLASSROOM, { batchId: b.id })}
          />
        )}
      </Workspace>
    </>
  )
}
