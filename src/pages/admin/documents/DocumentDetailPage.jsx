import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumb from '../../../components/Breadcrumb/Breadcrumb.jsx'
import Button from '../../../components/Button/Button.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import { ROUTES } from '../../../constants/routes.js'
import { documentService } from '../../../services/documentService.js'
import { toList } from '../../../services/api.js'

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

  const name = document?.original_name ?? `Document #${id}`

  return (
    <>
      <Breadcrumb items={[{ label: 'Documents', to: ROUTES.ADMIN.DOCUMENTS }, { label: name }]} />
      <PageHeader title={name} actions={<Button onClick={() => window.open(documentService.downloadUrl(id))}>Download</Button>} />
      {document === null && <p>Loading…</p>}
      {document === false && <p>This document was not found.</p>}
      {document && (
        <section className="panel">
          <h2>Description</h2>
          <dl className="details">
            <dt>Type</dt>
            <dd>{document.image_label || '—'}</dd>
            <dt>Category</dt>
            <dd>{document.text_label || '—'}</dd>
          </dl>
          {document.ocr_text && <pre className="ocr-text">{document.ocr_text}</pre>}
        </section>
      )}
    </>
  )
}
