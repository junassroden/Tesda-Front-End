import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import EmptyState, { ErrorState, ListSkeleton } from '../../components/EmptyState/EmptyState.jsx'
import Icon from '../../components/Icon/Icon.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import StatStrip from '../../components/StatStrip/StatStrip.jsx'
import { ADMIN_SUBTITLE } from '../../constants/navItems.js'
import { ROUTES, toPath } from '../../constants/routes.js'
import { toList } from '../../services/api.js'
import { documentService } from '../../services/documentService.js'
import { inventoryService } from '../../services/inventoryService.js'
import { summaryService } from '../../services/summaryService.js'
import { countOf, peso, shortDate, timeAgo } from '../../utils/format.js'
import { ALLOWANCE, ALLOWANCE_UNRELEASED, SUPPLY, describeParts, splitByStatus } from '../../utils/requestStatus.js'

const ACTIVITY_ICON = { inventory_request: 'request', allowance_request: 'coins', batch: 'programs', delivery_personnel: 'truck' }

const SUPPLY_PARTS = [
  { label: 'to review', statuses: SUPPLY.toReview },
  { label: 'to release', statuses: SUPPLY.toRelease },
  { label: 'released', statuses: [...SUPPLY.onTheWay, ...SUPPLY.received] },
  { label: 'rejected', statuses: SUPPLY.rejected },
]
const ALLOWANCE_PARTS = [
  { label: 'to decide', statuses: ALLOWANCE.toDecide },
  { label: 'to release', statuses: ALLOWANCE.toRelease },
  { label: 'released', statuses: ALLOWANCE.released },
  { label: 'rejected', statuses: ALLOWANCE.rejected },
]

const settle = (result, map = (v) => v) =>
  result.status === 'fulfilled' ? { data: map(result.value), error: null } : { data: null, error: result.reason?.message || 'Something went wrong.' }

/** Shown next to the page title in development builds only (`npm run dev`); production builds drop it. */
const DevBadge = () =>
  import.meta.env.DEV ? (
    <span className="status-badge status-neutral" title="Shown in development builds only. Production builds hide this badge.">
      Development · test data
    </span>
  ) : null

export default function AdminDashboard() {
  const [documents, setDocuments] = useState({ data: null, error: null })
  const [items, setItems] = useState({ data: null, error: null })
  const [summary, setSummary] = useState({ data: null, error: null })
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(
    () =>
      Promise.allSettled([documentService.list(), inventoryService.list(), summaryService.get()]).then(([docs, inv, sum]) => {
        setDocuments(settle(docs, toList))
        setItems(settle(inv, toList))
        setSummary(settle(sum))
        setLoading(false)
      }),
    [],
  )

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const load = () => {
    setLoading(true)
    fetchAll()
  }

  const itemList = items.data ?? []
  const totalQty = itemList.reduce((sum, p) => sum + Number(p.quantity || 0), 0)
  const lowStock = itemList.filter((p) => Number(p.quantity || 0) <= 5)
  const recentDocs = documents.data?.slice(0, 5) ?? []

  const req = summary.data?.inventory_requests?.by_status ?? {}
  const alw = summary.data?.allowance?.by_status ?? {}
  const supply = splitByStatus(req, SUPPLY_PARTS)
  const allowance = splitByStatus(alw, ALLOWANCE_PARTS)

  // Pesos: rejected requests are not money owed, so they stay out of the requested total.
  const alwUnreleasedAmount = ALLOWANCE_UNRELEASED.reduce((s, k) => s + (alw[k]?.amount ?? 0), 0)
  const alwReleasedAmount = alw.released?.amount ?? 0
  const alwRequestedAmount = alwUnreleasedAmount + alwReleasedAmount
  const alwRejected = countOf(alw, ALLOWANCE.rejected)
  const alwActive = allowance.total - alwRejected

  return (
    <>
      <PageHeader title="Main office overview" subtitle={ADMIN_SUBTITLE} actions={<DevBadge />} />

      <StatStrip
        id="queue-title"
        title="Waiting on main office"
        loading={loading}
        error={summary.error}
        onRetry={load}
        cells={[
          { label: 'Supply requests to review', value: countOf(req, SUPPLY.toReview), detail: 'Pending or in review', to: ROUTES.ADMIN.INVENTORY_REQUESTS, attention: true },
          { label: 'Supply requests to release', value: countOf(req, SUPPLY.toRelease), detail: 'Approved, not yet released', to: ROUTES.ADMIN.INVENTORY_REQUESTS, attention: true },
          { label: 'Allowances to decide', value: countOf(alw, ALLOWANCE.toDecide), detail: 'Pending, budget check, or for approval', to: ROUTES.ADMIN.ALLOWANCE, attention: true },
          { label: 'Allowances to release', value: countOf(alw, ALLOWANCE.toRelease), detail: 'Approved, not yet released', to: ROUTES.ADMIN.ALLOWANCE, attention: true },
        ]}
      />

      <div className="dash-grid">
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>Recent supply requests</h2>
              <Link to={ROUTES.ADMIN.INVENTORY_REQUESTS}>
                Review all <Icon name="arrowRight" size={15} />
              </Link>
            </div>
            {loading ? (
              <ListSkeleton />
            ) : summary.error ? (
              <ErrorState compact what="supply requests" onRetry={load} />
            ) : summary.data?.inventory_requests?.recent?.length ? (
              <ul className="list-rows">
                {summary.data.inventory_requests.recent.map((r) => (
                  <li key={r.id} className="list-row">
                    <Link to={toPath(ROUTES.ADMIN.INVENTORY_REQUEST_DETAIL, { id: r.id })} className="list-link">
                      <strong>
                        <span className="code">{r.request_code}</span> · {r.items_summary || 'No items'}
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
            ) : documents.error ? (
              <ErrorState compact what="documents" message={documents.error} onRetry={load} />
            ) : recentDocs.length ? (
              <ul className="list-rows">
                {recentDocs.map((d) => {
                  const labels = [d.image_label, d.text_label].filter(Boolean).map((l) => l.replace(/_/g, ' '))
                  const agree = labels.length === 2 && labels[0].toLowerCase() === labels[1].toLowerCase()
                  return (
                    <li key={d.id} className="list-row with-icon">
                      <span className="row-icon">
                        <Icon name="documents" size={17} />
                      </span>
                      <Link to={toPath(ROUTES.ADMIN.DOCUMENT_DETAIL, { id: d.id })} className="list-link">
                        <strong className="truncate">{d.original_name}</strong>
                        <small>{labels.length === 0 ? 'Not classified yet' : labels.length === 1 || agree ? `AI suggests: ${labels[0]}` : `AI labels differ: ${labels.join(' / ')}`}</small>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <EmptyState compact icon="documents" text="No documents in the archive yet. Uploads appear here with an AI-suggested label." />
            )}
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>Allowance</h2>
            </div>
            {loading ? (
              <ListSkeleton rows={2} />
            ) : summary.error ? (
              <ErrorState compact what="allowance totals" onRetry={load} />
            ) : (
              <>
                <div className="big-number">{peso(alwRequestedAmount)}</div>
                <p className="card-caption">
                  Requested across {alwActive} batch{alwActive === 1 ? '' : 'es'}
                  {alwRejected > 0 && ` · ${alwRejected} rejected, not counted`}
                </p>
                {alwRequestedAmount > 0 && (
                  <div className="progress" aria-hidden="true">
                    <span className="p1" style={{ width: `${(alwUnreleasedAmount / alwRequestedAmount) * 100}%` }} />
                    <span className="p3" style={{ width: `${(alwReleasedAmount / alwRequestedAmount) * 100}%` }} />
                  </div>
                )}
                <div className="legend">
                  <span>
                    <i className="p1" />
                    Not yet released {peso(alwUnreleasedAmount)}
                  </span>
                  <span>
                    <i className="p3" />
                    Released {peso(alwReleasedAmount)}
                  </span>
                </div>
              </>
            )}
            <Button variant="secondary" to={ROUTES.ADMIN.ALLOWANCE} className="btn-block qa" trailingIcon="arrowRight">
              Open allowance tracking
            </Button>
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
                    <Link to={toPath(ROUTES.ADMIN.INVENTORY_ITEM, { id: p.id })} className="list-link">
                      <strong>{p.product_name}</strong>
                    </Link>
                    <span className={`status-badge ${Number(p.quantity) <= 0 ? 'status-danger' : 'status-warning'}`}>
                      {Number(p.quantity) <= 0 ? 'Out of stock' : `${p.quantity} left`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card">
            <div className="card-head">
              <h2>Recent activity</h2>
            </div>
            {loading ? (
              <ListSkeleton />
            ) : summary.error ? (
              <ErrorState compact what="activity" onRetry={load} />
            ) : summary.data?.activity?.length ? (
              <ul className="list-rows">
                {summary.data.activity.map((a) => (
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
        </div>
      </div>

      <StatStrip
        id="records-title"
        title="Records at a glance"
        loading={loading}
        cells={[
          {
            label: 'Archived documents',
            value: documents.error ? '—' : (documents.data?.length ?? 0),
            detail: documents.error ? 'Couldn’t load the archive' : 'In the main office archive',
            to: ROUTES.ADMIN.DOCUMENTS,
          },
          {
            label: 'Items in stock',
            value: items.error ? '—' : itemList.length,
            detail: items.error ? 'Couldn’t load inventory' : `item types · ${totalQty.toLocaleString()} units · ${lowStock.length} running low`,
            to: ROUTES.ADMIN.INVENTORY,
          },
          {
            label: 'Supply requests',
            value: summary.error ? '—' : supply.total,
            detail: summary.error ? 'Couldn’t load requests' : describeParts(supply.parts),
            to: ROUTES.ADMIN.INVENTORY_REQUESTS,
          },
          {
            label: 'Allowance requests',
            value: summary.error ? '—' : allowance.total,
            detail: summary.error ? 'Couldn’t load requests' : describeParts(allowance.parts),
            to: ROUTES.ADMIN.ALLOWANCE,
          },
        ]}
      />
    </>
  )
}
