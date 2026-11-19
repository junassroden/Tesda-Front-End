import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ADMIN_SUBTITLE } from '../../../constants/navItems.js'
import { ROUTES } from '../../../constants/routes.js'
import { toList } from '../../../services/api.js'
import { documentService } from '../../../services/documentService.js'

// Figma: Document Page15
export default function DocumentDetailPage() {
  const { id } = useParams()
  const [document, setDocument] = useState(null)

  // No single-document endpoint yet, so look it up in the list.
  useEffect(() => {
    documentService
      .list()
      .then((data) => setDocument(toList(data).find((d) => String(d.id) === id) ?? false))
      .catch(() => setDocument(false))
  }, [id])

  const share = () => navigator.clipboard?.writeText(window.location.href)

  const actions = (
    <>
      <button type="button" className="icon-btn" onClick={share} aria-label="Copy link">
        ⤴
      </button>
      <a className="icon-btn" href={documentService.downloadUrl(id)} aria-label="Download">
        ⋮
      </a>
    </>
  )

  return (
    <>
      <PageHeader title="Documents overview" subtitle={ADMIN_SUBTITLE} />
      <Workspace back={ROUTES.ADMIN.DOCUMENTS} actions={actions} flush>
        <div className="detail-head">
          <div>
            <h2>{document ? document.original_name : document === false ? 'Document not found' : 'Loading…'}</h2>
            <p>{document ? [document.image_label, document.text_label].filter(Boolean).join(' · ') || 'No description yet.' : ''}</p>
          </div>
        </div>
        {document?.ocr_text ? (
          <pre className="doc-preview card" style={{ whiteSpace: 'pre-wrap', overflow: 'auto' }}>
            {document.ocr_text}
          </pre>
        ) : (
          <div className="ph doc-preview" role="img" aria-label="Document preview placeholder" />
        )}
      </Workspace>
    </>
  )
}
