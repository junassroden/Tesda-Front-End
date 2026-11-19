import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../../components/Pagination/Pagination.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { usePagination } from '../../../hooks/usePagination.js'
import { toList } from '../../../services/api.js'
import { programService } from '../../../services/programService.js'
import { exportReport } from '../../../utils/exportReport.js'

const COLUMNS = [
  { key: 'course_code', label: 'Code' },
  { key: 'course_name', label: 'Program' },
  { key: 'qualification', label: 'Qualification' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'status', label: 'Status', render: (r) => (r.status ? <StatusBadge status={r.status} /> : '—') },
]

// Figma: Student List 3
export default function ProgramListPage() {
  const navigate = useNavigate()
  const [programs, setPrograms] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    programService
      .list()
      .then((data) => setPrograms(toList(data)))
      .catch((err) => setError(err.message))
  }, [])

  const filtered = programs.filter((p) => String(p.course_name ?? '').toLowerCase().includes(search.toLowerCase()))
  const { rows, page, pageCount, setPage } = usePagination(filtered)

  return (
    <>
      <PageHeader
        title="Programs"
        subtitle="Programs offered by this learning center"
        search={search}
        onSearch={setSearch}
        actions={<Button to={ROUTES.CENTER.REGISTER_PROGRAM}>Register program</Button>}
        onExport={(format) => exportReport(format, { title: 'List of Programs', columns: COLUMNS.slice(0, 4), rows: filtered })}
      />
      {error && <p className="form-error">{error}</p>}
      <DataTable title="List of Programs" columns={COLUMNS} rows={rows} onRowClick={(p) => navigate(toPath(ROUTES.CENTER.BATCHES, { programId: p.id }))} />
      <Pagination page={page} pageCount={pageCount} onChange={setPage} />
    </>
  )
}
