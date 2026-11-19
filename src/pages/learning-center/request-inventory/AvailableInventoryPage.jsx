import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ItemCard from '../../../components/ItemCard/ItemCard.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
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

  return (
    <>
      <PageHeader title="Request Inventory" subtitle="Available items. Pick one to request it." search={search} onSearch={setSearch} />
      {error && <p className="form-error">{error}</p>}
      <div className="card-grid">
        {filtered.map((p) => (
          <ItemCard key={p.id} name={p.product_name} quantity={p.quantity} description={p.description} onClick={() => navigate(toPath(ROUTES.CENTER.REQUEST_ITEM, { itemId: p.id }))} />
        ))}
        {filtered.length === 0 && !error && <p>No items available.</p>}
      </div>
    </>
  )
}
