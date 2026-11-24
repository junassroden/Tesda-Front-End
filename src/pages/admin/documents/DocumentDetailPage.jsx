import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import DocumentViewer from '../../../components/DocumentViewer/DocumentViewer.jsx'
import LedgerBadge from '../../../components/ledger/LedgerBadge.jsx'
import EmptyState, { ErrorState } from '../../../components/EmptyState/EmptyState.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import Modal from '../../../components/Modal/Modal.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES } from '../../../constants/routes.js'
import { toList } from '../../../services/api.js'
import { documentService } from '../../../services/documentService.js'

// Types the browser can draw (TIFF cannot), matching the backend's inline list.
const VIEWABLE = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/bmp']

const pretty = (label) => (label ? label.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : '—')

// Figma: Document Page15
export default function DocumentDetailPage() {
  const { id } = useParams()
  const [document, setDocument] = useState(null) // object | false (not found) | undefined (failed)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const navigate = useNavigate()

  const remove = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await documentService.remove(id)
      navigate(ROUTES.ADMIN.DOCUMENTS, { replace: true })
    } catch (err) {
      setDeleteError(err.message)
      setDeleting(false)
    }
  }

  // No single-document endpoint yet, so look it up in the list.
  useEffect(() => {
    documentService
      .list()
      .then((data) => setDocument(toList(data).find((d) => String(d.id) === id) ?? false))
      .catch((err) => {
        setLoadError(err?.message || 'Something went wrong.')
        setDocument(undefined)
      })
  }, [id, attempt])

  const retry = () => {
    setLoadError('')
    setDocument(null)
    setAttempt((n) => n + 1)
  }

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const actions = (
    <>
      <button type="button" className="btn btn-secondary" onClick={() => setConfirming(true)}>
        <Icon name="trash" size={17} />
        Delete
      </button>
      <button type="button" className="btn btn-secondary" onClick={share}>
        <Icon name={copied ? 'check' : 'share'} size={17} />
        {copied ? 'Link copied' : 'Copy link'}
      </button>
      <a className="btn btn-primary" href={documentService.downloadUrl(id)}>
        <Icon name="download" size={17} />
        Download
      </a>
    </>
  )

  return (
    <>
      <PageHeader title="Documents" subtitle="Official records of the main office." />
      <Workspace
        back={ROUTES.ADMIN.DOCUMENTS}
        backLabel="All documents"
        description={document ? <LedgerBadge ledger={document.ledger} entity={{ type: 'document', id: document.id }} showNone /> : null}
        actions={document ? actions : null}
        flush
      >
        {document === null && (
          <div className="detail-head" aria-hidden="true">
            <div className="skeleton-stack" style={{ width: '50%' }}>
              <span className="skeleton" style={{ height: 30, width: '80%' }} />
              <span className="skeleton skeleton-line short" />
            </div>
          </div>
        )}

        {document === undefined && loadError && <ErrorState what="this document" message={loadError} onRetry={retry} />}

        {document === false && <EmptyState icon="documents" title="Document not found" text="It may have been removed, or the link is incomplete." />}

        {document && (
          <>
            <div className="detail-head">
              <div>
                <h2>{document.original_name}</h2>
                <p>Read with OCR and classified by the document AI when it was uploaded.</p>
              </div>
            </div>
            <dl className="meta-grid">
              <div>
                <dt>Image model label</dt>
                <dd>{pretty(document.image_label)}</dd>
              </div>
              <div>
                <dt>Text model label</dt>
                <dd>{pretty(document.text_label)}</dd>
              </div>
              <div>
                <dt>File type</dt>
                <dd>{document.mime_type || '—'}</dd>
              </div>
              <div>
                <dt>Size</dt>
                <dd className="num">{document.file_size ? `${(document.file_size / 1024).toFixed(1)} KB` : '—'}</dd>
              </div>
            </dl>
            {VIEWABLE.includes(document.mime_type) ? (
              <DocumentViewer key={document.id} url={documentService.viewUrl(document.id)} downloadUrl={documentService.downloadUrl(document.id)} mimeType={document.mime_type} name={document.original_name} />
            ) : (
              <EmptyState icon="documents" title="Preview not available" text="This browser cannot show this file type. Download it to view the original." />
            )}
            <h3 className="doc-section-title">Text read by OCR</h3>
            {document.ocr_text ? (
              <pre className="doc-preview">{document.ocr_text}</pre>
            ) : (
              <p className="doc-ocr-empty">{document.ocr_error || 'No text could be read from this file. The preview above shows the original.'}</p>
            )}
          </>
        )}
      </Workspace>

      <Modal
        open={confirming}
        title="Delete document?"
        onClose={() => !deleting && setConfirming(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={remove} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </>
        }
      >
        <p>
          <strong>{document?.original_name}</strong> will be removed from the archive with its stored file and OCR text. This cannot be undone.
        </p>
        {deleteError && (
          <p className="form-error" role="alert">
            {deleteError}
          </p>
        )}
      </Modal>
    </>
  )
}
