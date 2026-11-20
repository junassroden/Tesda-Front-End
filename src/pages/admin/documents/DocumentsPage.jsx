import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../../components/Pagination/Pagination.jsx'
import Tabs from '../../../components/Tabs/Tabs.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { usePagination } from '../../../hooks/usePagination.js'
import { toList } from '../../../services/api.js'
import { documentService } from '../../../services/documentService.js'
import { exportReport } from '../../../utils/exportReport.js'

const EXTENSIONS = { word: ['doc', 'docx'], pdf: ['pdf'], excel: ['xls', 'xlsx', 'csv'], image: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tif', 'tiff'] }
const extensionOf = (name = '') => name.split('.').pop().toLowerCase()
const pretty = (label) => (label ? label.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : null)

const EXPORT_COLUMNS = [
  { key: 'original_name', label: 'Title' },
  { key: 'description', label: 'AI label' },
]

// Figma: Documents Page 7
export default function DocumentsPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [selected, setSelected] = useState(() => new Set())
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    documentService
      .list()
      .then((data) => {
        setDocuments(toList(data).map((d) => ({ ...d, description: pretty(d.text_label || d.image_label) || 'Not classified' })))
        setError('')
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [reload])

  const inTab = (d, key) => key === 'all' || EXTENSIONS[key].includes(extensionOf(d.original_name))
  const term = search.toLowerCase()
  const filtered = documents.filter((d) => inTab(d, tab) && `${d.original_name} ${d.description} ${d.ocr_text ?? ''}`.toLowerCase().includes(term))
  const { rows, page, pageCount, setPage } = usePagination(filtered, 12)

  const tabs = [
    { value: 'all', label: 'All documents' },
    { value: 'pdf', label: 'PDF' },
    { value: 'image', label: 'Scans' },
    { value: 'word', label: 'Word' },
    { value: 'excel', label: 'Excel' },
  ].map((t) => ({ ...t, count: documents.filter((d) => inTab(d, t.value)).length }))

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
    {
      key: 'original_name',
      label: 'Document',
      render: (d) => (
        <span className="doc-name">
          <span className="row-icon">
            <Icon name="documents" size={17} />
          </span>
          <span>
            {d.original_name}
            <small>{extensionOf(d.original_name).toUpperCase()}</small>
          </span>
        </span>
      ),
    },
    { key: 'description', label: 'AI label', render: (d) => <span className="muted">{d.description}</span> },
    {
      key: 'download',
      label: 'Download',
      align: 'end',
      render: (d) => (
        <a className="icon-btn" href={documentService.downloadUrl(d.id)} onClick={(e) => e.stopPropagation()} aria-label={`Download ${d.original_name}`}>
          <Icon name="download" size={17} />
        </a>
      ),
    },
  ]

  const exportRows = selected.size ? filtered.filter((d) => selected.has(d.id)) : filtered

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle="Official records of the main office. Search matches file names, AI labels, and the text read from each scan."
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search titles or text inside"
        onExport={(format) => exportReport(format, { title: 'Documents', columns: EXPORT_COLUMNS, rows: exportRows })}
      />
      <Workspace flush>
        <div className="doc-toolbar">
          <input type="checkbox" className="row-check" checked={allOnPage} onChange={toggleAll} aria-label="Select all on this page" />
          <button type="button" className="icon-btn" onClick={() => setReload((n) => n + 1)} aria-label="Refresh list">
            <Icon name="refresh" size={17} />
          </button>
          <span className="notice">{selected.size ? `${selected.size} selected · Export includes only these` : `${filtered.length} of ${documents.length} documents`}</span>
        </div>
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        {error && (
          <p className="form-error inset" role="alert">
            {error}
          </p>
        )}
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          showHeader={false}
          empty={search ? { icon: 'search', title: 'No matches', text: `Nothing in the archive matches “${search}”.` } : { icon: 'documents', title: 'No documents yet', text: 'Uploaded records show up here with their OCR text and AI label.' }}
          onRowClick={(d) => navigate(toPath(ROUTES.ADMIN.DOCUMENT_DETAIL, { id: d.id }))}
        />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Workspace>
    </>
  )
}
