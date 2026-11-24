import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../../../components/EmptyState/EmptyState.jsx'
import InventoryCard, { InventoryCardSkeleton } from '../../../components/InventoryCard/InventoryCard.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../../components/Pagination/Pagination.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES } from '../../../constants/routes.js'
import { usePagination } from '../../../hooks/usePagination.js'
import { toList } from '../../../services/api.js'
import { inventoryService } from '../../../services/inventoryService.js'
import { CATEGORY_LABELS, qtyOf } from '../../../utils/inventory.js'

// Figma: Request Inventory 10
export default function AvailableInventoryPage() {
  const navigate = useNavigate()
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

  const filtered = items
    .filter((p) => `${p.product_name ?? ''} ${p.description ?? ''} ${CATEGORY_LABELS[p.category] ?? ''}`.toLowerCase().includes(search.toLowerCase()))
    // Items that can be requested first; out-of-stock ones last.
    .sort((a, b) => Number(qtyOf(b) > 0) - Number(qtyOf(a) > 0) || String(a.product_name).localeCompare(String(b.product_name)))
  const { rows, page, pageCount, setPage } = usePagination(filtered, 12)

  return (
    <>
      <PageHeader title="Main office stock" subtitle="What the main office has on hand. Open an item to start an inventory request with it." search={search} onSearch={setSearch} searchPlaceholder="Search items" />
      <Workspace title="Available at the main office" description={loading ? 'Loading items…' : `${items.filter((p) => qtyOf(p) > 0).length} of ${items.length} items in stock`}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
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
                meta={qtyOf(p) > 0 ? `${qtyOf(p).toLocaleString()} ${p.unit || 'pc'} available` : 'None available right now'}
                onOpen={() => navigate(`${ROUTES.CENTER.NEW_INVENTORY_REQUEST}?item=${p.id}`)}
              />
            ))}
          </div>
        ) : (
          !error && <EmptyState icon="inventory" title={search ? 'No matching items' : 'Nothing available right now'} text={search ? `Nothing matches “${search}”.` : 'The main office has no items listed yet.'} />
        )}
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Workspace>
    </>
  )
}
