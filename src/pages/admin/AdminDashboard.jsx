import { useEffect, useState } from 'react'
import KpiCard from '../../components/KpiCard/KpiCard.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import { documentService } from '../../services/documentService.js'
import { inventoryService } from '../../services/inventoryService.js'
import { toList } from '../../services/api.js'

// Figma: Dashboard Page (Admin)18
export default function AdminDashboard() {
  const [counts, setCounts] = useState({})

  useEffect(() => {
    const count = (key, promise) =>
      promise.then((data) => setCounts((c) => ({ ...c, [key]: toList(data).length }))).catch(() => {})
    count('documents', documentService.list())
    count('items', inventoryService.list())
  }, [])

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of TESDA NEXUS" />
      <div className="kpi-grid">
        <KpiCard value={counts.documents} label="Company documents" />
        <KpiCard value={counts.items} label="Inventory items" />
        <KpiCard label="Pending requests" hint="No backend yet" />
        <KpiCard label="Allowance requests" hint="No backend yet" />
      </div>
    </>
  )
}
