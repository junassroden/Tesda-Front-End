import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import KpiCard from '../../../components/KpiCard/KpiCard.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../../components/Pagination/Pagination.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { usePagination } from '../../../hooks/usePagination.js'
import { documentService } from '../../../services/documentService.js'
import { exportReport } from '../../../utils/exportReport.js'
import { toList } from '../../../services/api.js'

const COLUMNS = [
  { key: 'original_name', label: 'Document' },
  { key: 'image_label', label: 'Type' },
  { key: 'text_label', label: 'Category' },
]

// Figma: Documents Page 7
export default function DocumentsPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    documentService
      .list()
      .then((data) => setDocuments(toList(data)))
      .catch((err) => setError(err.message))
  }, [])

  const filtered = documents.filter((d) => String(d.original_name ?? '').toLowerCase().includes(search.toLowerCase()))
  const { rows, page, pageCount, setPage } = usePagination(filtered)

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle="Company documents archive"
        search={search}
        onSearch={setSearch}
        onExport={(format) => exportReport(format, { title: 'Documents', columns: COLUMNS, rows: filtered })}
      />
      <div className="kpi-grid">
        <KpiCard value={documents.length} label="Company documents" />
      </div>
      {error && <p className="form-error">{error}</p>}
      <DataTable title="List of Documents" columns={COLUMNS} rows={rows} onRowClick={(d) => navigate(toPath(ROUTES.ADMIN.DOCUMENT_DETAIL, { id: d.id }))} />
      <Pagination page={page} pageCount={pageCount} onChange={setPage} />
    </>
  )
}
