import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../../components/Pagination/Pagination.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { LEARNING_CENTER_SUBTITLE } from '../../../constants/navItems.js'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { usePagination } from '../../../hooks/usePagination.js'
import { toList } from '../../../services/api.js'
import { programService } from '../../../services/programService.js'
import { exportReport } from '../../../utils/exportReport.js'

const COLUMNS = [
  { key: 'course_code', label: 'Program Code' },
  { key: 'course_name', label: 'Program Name' },
  { key: 'batch_count', label: 'Batch Count', render: (p) => `Batch ${String(p.batch_count ?? 0).padStart(2, '0')}` },
  { key: 'status', label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
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

  const filtered = programs.filter((p) => `${p.course_code ?? ''} ${p.course_name ?? ''}`.toLowerCase().includes(search.toLowerCase()))
  const { rows, page, pageCount, setPage } = usePagination(filtered, 10)

  return (
    <>
      <PageHeader
        title="Program Lists"
        subtitle={LEARNING_CENTER_SUBTITLE}
        search={search}
        onSearch={setSearch}
        onExport={(format) => exportReport(format, { title: 'List of Programs', columns: COLUMNS.slice(0, 2), rows: filtered })}
      />
      <Workspace
        title="List of Programs"
        actions={
          <Button className="btn-lg" to={ROUTES.CENTER.REGISTER_PROGRAM}>
            Add Program
          </Button>
        }
        flush
      >
        {error && <p className="form-error" style={{ margin: '0 16px 12px' }}>{error}</p>}
        <DataTable columns={COLUMNS} rows={rows} emptyText="No programs yet. Use “Add Program” to register one." onRowClick={(p) => navigate(toPath(ROUTES.CENTER.BATCHES, { programId: p.id }))} />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Workspace>
    </>
  )
}
