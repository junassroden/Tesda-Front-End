import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import EmptyState from '../../../components/EmptyState/EmptyState.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES } from '../../../constants/routes.js'
import { toList } from '../../../services/api.js'
import { documentService } from '../../../services/documentService.js'

const pretty = (label) => (label ? label.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : '—')

// Figma: Document Page15
export default function DocumentDetailPage() {
  const { id } = useParams()
  const [document, setDocument] = useState(null)
  const [copied, setCopied] = useState(false)

  // No single-document endpoint yet, so look it up in the list.
  useEffect(() => {
    documentService
      .list()
      .then((data) => setDocument(toList(data).find((d) => String(d.id) === id) ?? false))
      .catch(() => setDocument(false))
  }, [id])

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
      <Workspace back={ROUTES.ADMIN.DOCUMENTS} backLabel="All documents" actions={document ? actions : null} flush>
        {document === null && (
          <div className="detail-head" aria-hidden="true">
            <div className="skeleton-stack" style={{ width: '50%' }}>
              <span className="skeleton" style={{ height: 30, width: '80%' }} />
              <span className="skeleton skeleton-line short" />
            </div>
          </div>
        )}

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
            {document.ocr_text ? (
              <pre className="doc-preview">{document.ocr_text}</pre>
            ) : (
              <EmptyState icon="documents" title="No text found" text={document.ocr_error || 'OCR could not read text from this file. Download it to view the original.'} />
            )}
          </>
        )}
      </Workspace>
    </>
  )
}
