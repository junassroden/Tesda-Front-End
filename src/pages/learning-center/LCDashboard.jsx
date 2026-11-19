import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DataTable from '../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import KpiCard from '../../components/KpiCard/KpiCard.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import { LEARNING_CENTER_SUBTITLE } from '../../constants/navItems.js'
import { ROUTES } from '../../constants/routes.js'
import { toList } from '../../services/api.js'
import { programService } from '../../services/programService.js'

// Placeholder rows from the Figma frame; batches and requests have no backend yet.
const BATCHES = ['01', '02', '03', '04', '05'].map((n, i) => ({ id: n, batch: `Batch ${n}`, program: 'Program name', students: '00', status: ['Active', 'Pending', 'Active', 'Completed', 'Pending'][i] }))
const INVENTORY_REQUESTS = Array.from({ length: 3 }, (_, i) => ({ title: 'Item Name', meta: 'School Name · Date', status: ['Pending', 'Approved', 'In review'][i] }))
const ALLOWANCE_REQUESTS = Array.from({ length: 3 }, (_, i) => ({ title: 'School Name', meta: 'Date', status: ['Pending', 'In review', 'Approved'][i] }))

const BATCH_COLUMNS = [
  { key: 'batch', label: 'Batch' },
  { key: 'program', label: 'Program' },
  { key: 'students', label: 'Students' },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

// Figma: Dashboard Page (Learning Center) 08
export default function LCDashboard() {
  const [programs, setPrograms] = useState()

  useEffect(() => {
    programService
      .list()
      .then((data) => setPrograms(toList(data)))
      .catch(() => {})
  }, [])

  const enrolled = programs?.reduce((sum, p) => sum + Number(p.enrollment_count || 0), 0)

  return (
    <>
      <PageHeader title="Learning Center overview" subtitle={LEARNING_CENTER_SUBTITLE} />

      <div className="kpi-grid">
        <KpiCard label="Active batches" value="05" hint="Placeholder data" />
        <KpiCard label="Students enrolled" value={enrolled} hint={programs ? `Across ${programs.length} programs` : 'Placeholder data'} />
        <KpiCard label="Inventory requests" value="03" hint="Placeholder data" />
        <KpiCard label="Allowance requests" value="03" hint="Placeholder data" />
      </div>

      <div className="dash-grid">
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>Current student batches</h2>
              <Link to={ROUTES.CENTER.PROGRAMS}>View programs</Link>
            </div>
            <DataTable columns={BATCH_COLUMNS} rows={BATCHES} />
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Delivery</h2>
              <span>Not configured</span>
            </div>
            <ul className="list-rows">
              <li className="list-row with-icon">
                <span className="ph ph-icon" aria-hidden="true" />
                <div>
                  <strong>Delivery placeholder</strong>
                  <small>Delivery details pending</small>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <div className="stack">
          <RequestCard title="Inventory requests" link={ROUTES.CENTER.AVAILABLE_INVENTORY} linkLabel="Request items" rows={INVENTORY_REQUESTS} />
          <RequestCard title="Allowance requests" link={ROUTES.CENTER.REQUEST_ALLOWANCE} linkLabel="Request allowance" rows={ALLOWANCE_REQUESTS} />
        </div>
      </div>
    </>
  )
}

function RequestCard({ title, link, linkLabel, rows }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>{title}</h2>
        <Link to={link}>{linkLabel}</Link>
      </div>
      <ul className="list-rows">
        {rows.map((r, i) => (
          <li key={i} className="list-row">
            <div>
              <strong>{r.title}</strong>
              <small>{r.meta}</small>
            </div>
            <StatusBadge status={r.status} variant="pill" />
          </li>
        ))}
      </ul>
    </section>
  )
}
