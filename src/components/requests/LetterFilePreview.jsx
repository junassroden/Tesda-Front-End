import { useEffect, useState } from 'react'
import DocumentViewer from '../DocumentViewer/DocumentViewer.jsx'
import Icon from '../Icon/Icon.jsx'
import { fileSize } from '../../utils/training.js'

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/** Keeps only safe markup from a converted Word document (no scripts, handlers or javascript: links). */
function sanitize(html) {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  doc.querySelectorAll('script, style, iframe, object, embed, link, meta, form').forEach((el) => el.remove())
  doc.querySelectorAll('*').forEach((el) => {
    ;[...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim().toLowerCase()
      if (name.startsWith('on') || name === 'style') el.removeAttribute(attr.name)
      if ((name === 'href' || name === 'src') && !(value.startsWith('http:') || value.startsWith('https:') || value.startsWith('#') || (name === 'src' && value.startsWith('data:image/')))) {
        el.removeAttribute(attr.name)
      }
    })
    if (el.tagName === 'A') {
      el.setAttribute('target', '_blank')
      el.setAttribute('rel', 'noreferrer noopener')
    }
  })
  return doc.body.firstElementChild.innerHTML
}

/** DOCX shown as formatted text (converted in the browser with mammoth). */
function DocxPreview({ url }) {
  const [html, setHtml] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let cancelled = false
    Promise.all([import('mammoth'), fetch(url, { credentials: 'include' })])
      .then(async ([mammoth, response]) => {
        if (!response.ok) throw new Error('The letter could not be loaded.')
        const result = await mammoth.convertToHtml({ arrayBuffer: await response.arrayBuffer() })
        if (!cancelled) setHtml(sanitize(result.value))
      })
      .catch(() => !cancelled && setError('This DOCX could not be previewed. Download it to read it.'))
    return () => {
      cancelled = true
    }
  }, [url])
  if (error) return <p className="muted pad-box">{error}</p>
  if (html === null) return <p className="muted pad-box">Preparing the preview…</p>
  return <div className="docx-preview" dangerouslySetInnerHTML={{ __html: html || '<p>The document is empty.</p>' }} />
}

/** Preview of an uploaded request letter: PDF in the document viewer, DOCX as text, DOC download only. */
export default function LetterFilePreview({ file, url, downloadUrl }) {
  return (
    <div className="letter-file">
      <div className="letter-file-head">
        <Icon name="documents" size={16} />
        <span className="truncate" title={file.original_name}>
          {file.original_name}
        </span>
        <small className="num">{fileSize(file.file_size)}</small>
        <a className="btn btn-secondary" href={downloadUrl}>
          <Icon name="download" size={15} />
          Download
        </a>
      </div>
      {file.mime_type === 'application/pdf' ? (
        <div className="letter-pdf">
          <DocumentViewer url={url} downloadUrl={downloadUrl} mimeType={file.mime_type} name={file.original_name} />
        </div>
      ) : file.mime_type === DOCX ? (
        <DocxPreview url={url} />
      ) : (
        <p className="muted pad-box">Older Word (.doc) files cannot be previewed in the browser. Download the letter to read it.</p>
      )}
    </div>
  )
}
