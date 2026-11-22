import { useEffect, useRef, useState } from 'react'
import Button from '../../../components/Button/Button.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import DocumentScanner from '../../../components/DocumentScanner/DocumentScanner.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import Modal from '../../../components/Modal/Modal.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../../components/Pagination/Pagination.jsx'
import Tabs from '../../../components/Tabs/Tabs.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { usePagination } from '../../../hooks/usePagination.js'
import { toList } from '../../../services/api.js'
import { documentService } from '../../../services/documentService.js'
import { exportReport } from '../../../utils/exportReport.js'
import { fullDateTime, listTime } from '../../../utils/format.js'

const EXTENSIONS = { word: ['doc', 'docx'], pdf: ['pdf'], excel: ['xls', 'xlsx', 'csv'], image: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tif', 'tiff'] }
const extensionOf = (name = '') => name.split('.').pop().toLowerCase()
const pretty = (label) => (label ? label.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : null)

const baseName = (name = '') => name.replace(/\.[^.]+$/, '')

const UPLOAD_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff,application/pdf,image/jpeg,image/png,image/webp,image/bmp,image/tiff'

const EXPORT_COLUMNS = [
  { key: 'original_name', label: 'Title' },
  { key: 'description', label: 'AI label' },
]

// Figma: Documents Page 7
export default function DocumentsPage() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [selected, setSelected] = useState(() => new Set())
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null) // array of documents
  const [deleting, setDeleting] = useState(false)
  const [renaming, setRenaming] = useState(null) // document being renamed
  const [newName, setNewName] = useState('')
  const [renameError, setRenameError] = useState('')
  const [savingName, setSavingName] = useState(false)
  const fileInputRef = useRef(null)

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

  // Uploads run one at a time: the server reads each file with OCR before answering.
  const uploadFiles = async (files) => {
    setUploading(true)
    setError('')
    const failed = []
    let saved = 0
    for (const [i, file] of files.entries()) {
      setStatus(files.length > 1 ? `Uploading ${i + 1} of ${files.length}: ${file.name}…` : `Uploading ${file.name} and reading its text…`)
      try {
        await documentService.upload(file)
        saved++
      } catch (err) {
        failed.push(`${file.name}: ${err.message}`)
      }
    }
    setUploading(false)
    setStatus(saved ? `${saved} ${saved === 1 ? 'document' : 'documents'} saved to the archive.` : '')
    if (failed.length) setError(failed.join(' '))
    if (saved) setReload((n) => n + 1)
    return { saved, failed }
  }

  const onPickFiles = (event) => {
    const files = [...event.target.files]
    event.target.value = ''
    if (files.length) uploadFiles(files)
  }

  // The scanner keeps its pages open if the upload fails, so it can be retried.
  const saveScan = async (file) => {
    const { failed } = await uploadFiles([file])
    if (failed.length) throw new Error(failed[0])
  }

  const startRename = (d) => {
    setRenaming(d)
    setNewName(baseName(d.original_name))
    setRenameError('')
  }

  const saveRename = async (event) => {
    event.preventDefault()
    if (!renaming || savingName) return
    if (!newName.trim()) {
      setRenameError('Enter a name for the document.')
      return
    }
    setSavingName(true)
    try {
      const { original_name: name } = await documentService.rename(renaming.id, newName.trim())
      setDocuments((list) => list.map((d) => (d.id === renaming.id ? { ...d, original_name: name } : d)))
      setStatus(`Renamed to ${name}.`)
      setRenaming(null)
    } catch (err) {
      setRenameError(err.message)
    } finally {
      setSavingName(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    const removed = []
    const failed = []
    for (const d of pendingDelete) {
      try {
        await documentService.remove(d.id)
        removed.push(d.id)
      } catch (err) {
        failed.push(`${d.original_name}: ${err.message}`)
      }
    }
    setDeleting(false)
    setPendingDelete(null)
    setDocuments((list) => list.filter((d) => !removed.includes(d.id)))
    setSelected((s) => new Set([...s].filter((id) => !removed.includes(id))))
    setStatus(removed.length ? `${removed.length} ${removed.length === 1 ? 'document' : 'documents'} deleted.` : '')
    setError(failed.join(' '))
  }

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
      key: 'when',
      label: 'Uploaded',
      align: 'end',
      render: (d) => {
        const stop = (fn) => (e) => {
          e.stopPropagation()
          fn()
        }
        return (
          <span className="row-when">
            <time className="row-time" dateTime={d.created_at} title={fullDateTime(d.created_at)}>
              {listTime(d.created_at)}
            </time>
            <span className="row-hover-actions">
              <button type="button" className="icon-btn" onClick={stop(() => startRename(d))} aria-label={`Rename ${d.original_name}`} title="Rename">
                <Icon name="edit" size={17} />
              </button>
              <a className="icon-btn" href={documentService.downloadUrl(d.id)} onClick={(e) => e.stopPropagation()} aria-label={`Download ${d.original_name}`} title="Download">
                <Icon name="download" size={17} />
              </a>
              <button type="button" className="icon-btn is-danger" onClick={stop(() => setPendingDelete([d]))} aria-label={`Delete ${d.original_name}`} title="Delete">
                <Icon name="trash" size={17} />
              </button>
            </span>
          </span>
        )
      },
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
        actions={
          <>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Icon name="upload" size={17} />
              Upload file
            </Button>
            <Button onClick={() => setScannerOpen(true)} disabled={uploading}>
              <Icon name="camera" size={17} />
              Scan document
            </Button>
            <input ref={fileInputRef} type="file" accept={UPLOAD_ACCEPT} multiple hidden onChange={onPickFiles} />
          </>
        }
      />
      <Workspace flush>
        <div className="doc-toolbar">
          <input type="checkbox" className="row-check" checked={allOnPage} onChange={toggleAll} aria-label="Select all on this page" />
          <button type="button" className="icon-btn" onClick={() => setReload((n) => n + 1)} aria-label="Refresh list">
            <Icon name="refresh" size={17} />
          </button>
          <span className="notice">{selected.size ? `${selected.size} selected · Export includes only these` : `${filtered.length} of ${documents.length} documents`}</span>
          {selected.size > 0 && (
            <button type="button" className="btn btn-ghost" onClick={() => setPendingDelete(documents.filter((d) => selected.has(d.id)))}>
              <Icon name="trash" size={16} />
              Delete selected
            </button>
          )}
        </div>
        {status && (
          <p className="notice inset" role="status">
            {status}
          </p>
        )}
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
          rowHref={(d) => toPath(ROUTES.ADMIN.DOCUMENT_DETAIL, { id: d.id })}
        />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Workspace>

      <DocumentScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onSave={saveScan} />

      <Modal
        open={!!renaming}
        title="Rename document"
        onClose={() => !savingName && setRenaming(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenaming(null)} disabled={savingName}>
              Cancel
            </Button>
            <Button type="submit" form="rename-form" disabled={savingName}>
              {savingName ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <form id="rename-form" className="rename-form" onSubmit={saveRename}>
          <label htmlFor="rename-input">Name</label>
          <div className="rename-field">
            <input id="rename-input" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={240} autoComplete="off" disabled={savingName} />
            {renaming && <span>.{extensionOf(renaming.original_name)}</span>}
          </div>
          {renameError && (
            <p className="form-error" role="alert">
              {renameError}
            </p>
          )}
        </form>
      </Modal>

      <Modal
        open={!!pendingDelete}
        title={pendingDelete?.length > 1 ? `Delete ${pendingDelete.length} documents?` : 'Delete document?'}
        onClose={() => !deleting && setPendingDelete(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </>
        }
      >
        <p>
          {pendingDelete?.length === 1 ? <strong>{pendingDelete[0].original_name}</strong> : 'The selected documents'} will be removed from the archive with their stored file and OCR text. This cannot be undone.
        </p>
      </Modal>
    </>
  )
}
