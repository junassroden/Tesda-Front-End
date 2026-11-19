import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ItemCard from '../../../components/ItemCard/ItemCard.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../../components/Pagination/Pagination.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { LEARNING_CENTER_SUBTITLE } from '../../../constants/navItems.js'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { usePagination } from '../../../hooks/usePagination.js'
import { toList } from '../../../services/api.js'
import { inventoryService } from '../../../services/inventoryService.js'

// Figma: Request Inventory 10
export default function AvailableInventoryPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    inventoryService
      .list()
      .then((data) => setItems(toList(data)))
      .catch((err) => setError(err.message))
  }, [])

  const filtered = items.filter((p) => String(p.product_name ?? '').toLowerCase().includes(search.toLowerCase()))
  const { rows, page, pageCount, setPage } = usePagination(filtered, 12)

  return (
    <>
      <PageHeader title="Request Inventory" subtitle={LEARNING_CENTER_SUBTITLE} search={search} onSearch={setSearch} />
      <Workspace title="Available Inventory">
        {error && <p className="form-error">{error}</p>}
        <div className="card-grid">
          {rows.map((p) => (
            <ItemCard key={p.id} name={p.product_name} quantity={p.quantity} description={p.description} onClick={() => navigate(toPath(ROUTES.CENTER.REQUEST_ITEM, { itemId: p.id }))} />
          ))}
        </div>
        {filtered.length === 0 && !error && <p className="notice">No items available.</p>}
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Workspace>
    </>
  )
}
