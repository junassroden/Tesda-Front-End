import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../../../components/EmptyState/EmptyState.jsx'
import ItemCard, { ItemCardSkeleton } from '../../../components/ItemCard/ItemCard.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../../components/Pagination/Pagination.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { usePagination } from '../../../hooks/usePagination.js'
import { toList } from '../../../services/api.js'
import { inventoryService } from '../../../services/inventoryService.js'

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

  const filtered = items.filter((p) => `${p.product_name ?? ''} ${p.description ?? ''}`.toLowerCase().includes(search.toLowerCase()))
  const { rows, page, pageCount, setPage } = usePagination(filtered, 12)

  return (
    <>
      <PageHeader title="Request supplies" subtitle="Pick an item from the main office stock, then say how many you need and who will pick it up." search={search} onSearch={setSearch} searchPlaceholder="Search items" />
      <Workspace title="Available at the main office" description={loading ? 'Loading items…' : `${items.length} items you can request`}>
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
              <ItemCard key={p.id} name={p.product_name} quantity={p.quantity} unit="available" description={p.description} onClick={() => navigate(toPath(ROUTES.CENTER.REQUEST_ITEM, { itemId: p.id }))} />
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
