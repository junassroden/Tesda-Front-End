import { useEffect, useState } from 'react'
import KpiCard from '../../components/KpiCard/KpiCard.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { toList } from '../../services/api.js'
import { programService } from '../../services/programService.js'

// Figma: Dashboard Page (Learning Center) 08
export default function LCDashboard() {
  const { user } = useAuth()
  const [programs, setPrograms] = useState()

  useEffect(() => {
    programService
      .list()
      .then((data) => setPrograms(toList(data).length))
      .catch(() => {})
  }, [])

  return (
    <>
      <PageHeader title="Dashboard" subtitle={user?.training_center_name ?? 'Learning center overview'} />
      <div className="kpi-grid">
        <KpiCard value={programs} label="Programs" />
        <KpiCard label="Batches" hint="No backend yet" />
        <KpiCard label="Inventory requests" hint="No backend yet" />
        <KpiCard label="Allowance requests" hint="No backend yet" />
      </div>
    </>
  )
}
