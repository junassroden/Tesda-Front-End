import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Tabs from '../../../components/Tabs/Tabs.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { inventoryService } from '../../../services/inventoryService.js'
import { exportReport } from '../../../utils/exportReport.js'

const TABS = [
  { value: 'inventory', label: 'Current Inventory' },
  { value: 'requests', label: 'Resource Requests' },
]

const COLUMNS = [
  { key: 'center', label: 'Learning center' },
  { key: 'item', label: 'Item' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

// Figma: Inventory Request 13
export default function InventoryRequestsPage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    inventoryService
      .requests()
      .then(setRequests)
      .catch((err) => setError(err.message))
  }, [])

  return (
    <>
      <PageHeader title="Inventory" subtitle="Resource requests from learning centers" onExport={(format) => exportReport(format, { title: 'Inventory Requests', columns: COLUMNS, rows: requests })} />
      <Tabs tabs={TABS} value="requests" onChange={(tab) => tab === 'inventory' && navigate(ROUTES.ADMIN.INVENTORY)} />
      {error && <p className="notice">{error}</p>}
      <DataTable title="List of Request" columns={COLUMNS} rows={requests} onRowClick={(r) => navigate(toPath(ROUTES.ADMIN.INVENTORY_REQUEST_DETAIL, { id: r.id }))} />
    </>
  )
}
