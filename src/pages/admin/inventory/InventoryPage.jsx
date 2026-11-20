import { useEffect, useState } from 'react'
import Button from '../../../components/Button/Button.jsx'
import EmptyState from '../../../components/EmptyState/EmptyState.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import ItemCard, { ItemCardSkeleton } from '../../../components/ItemCard/ItemCard.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../../components/Pagination/Pagination.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES } from '../../../constants/routes.js'
import { usePagination } from '../../../hooks/usePagination.js'
import { toList } from '../../../services/api.js'
import { inventoryService } from '../../../services/inventoryService.js'
import { exportReport } from '../../../utils/exportReport.js'

const EXPORT_COLUMNS = [
  { key: 'product_name', label: 'Item' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'description', label: 'Description' },
]

// Figma: Inventory 14
export default function InventoryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    inventoryService
      .list()
      .then((data) => setItems(toList(data)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter((p) => `${p.product_name ?? ''} ${p.description ?? ''}`.toLowerCase().includes(search.toLowerCase()))
  const { rows, page, pageCount, setPage } = usePagination(filtered, 12)
  const totalQty = items.reduce((sum, p) => sum + Number(p.quantity || 0), 0)

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
      <Workspace
        title="Current inventory"
        description={loading ? 'Loading items…' : `${items.length} item types · ${totalQty.toLocaleString()} units on hand`}
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
      >
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <div className="card-grid">
            {Array.from({ length: 8 }, (_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        ) : rows.length ? (
          <div className="card-grid">
            {rows.map((p) => (
              <ItemCard key={p.id} name={p.product_name} quantity={p.quantity} description={p.description} />
            ))}
          </div>
        ) : (
          !error && (
            <EmptyState icon="inventory" title={search ? 'No matching items' : 'No items yet'} text={search ? `Nothing matches “${search}”.` : 'Register the first item to start tracking stock.'}>
              {!search && (
                <Button to={ROUTES.ADMIN.REGISTER_ITEM}>
                  <Icon name="plus" size={17} />
                  Register item
                </Button>
              )}
            </EmptyState>
          )
        )}
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Workspace>
    </>
  )
}
