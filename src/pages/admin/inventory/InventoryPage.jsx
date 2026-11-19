import { useEffect, useState } from 'react'
import Button from '../../../components/Button/Button.jsx'
import ItemCard from '../../../components/ItemCard/ItemCard.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../../components/Pagination/Pagination.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ADMIN_SUBTITLE } from '../../../constants/navItems.js'
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
      <PageHeader
        title="Inventory Tracker"
        subtitle={ADMIN_SUBTITLE}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search items"
        onExport={(format) => exportReport(format, { title: 'Inventory', columns: EXPORT_COLUMNS, rows: filtered })}
      />
      <Workspace
        title="Current Inventory"
        actions={
          <>
            <Button className="btn-lg" to={ROUTES.ADMIN.REGISTER_ITEM}>
              Register Item
            </Button>
            <Button className="btn-lg" to={ROUTES.ADMIN.INVENTORY_REQUESTS}>
              Resource Requests
            </Button>
          </>
        }
      >
        {error && <p className="form-error">{error}</p>}
        <div className="card-grid">
          {rows.map((p) => (
            <ItemCard key={p.id} name={p.product_name} quantity={p.quantity} description={p.description} onMenu={() => {}} />
          ))}
        </div>
        {filtered.length === 0 && !error && <p className="notice">No items yet. Use “Register Item” to add one.</p>}
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Workspace>
    </>
  )
}
