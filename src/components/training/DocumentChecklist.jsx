import { useState } from 'react'
import Button from '../Button/Button.jsx'
import StatusBadge from '../DataTable/StatusBadge.jsx'
import Icon from '../Icon/Icon.jsx'
import Modal from '../Modal/Modal.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import LedgerBadge from '../ledger/LedgerBadge.jsx'
import FilePicker from './FilePicker.jsx'
import { documentFiles } from '../../services/trainingService.js'
import { shortDate } from '../../utils/format.js'
import { fileSize } from '../../utils/training.js'

const ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp'

/**
 * The enrollment document checklist.
 *   mode 'student': upload, replace rejected copies, withdraw unreviewed copies.
 *   mode 'admin':   the same uploads (at the counter) plus start review, verify and reject.
 * Handlers return promises that resolve with the refreshed { documents, summary }.
 */
export default function DocumentChecklist({ documents, mode = 'student', readOnly = false, onUpload, onRemoveFile, onReview }) {
  const [uploadFor, setUploadFor] = useState(null)
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [rejecting, setRejecting] = useState(null)
  const [rowBusy, setRowBusy] = useState(null)
  const [rowError, setRowError] = useState({})
  const admin = mode === 'admin'

  const openUpload = (doc) => {
    setUploadFor(doc)
    setFiles([])
    setError('')
  }

  const room = (doc) => (doc.status === 'rejected' ? doc.required_copies : Math.max(0, doc.required_copies - doc.uploaded_copies))

  const upload = async (event) => {
    event.preventDefault()
    if (!files.length) return setError('Choose at least one file.')
    setBusy(true)
    setError('')
    try {
      await onUpload(uploadFor.requirement_type_id, files)
      setUploadFor(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const act = async (doc, fn) => {
    setRowBusy(doc.requirement_type_id)
    setRowError((e) => ({ ...e, [doc.requirement_type_id]: '' }))
    try {
      await fn()
    } catch (err) {
      setRowError((e) => ({ ...e, [doc.requirement_type_id]: err.message }))
    } finally {
      setRowBusy(null)
    }
  }

  return (
    <>
      <ul className="doc-checklist">
        {documents.map((doc) => {
          const locked = doc.status === 'verified' || doc.status === 'under_review'
          const canUpload = !readOnly && doc.applies && !locked && room(doc) > 0
          const working = rowBusy === doc.requirement_type_id
          return (
            <li key={doc.requirement_type_id} className={doc.applies ? 'doc-item' : 'doc-item is-na'}>
              <div className="doc-main">
                <div className="doc-title">
                  <strong>{doc.name}</strong>
                  {doc.applies ? <StatusBadge status={doc.status} /> : <span className="tag">Not required</span>}
                  <LedgerBadge ledger={doc.ledger} />
                </div>
                <p className="doc-desc">
                  {doc.applies ? doc.description : 'Only needed when the civil status is married.'}
                </p>
                {doc.applies && (
                  <dl className="doc-facts">
                    <div>
                      <dt>Copies</dt>
                      <dd className="num">
                        {doc.uploaded_copies} of {doc.required_copies}
                      </dd>
                    </div>
                    <div>
                      <dt>Submitted</dt>
                      <dd>{doc.submitted_at ? shortDate(doc.submitted_at) : '—'}</dd>
                    </div>
                    {doc.verified_at && (
                      <div>
                        <dt>Verified</dt>
                        <dd>
                          {shortDate(doc.verified_at)}
                          {doc.verified_by_name ? ` · ${doc.verified_by_name}` : ''}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
                {doc.remarks && (
                  <p className={doc.status === 'rejected' ? 'doc-remarks is-rejected' : 'doc-remarks'}>
                    <Icon name="alert" size={14} />
                    <span>
                      <strong>Remarks:</strong> {doc.remarks}
                    </span>
                  </p>
                )}
                {doc.files.length > 0 && (
                  <ul className="doc-files">
                    {doc.files.map((f) => (
                      <li key={f.id}>
                        <Icon name={f.mime_type?.startsWith('image/') ? 'image' : 'documents'} size={15} />
                        <a href={documentFiles.url(f.id)} target="_blank" rel="noreferrer" className="truncate" title={f.original_name}>
                          {f.original_name}
                        </a>
                        <small className="num">
                          {fileSize(f.file_size)} · {shortDate(f.uploaded_at)}
                        </small>
                        <a className="icon-btn" href={documentFiles.downloadUrl(f.id)} aria-label={`Download ${f.original_name}`} title="Download">
                          <Icon name="download" size={14} />
                        </a>
                        {!readOnly && !locked && doc.status !== 'rejected' && onRemoveFile && (
                          <button type="button" className="icon-btn" aria-label={`Remove ${f.original_name}`} title="Remove this copy" disabled={working} onClick={() => act(doc, () => onRemoveFile(f.id))}>
                            <Icon name="trash" size={14} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {rowError[doc.requirement_type_id] && (
                  <p className="form-error" role="alert">
                    {rowError[doc.requirement_type_id]}
                  </p>
                )}
              </div>

              {doc.applies && !readOnly && (
                <div className="doc-actions">
                  {canUpload && (
                    <Button variant={doc.status === 'rejected' || doc.status === 'not_submitted' ? 'primary' : 'secondary'} onClick={() => openUpload(doc)} disabled={working}>
                      <Icon name="upload" size={16} />
                      {doc.status === 'rejected' ? 'Replace' : doc.uploaded_copies ? 'Add copy' : 'Upload'}
                    </Button>
                  )}
                  {admin && doc.status === 'submitted' && (
                    <Button variant="secondary" disabled={working} onClick={() => act(doc, () => onReview(doc.document_id, 'under_review'))}>
                      Start review
                    </Button>
                  )}
                  {admin && (doc.status === 'submitted' || doc.status === 'under_review') && (
                    <Button disabled={working || doc.uploaded_copies < doc.required_copies} title={doc.uploaded_copies < doc.required_copies ? 'All required copies must be uploaded first' : undefined} onClick={() => act(doc, () => onReview(doc.document_id, 'verified'))}>
                      <Icon name="check" size={16} />
                      Verify
                    </Button>
                  )}
                  {admin && ['submitted', 'under_review', 'verified'].includes(doc.status) && (
                    <Button variant="ghost" disabled={working} onClick={() => setRejecting(doc)}>
                      {doc.status === 'verified' ? 'Reopen' : 'Reject'}
                    </Button>
                  )}
                  {!admin && doc.status === 'under_review' && <span className="muted">Being reviewed</span>}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <Modal
        open={Boolean(uploadFor)}
        title={uploadFor ? `${uploadFor.status === 'rejected' ? 'Replace' : 'Upload'} ${uploadFor.name}` : 'Upload'}
        onClose={() => !busy && setUploadFor(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setUploadFor(null)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" form="doc-upload-form" disabled={busy || !files.length}>
              {busy ? 'Uploading…' : 'Upload'}
            </Button>
          </>
        }
      >
        {uploadFor && (
          <form id="doc-upload-form" className="form-fields" onSubmit={upload}>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <p className="confirm-message">
              {uploadFor.status === 'rejected'
                ? `Upload ${uploadFor.required_copies} new ${uploadFor.required_copies === 1 ? 'copy' : 'copies'}. The rejected copies are kept on record but replaced.`
                : `${uploadFor.required_copies} ${uploadFor.required_copies === 1 ? 'copy is' : 'copies are'} required; ${uploadFor.uploaded_copies} uploaded. Scan or photograph each copy as its own file.`}
            </p>
            <FilePicker id="doc-files" files={files} onChange={setFiles} accept={ACCEPT} max={room(uploadFor)} hint="PDF, JPG, PNG or WebP, up to 10 MB each." />
          </form>
        )}
      </Modal>

      {rejecting && (
        <ConfirmDialog
          key={rejecting.requirement_type_id}
          open
          title={rejecting.status === 'verified' ? `Reopen ${rejecting.name}` : `Reject ${rejecting.name}`}
          message={
            rejecting.status === 'verified'
              ? 'The document goes back to the student as rejected so a new copy can be uploaded. The verification stays in its history.'
              : 'The student is notified and can upload replacement copies.'
          }
          confirmLabel={rejecting.status === 'verified' ? 'Reopen' : 'Reject'}
          variant="danger"
          reason={{ label: 'Remarks for the student', required: true, placeholder: 'e.g. The photo is blurry. Upload a clear scan of both sides.' }}
          onClose={() => setRejecting(null)}
          onConfirm={async ({ reason }) => {
            await onReview(rejecting.document_id, 'rejected', reason)
            setRejecting(null)
          }}
        />
      )}
    </>
  )
}
