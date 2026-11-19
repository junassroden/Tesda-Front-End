import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../../components/Pagination/Pagination.jsx'
import Tabs from '../../../components/Tabs/Tabs.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ADMIN_SUBTITLE } from '../../../constants/navItems.js'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { usePagination } from '../../../hooks/usePagination.js'
import { toList } from '../../../services/api.js'
import { documentService } from '../../../services/documentService.js'
import { exportReport } from '../../../utils/exportReport.js'

const TABS = [
  { value: 'all', label: 'Documents', icon: true },
  { value: 'word', label: 'Word', icon: true },
  { value: 'pdf', label: 'Pdf', icon: true },
  { value: 'excel', label: 'Excel', icon: true },
]

const EXTENSIONS = { word: ['doc', 'docx'], pdf: ['pdf'], excel: ['xls', 'xlsx', 'csv'] }
const extensionOf = (name = '') => name.split('.').pop().toLowerCase()

const EXPORT_COLUMNS = [
  { key: 'original_name', label: 'Title' },
  { key: 'description', label: 'Description' },
]

// Figma: Documents Page 7
export default function DocumentsPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [selected, setSelected] = useState(() => new Set())
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    documentService
      .list()
      .then((data) => setDocuments(toList(data).map((d) => ({ ...d, description: [d.image_label, d.text_label].filter(Boolean).join(' · ') || 'Description' }))))
      .catch((err) => setError(err.message))
  }, [reload])

  const filtered = documents.filter((d) => {
    const name = String(d.original_name ?? '')
    const inTab = tab === 'all' || EXTENSIONS[tab].includes(extensionOf(name))
    return inTab && name.toLowerCase().includes(search.toLowerCase())
  })
  const { rows, page, pageCount, setPage } = usePagination(filtered, 15)

  const allOnPage = rows.length > 0 && rows.every((d) => selected.has(d.id))
  const toggle = (id) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleAll = () =>
    setSelected((s) => {
      const next = new Set(s)
      rows.forEach((d) => (allOnPage ? next.delete(d.id) : next.add(d.id)))
      return next
    })

  const columns = [
    {
      key: 'check',
      label: 'Select',
      render: (d) => <input type="checkbox" className="row-check" checked={selected.has(d.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggle(d.id)} aria-label={`Select ${d.original_name}`} />,
    },
    { key: 'original_name', label: 'Title' },
    { key: 'description', label: 'Description' },
    {
      key: 'menu',
      label: 'Actions',
      align: 'end',
      render: (d) => (
        <a className="icon-btn" href={documentService.downloadUrl(d.id)} onClick={(e) => e.stopPropagation()} aria-label={`Download ${d.original_name}`}>
          ⋮
        </a>
      ),
    },
  ]

  const exportRows = selected.size ? filtered.filter((d) => selected.has(d.id)) : filtered

  return (
    <>
      <PageHeader
        title="Documents overview"
        subtitle={ADMIN_SUBTITLE}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search Documents"
        onExport={(format) => exportReport(format, { title: 'Documents', columns: EXPORT_COLUMNS, rows: exportRows })}
      />
      <Workspace flush>
        <div className="doc-toolbar">
          <input type="checkbox" checked={allOnPage} onChange={toggleAll} aria-label="Select all on this page" />
          <button type="button" className="icon-btn" onClick={() => setReload((n) => n + 1)} aria-label="Refresh">
            ↻
          </button>
          <span className="notice">{selected.size ? `${selected.size} selected` : ''}</span>
        </div>
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
        {error && <p className="form-error" style={{ margin: '0 16px 12px' }}>{error}</p>}
        <DataTable columns={columns} rows={rows} showHeader={false} emptyText="No documents yet." onRowClick={(d) => navigate(toPath(ROUTES.ADMIN.DOCUMENT_DETAIL, { id: d.id }))} />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Workspace>
    </>
  )
}
