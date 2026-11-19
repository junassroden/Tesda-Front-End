import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import ItemCard from '../../../components/ItemCard/ItemCard.jsx'
import KpiCard from '../../../components/KpiCard/KpiCard.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Tabs from '../../../components/Tabs/Tabs.jsx'
import { ROUTES } from '../../../constants/routes.js'
import { inventoryService } from '../../../services/inventoryService.js'
import { exportReport } from '../../../utils/exportReport.js'
import { toList } from '../../../services/api.js'

const TABS = [
  { value: 'inventory', label: 'Current Inventory' },
  { value: 'requests', label: 'Resource Requests' },
]

const EXPORT_COLUMNS = [
  { key: 'product_name', label: 'Item' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'description', label: 'Description' },
]

// Figma: Inventory 14
export default function InventoryPage() {
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
  const totalQty = items.reduce((sum, p) => sum + Number(p.quantity || 0), 0)

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Equipment and supplies"
        search={search}
        onSearch={setSearch}
        actions={<Button to={ROUTES.ADMIN.REGISTER_ITEM}>Register item</Button>}
        onExport={(format) => exportReport(format, { title: 'Inventory', columns: EXPORT_COLUMNS, rows: filtered })}
      />
      <Tabs tabs={TABS} value="inventory" onChange={(tab) => tab === 'requests' && navigate(ROUTES.ADMIN.INVENTORY_REQUESTS)} />
      <div className="kpi-grid">
        <KpiCard value={items.length} label="Item types" />
        <KpiCard value={totalQty} label="Items in stock" />
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="card-grid">
        {filtered.map((p) => (
          <ItemCard key={p.id} name={p.product_name} quantity={p.quantity} description={p.description} />
        ))}
        {filtered.length === 0 && !error && <p>No items yet.</p>}
      </div>
    </>
  )
}
