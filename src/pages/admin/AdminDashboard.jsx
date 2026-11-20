import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import EmptyState, { ListSkeleton } from '../../components/EmptyState/EmptyState.jsx'
import Icon from '../../components/Icon/Icon.jsx'
import KpiCard from '../../components/KpiCard/KpiCard.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import { ADMIN_SUBTITLE } from '../../constants/navItems.js'
import { ROUTES, toPath } from '../../constants/routes.js'
import { toList } from '../../services/api.js'
import { documentService } from '../../services/documentService.js'
import { inventoryService } from '../../services/inventoryService.js'
import { summaryService } from '../../services/summaryService.js'
import { countOf, peso, shortDate, timeAgo } from '../../utils/format.js'

const ACTIVITY_ICON = { inventory_request: 'request', allowance_request: 'coins', batch: 'programs', delivery_personnel: 'truck' }

// Figma: Dashboard Page (Admin)18
export default function AdminDashboard() {
  const [documents, setDocuments] = useState(null)
  const [items, setItems] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([documentService.list(), inventoryService.list(), summaryService.get()]).then(([docs, inv, sum]) => {
      setDocuments(docs.status === 'fulfilled' ? toList(docs.value) : null)
      setItems(inv.status === 'fulfilled' ? toList(inv.value) : null)
      setSummary(sum.status === 'fulfilled' ? sum.value : null)
      setLoading(false)
    })
  }, [])

  const totalQty = items?.reduce((sum, p) => sum + Number(p.quantity || 0), 0)
  const lowStock = items?.filter((p) => Number(p.quantity || 0) <= 5) ?? []
  const recentDocs = documents?.slice(0, 4) ?? []

  const req = summary?.inventory_requests?.by_status ?? {}
  const reqTotal = Object.values(req).reduce((a, b) => a + Number(b), 0)
  const alw = summary?.allowance?.by_status ?? {}
  const alwTotal = Object.values(alw).reduce((a, b) => a + b.count, 0)
  const alwPendingAmount = ['pending', 'budget_check', 'for_approval', 'approved'].reduce((s, k) => s + (alw[k]?.amount ?? 0), 0)
  const alwReleasedAmount = alw.released?.amount ?? 0

  return (
    <>
      <PageHeader title="Main office overview" subtitle={ADMIN_SUBTITLE} />

      <div className="kpi-grid">
        <KpiCard icon="documents" label="Company documents" value={documents?.length} hint="In the main office archive" loading={loading} />
        <KpiCard
          icon="inventory"
          label="Items in stock"
          value={totalQty?.toLocaleString()}
          bars={items?.map((p) => ({ label: p.product_name, value: Number(p.quantity) || 0 }))}
          hint={items ? `${items.length} item types · ${lowStock.length} running low` : 'Main office supplies'}
          loading={loading}
        />
        <KpiCard
          icon="request"
          label="Supply requests"
          value={reqTotal}
          loading={loading}
          split={[
            { label: 'to review', value: countOf(req, ['pending', 'in_review']), tone: 'warning' },
            { label: 'to release', value: countOf(req, ['approved']), tone: 'info' },
            { label: 'done', value: countOf(req, ['released', 'received']), tone: 'success' },
          ]}
        />
        <KpiCard
          icon="coins"
          label="Allowance requests"
          value={alwTotal}
          loading={loading}
          split={[
            { label: 'open', value: countOf(alw, ['pending', 'budget_check', 'for_approval', 'approved']), tone: 'warning' },
            { label: 'released', value: countOf(alw, ['released']), tone: 'success' },
          ]}
        />
      </div>

      <div className="dash-grid">
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>Supply requests</h2>
              <Link to={ROUTES.ADMIN.INVENTORY_REQUESTS}>
                Review all <Icon name="arrowRight" size={15} />
              </Link>
            </div>
            {loading ? (
              <ListSkeleton />
            ) : summary?.inventory_requests?.recent?.length ? (
              <ul className="list-rows">
                {summary.inventory_requests.recent.map((r) => (
                  <li key={r.id} className="list-row">
                    <Link to={toPath(ROUTES.ADMIN.INVENTORY_REQUEST_DETAIL, { id: r.id })} className="list-link">
                      <strong>
                        {r.request_code} · {r.items_summary || 'No items'}
                      </strong>
                      <small>
                        {r.center_name} · {shortDate(r.created_at)}
                      </small>
                    </Link>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact icon="request" text="No supply requests yet. They appear here when a learning center sends one." />
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Recent documents</h2>
              <Link to={ROUTES.ADMIN.DOCUMENTS}>
                Open archive <Icon name="arrowRight" size={15} />
              </Link>
            </div>
            {loading ? (
              <ListSkeleton />
            ) : recentDocs.length ? (
              <ul className="list-rows">
                {recentDocs.map((d) => (
                  <li key={d.id} className="list-row with-icon">
                    <span className="row-icon">
                      <Icon name="documents" size={17} />
                    </span>
                    <div>
                      <strong>{d.original_name}</strong>
                      <small>{[d.image_label, d.text_label].filter(Boolean).join(' · ').replace(/_/g, ' ') || 'Not classified yet'}</small>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact icon="documents" text="No documents in the archive yet. Uploads appear here with their AI label." />
            )}
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>Allowance</h2>
            </div>
            <div className="big-number">{loading ? '—' : peso(alwPendingAmount + alwReleasedAmount)}</div>
            <p className="card-caption">Requested across {alwTotal} batch{alwTotal === 1 ? '' : 'es'}</p>
            {alwPendingAmount + alwReleasedAmount > 0 && (
              <div className="progress" aria-hidden="true">
                <span className="p1" style={{ width: `${(alwPendingAmount / (alwPendingAmount + alwReleasedAmount)) * 100}%` }} />
                <span className="p3" style={{ width: `${(alwReleasedAmount / (alwPendingAmount + alwReleasedAmount)) * 100}%` }} />
              </div>
            )}
            <div className="legend">
              <span>
                <i className="p1" />
                Open {peso(alwPendingAmount)}
              </span>
              <span>
                <i className="p3" />
                Released {peso(alwReleasedAmount)}
              </span>
            </div>
            <Button variant="secondary" to={ROUTES.ADMIN.ALLOWANCE} className="btn-block qa" trailingIcon="arrowRight">
              Open allowance tracking
            </Button>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Recent activity</h2>
            </div>
            {loading ? (
              <ListSkeleton />
            ) : summary?.activity?.length ? (
              <ul className="list-rows">
                {summary.activity.map((a) => (
                  <li key={a.id} className="list-row with-icon">
                    <span className="row-icon">
                      <Icon name={ACTIVITY_ICON[a.entity_type] ?? 'clock'} size={17} />
                    </span>
                    <div>
                      <strong>{a.description}</strong>
                      <small>{[a.user_name, a.center_name, timeAgo(a.created_at)].filter(Boolean).join(' · ')}</small>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact icon="clock" text="Nothing has happened yet." />
            )}
          </section>

          {lowStock.length > 0 && (
            <section className="card">
              <div className="card-head">
                <h2>Running low</h2>
                <Link to={ROUTES.ADMIN.INVENTORY}>Inventory</Link>
              </div>
              <ul className="list-rows">
                {lowStock.slice(0, 4).map((p) => (
                  <li key={p.id} className="list-row">
                    <strong>{p.product_name}</strong>
                    <span className="status-badge status-warning">{p.quantity} left</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
