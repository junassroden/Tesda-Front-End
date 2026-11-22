import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import EmptyState from '../../../components/EmptyState/EmptyState.jsx'
import InventoryCard, { InventoryCardSkeleton } from '../../../components/InventoryCard/InventoryCard.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../../components/Pagination/Pagination.jsx'
import Tabs from '../../../components/Tabs/Tabs.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { usePagination } from '../../../hooks/usePagination.js'
import { toList } from '../../../services/api.js'
import { inventoryService } from '../../../services/inventoryService.js'
import { exportReport } from '../../../utils/exportReport.js'
import { peso } from '../../../utils/format.js'
import { CATEGORY_LABELS as CATEGORIES, qtyOf, stockState } from '../../../utils/inventory.js'

const valueOf = (p) => qtyOf(p) * (Number(p.price) || 0)

const EXPORT_COLUMNS = [
  { key: 'product_name', label: 'Item' },
  { key: 'category', label: 'Category' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'unit', label: 'Unit' },
  { key: 'price', label: 'Unit price (PHP)' },
  { key: 'description', label: 'Description' },
]

const SORTS = {
  name: { label: 'Name (A–Z)', compare: (a, b) => String(a.product_name).localeCompare(String(b.product_name)) },
  'qty-asc': { label: 'Lowest stock first', compare: (a, b) => qtyOf(a) - qtyOf(b) },
  'qty-desc': { label: 'Highest stock first', compare: (a, b) => qtyOf(b) - qtyOf(a) },
  value: { label: 'Highest value first', compare: (a, b) => valueOf(b) - valueOf(a) },
}

// Figma: Inventory 14
export default function InventoryPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [stock, setStock] = useState('all')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('name')

  useEffect(() => {
    inventoryService
      .list()
      .then((data) => setItems(toList(data)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const term = search.toLowerCase()
  const matchesText = (p) => `${p.product_name ?? ''} ${p.description ?? ''} ${CATEGORIES[p.category] ?? ''}`.toLowerCase().includes(term)
  const matchesCategory = (p) => category === 'all' || p.category === category
  const filtered = items
    .filter((p) => matchesText(p) && matchesCategory(p) && (stock === 'all' || stockState(p).key === stock))
    .sort(SORTS[sort].compare)
  const { rows, page, pageCount, setPage } = usePagination(filtered, 12)

  const totalQty = items.reduce((sum, p) => sum + qtyOf(p), 0)
  const totalValue = items.reduce((sum, p) => sum + valueOf(p), 0)
  const needsRestock = items.filter((p) => stockState(p).key !== 'ok').length

  // Tab counts follow the search and category, so they always match what a tab will show.
  const base = items.filter((p) => matchesText(p) && matchesCategory(p))
  const tabs = [
    { value: 'all', label: 'All items' },
    { value: 'ok', label: 'In stock' },
    { value: 'low', label: 'Low stock' },
    { value: 'out', label: 'Out of stock' },
  ].map((t) => ({ ...t, count: base.filter((p) => t.value === 'all' || stockState(p).key === t.value).length }))

  const usedCategories = Object.keys(CATEGORIES).filter((key) => items.some((p) => p.category === key))
  const filtering = search || stock !== 'all' || category !== 'all'

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Supplies and equipment held by the main office, ready to release to learning centers."
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search items"
        onExport={(format) => exportReport(format, { title: 'Inventory', columns: EXPORT_COLUMNS, rows: filtered })}
      />

      <div className="inv-stats">
        <div className="inv-stat">
          <span className="inv-stat-label">
            Item types
          </span>
          <strong className="inv-stat-value num">{loading ? '–' : items.length}</strong>
        </div>
        <div className="inv-stat">
          <span className="inv-stat-label">
            Units on hand
          </span>
          <strong className="inv-stat-value num">{loading ? '–' : totalQty.toLocaleString()}</strong>
        </div>
        <div className="inv-stat">
          <span className="inv-stat-label">
            Stock value
          </span>
          <strong className="inv-stat-value num">{loading ? '–' : peso(totalValue)}</strong>
        </div>
        <button type="button" className={`inv-stat inv-stat-alert${needsRestock ? ' is-active' : ''}`} onClick={() => setStock(items.some((p) => stockState(p).key === 'low') ? 'low' : 'out')} disabled={loading || !needsRestock}>
          <span className="inv-stat-label">
            Needs restocking
          </span>
          <strong className="inv-stat-value num">{loading ? '–' : needsRestock}</strong>
          {needsRestock > 0 && <small>Low or out of stock</small>}
        </button>
      </div>

      <Workspace
        title="Current inventory"
        description={loading ? 'Loading items…' : `${filtered.length} of ${items.length} items shown`}
        actions={
          <>
            <Button variant="secondary" to={ROUTES.ADMIN.INVENTORY_REQUESTS}>
              <Icon name="request" size={17} />
              Supply requests
            </Button>
            <Button to={ROUTES.ADMIN.REGISTER_ITEM}>
              <Icon name="plus" size={17} />
              Register item
            </Button>
          </>
        }
        flush
      >
        <div className="inv-toolbar">
          <Tabs
            tabs={tabs}
            value={stock}
            onChange={(v) => {
              setStock(v)
              setPage(1)
            }}
          />
          <div className="inv-selects">
            <label className="inv-select">
              <span className="visually-hidden">Category</span>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  setPage(1)
                }}
              >
                <option value="all">All categories</option>
                {usedCategories.map((key) => (
                  <option key={key} value={key}>
                    {CATEGORIES[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="inv-select">
              <span className="visually-hidden">Sort by</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {Object.entries(SORTS).map(([key, s]) => (
                  <option key={key} value={key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {error && (
          <p className="form-error inset" role="alert">
            {error}
          </p>
        )}

        <div className="inv-cards-wrap">
          {loading ? (
            <div className="inv-cards">
              {Array.from({ length: 8 }, (_, i) => (
                <InventoryCardSkeleton key={i} />
              ))}
            </div>
          ) : rows.length ? (
            <div className="inv-cards">
              {rows.map((p) => (
                <InventoryCard
                  key={p.id}
                  item={p}
                  meta={`${qtyOf(p).toLocaleString()} ${p.unit || 'pc'} · ${peso(p.price)}`}
                  onOpen={() => navigate(toPath(ROUTES.ADMIN.INVENTORY_ITEM, { id: p.id }))}
                />
              ))}
            </div>
          ) : (
            !error && (
              <EmptyState icon="inventory" title={filtering ? 'No matching items' : 'No items yet'} text={filtering ? 'Nothing matches these filters. Try another tab, category or search.' : 'Register the first item to start tracking stock.'}>
                {filtering ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearch('')
                      setStock('all')
                      setCategory('all')
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button to={ROUTES.ADMIN.REGISTER_ITEM}>
                    <Icon name="plus" size={17} />
                    Register item
                  </Button>
                )}
              </EmptyState>
            )
          )}
        </div>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Workspace>
    </>
  )
}
