import { useState } from 'react'
import { useParams } from 'react-router-dom'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ADMIN_SUBTITLE } from '../../../constants/navItems.js'
import { ROUTES } from '../../../constants/routes.js'
import { exportReport } from '../../../utils/exportReport.js'

// Shown until the allowance endpoint exists.
const SAMPLE = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: 'Student Name', studentId: 'Student ID', account: '0000-000-000', holder: 'Student Name' }))

const EXPORT_COLUMNS = [
  { key: 'name', label: 'Student Name' },
  { key: 'studentId', label: 'Student ID' },
  { key: 'account', label: 'Bank Account' },
  { key: 'holder', label: 'Bank Holder Name' },
]

// Figma: Allowance Tracking 9
export default function AllowanceChecklistPage() {
  const { id } = useParams()
  const [checked, setChecked] = useState({})

  const columns = [
    {
      key: 'check',
      label: 'Checklist',
      render: (s) => (
        <input type="checkbox" className="row-check" checked={!!checked[s.id]} onChange={(e) => setChecked((c) => ({ ...c, [s.id]: e.target.checked }))} aria-label={`Mark ${s.name} as checked`} />
      ),
    },
    ...EXPORT_COLUMNS,
  ]

  return (
    <>
      <PageHeader title="Allowance Tracker" subtitle={ADMIN_SUBTITLE} onExport={(format) => exportReport(format, { title: `Student Batch List ${id}`, columns: EXPORT_COLUMNS, rows: SAMPLE })} />
      <Workspace
        back={ROUTES.ADMIN.ALLOWANCE}
        title="Student Batch List"
        description={`Allowance request #${id}. Tick each student once their bank details and requirements are verified.`}
        sample
        flush
      >
        <DataTable columns={columns} rows={SAMPLE} />
      </Workspace>
    </>
  )
}
