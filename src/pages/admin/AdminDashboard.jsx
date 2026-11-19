import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import KpiCard from '../../components/KpiCard/KpiCard.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import { ROUTES } from '../../constants/routes.js'
import { toList } from '../../services/api.js'
import { documentService } from '../../services/documentService.js'
import { inventoryService } from '../../services/inventoryService.js'

// Sample content from the Figma frame, shown where the backend has no data source yet.
const SAMPLE_DOCS = [
  { title: 'Vendor contract renewal', meta: 'Procurement · Contract', status: 'In review' },
  { title: 'Insurance policy', meta: 'Administration · Policy', status: 'Current' },
  { title: 'Compliance checklist', meta: 'Operations · Supporting files needed', status: 'Incomplete' },
]
const SAMPLE_ITEM_REQUESTS = [
  { title: 'REQ-012 · Safety kits × 4', meta: 'Facilities · Main building' },
  { title: 'REQ-011 · Toolboxes × 2', meta: 'Maintenance · Main building' },
  { title: 'REQ-010 · Laptop × 1', meta: 'Administration · Main building' },
]
const SAMPLE_ACTIVITY = [
  { title: 'Company document added', meta: 'Procurement · Vendor contract renewal' },
  { title: 'Item request submitted', meta: 'Facilities · 4 safety kits requested' },
  { title: 'Batch allowance requested', meta: 'North Center · Batch 2026-01 · 30 students' },
]

// Figma: Dashboard Page (Admin)18
export default function AdminDashboard() {
  const [documents, setDocuments] = useState(null)
  const [items, setItems] = useState(null)

  useEffect(() => {
    documentService
      .list()
      .then((data) => setDocuments(toList(data)))
      .catch(() => setDocuments(null))
    inventoryService
      .list()
      .then((data) => setItems(toList(data)))
      .catch(() => setItems(null))
  }, [])

  const totalQty = items?.reduce((sum, p) => sum + Number(p.quantity || 0), 0)
  const recentDocs = documents?.slice(0, 3).map((d) => ({ title: d.original_name, meta: [d.image_label, d.text_label].filter(Boolean).join(' · ') || 'Document', status: null }))

  return (
    <>
      <PageHeader title="Dashboard overview" subtitle="Company documents, main-building items, and batch allowance requests. Sample data shown where the backend has none yet." />

      <div className="kpi-grid">
        <KpiCard label="Company documents" value={documents?.length} hint="Current company records" />
        <KpiCard label="Main-building items" value={totalQty} hint="Assets, supplies & equipment" />
        <KpiCard label="Pending item requests" value={12} hint="Awaiting review or fulfillment (sample)" />
        <KpiCard label="Pending allowance requests" value={8} hint="Current batches · learning centers (sample)" />
      </div>

      <div className="dash-grid">
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>Company documents</h2>
              <Link to={ROUTES.ADMIN.DOCUMENTS}>View documents</Link>
            </div>
            <div className="mini-stats">
              <MiniStat label="In review" value={24} />
              <MiniStat label="Incomplete" value={6} />
              <MiniStat label="Expiring" value={4} />
              <MiniStat label="Current" value={94} />
            </div>
            <p className="list-label">
              Recent documents <span>{recentDocs?.length ? 'Latest uploads' : 'Sample records'}</span>
            </p>
            <ListRows rows={recentDocs?.length ? recentDocs : SAMPLE_DOCS} />
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Main-building inventory</h2>
              <Link to={ROUTES.ADMIN.INVENTORY}>View items</Link>
            </div>
            <div className="mini-stats">
              <MiniStat label="Total items" value={totalQty ?? 312} />
              <MiniStat label="In use" value={60} />
              <MiniStat label="Reserved" value={48} />
              <MiniStat label="Available" value={204} />
            </div>
            <p className="list-label">
              Item requests · 12 pending <Link to={ROUTES.ADMIN.INVENTORY_REQUESTS}>Review requests</Link>
            </p>
            <ListRows rows={SAMPLE_ITEM_REQUESTS.map((r) => ({ ...r, status: 'Pending' }))} />
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>Allowance requests</h2>
              <Link to={ROUTES.ADMIN.ALLOWANCE}>Review requests</Link>
            </div>
            <p className="list-label">Current student batches</p>
            <div className="big-number">8</div>
            <p className="card-caption">8 pending · 4 budget checks · 4 for approval</p>
            <ul className="list-rows">
              <li className="list-row">
                <div>
                  <small>North Center · Batch 2026-01</small>
                  <br />
                  <small>30 students · Budget check</small>
                </div>
              </li>
              <li className="list-row">
                <div>
                  <small>South Center · Batch 2026-02</small>
                  <br />
                  <small>25 students · For approval</small>
                </div>
              </li>
            </ul>
            <p className="list-label" style={{ marginTop: 12 }}>
              Submitted by learning centers
            </p>
            <p className="card-caption">Requests cover each center&apos;s current student batch.</p>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Recent activity</h2>
              <span>Sample activity</span>
            </div>
            <ul className="list-rows">
              {SAMPLE_ACTIVITY.map((a) => (
                <li key={a.title} className="list-row with-icon">
                  <span className="ph ph-icon" aria-hidden="true" />
                  <div>
                    <strong>{a.title}</strong>
                    <small>{a.meta}</small>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="mini-stat">
      <span>{label}</span>
      <strong>{value ?? '—'}</strong>
    </div>
  )
}

function ListRows({ rows }) {
  return (
    <ul className="list-rows">
      {rows.map((r, i) => (
        <li key={`${r.title}-${i}`} className="list-row">
          <div>
            <strong>{r.title}</strong>
            <small>{r.meta}</small>
          </div>
          {r.status && <StatusBadge status={r.status} variant="pill" />}
        </li>
      ))}
    </ul>
  )
}
