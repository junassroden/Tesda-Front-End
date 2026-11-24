import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import { ErrorState } from '../../../components/EmptyState/EmptyState.jsx'
import TextArea from '../../../components/form/TextArea.jsx'
import TextInput from '../../../components/form/TextInput.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import Modal from '../../../components/Modal/Modal.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import LetterDocument from '../../../components/requests/LetterDocument.jsx'
import LetterFilePreview from '../../../components/requests/LetterFilePreview.jsx'
import PhotoGallery from '../../../components/requests/PhotoGallery.jsx'
import ConfirmDialog from '../../../components/training/ConfirmDialog.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { toList } from '../../../services/api.js'
import { inventoryService } from '../../../services/inventoryService.js'
import { requestService } from '../../../services/requestService.js'

const LETTER_ACCEPT = '.pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword'
const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
const MAX_PHOTOS = 10
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const BODY_TEMPLATE =
  'Dear Sir/Madam:\n\nGreetings!\n\nThe [learning center] respectfully requests the following items from the TESDA main office for [purpose, e.g. the upcoming SMAW NC II batch].\n\nThe items are listed in the attached request. We would be grateful for your favorable action on this request.\n\nThank you.'

/** Create or continue a draft inventory request: the letter, supporting photos and items. */
export default function InventoryRequestFormPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [requestId, setRequestId] = useState(id ? Number(id) : null)
  const [loaded, setLoaded] = useState(!id)
  const [loadError, setLoadError] = useState('')
  const [catalog, setCatalog] = useState([])
  const [letter, setLetter] = useState({
    letter_mode: 'composed',
    letter_date: today(),
    letter_recipient: 'The Regional Director\nTESDA Regional Office IV-B (MIMAROPA)',
    letter_subject: '',
    letter_body: BODY_TEMPLATE.replace('[learning center]', user?.training_center_name || 'learning center'),
    letter_signatory: user?.full_name ?? '',
    letter_position: 'Learning Center Administrator',
  })
  const [items, setItems] = useState(() => (params.get('item') ? [{ product_id: params.get('item'), quantity: '', justification: '' }] : [{ product_id: '', quantity: '', justification: '' }]))
  const [serverFiles, setServerFiles] = useState([])
  const [letterFile, setLetterFile] = useState(null) // File waiting to upload
  const [photos, setPhotos] = useState([]) // Files waiting to upload
  const [preview, setPreview] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    inventoryService
      .list()
      .then((d) => setCatalog(toList(d)))
      .catch(() => setCatalog([]))
  }, [])

  useEffect(() => {
    if (!id) return
    requestService
      .get(id)
      .then((d) => {
        if (d.request.status !== 'draft') return navigate(toPath(ROUTES.CENTER.INVENTORY_REQUEST, { id }), { replace: true })
        const r = d.request
        setLetter({
          letter_mode: r.letter_mode || 'composed',
          letter_date: r.letter_date || today(),
          letter_recipient: r.letter_recipient || '',
          letter_subject: r.letter_subject || '',
          letter_body: r.letter_body || '',
          letter_signatory: r.letter_signatory || '',
          letter_position: r.letter_position || '',
        })
        setItems(d.items.length ? d.items.map((i) => ({ product_id: String(i.product_id), quantity: String(i.quantity_requested), justification: i.justification || '' })) : [{ product_id: '', quantity: '', justification: '' }])
        setServerFiles(d.files)
        setLoaded(true)
      })
      .catch((err) => setLoadError(err.message))
  }, [id, navigate])

  // Object URLs for previews of files not uploaded yet.
  const photoPreviews = useMemo(() => photos.map((f, i) => ({ key: `new-${i}`, src: URL.createObjectURL(f), name: f.name, file: f })), [photos])
  useEffect(() => () => photoPreviews.forEach((p) => URL.revokeObjectURL(p.src)), [photoPreviews])
  const letterFileUrl = useMemo(() => (letterFile ? URL.createObjectURL(letterFile) : null), [letterFile])
  useEffect(() => () => letterFileUrl && URL.revokeObjectURL(letterFileUrl), [letterFileUrl])

  const set = (key) => ({ value: letter[key], onChange: (e) => setLetter((l) => ({ ...l, [key]: e.target.value })) })
  const setItem = (i, key, value) => setItems((list) => list.map((row, j) => (j === i ? { ...row, [key]: value } : row)))
  const byId = Object.fromEntries(catalog.map((p) => [String(p.id), p]))
  const serverLetter = serverFiles.find((f) => f.kind === 'letter')
  const serverPhotos = serverFiles.filter((f) => f.kind === 'attachment')
  const photoRoom = MAX_PHOTOS - serverPhotos.length - photos.length

  /** Saves the draft and uploads any files picked since. Returns the payload. */
  const save = async () => {
    const payload = {
      ...letter,
      items: items.filter((i) => i.product_id).map((i) => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) || 0, justification: i.justification })),
    }
    let data = requestId ? await requestService.updateDraft(requestId, payload) : await requestService.createDraft(payload)
    const newId = data.request.id
    if (!requestId) {
      setRequestId(newId)
      navigate(toPath(ROUTES.CENTER.EDIT_INVENTORY_REQUEST, { id: newId }), { replace: true })
    }
    if (letter.letter_mode === 'uploaded' && letterFile) {
      data = await requestService.upload(newId, 'letter', [letterFile])
      setLetterFile(null)
    }
    if (photos.length) {
      data = await requestService.upload(newId, 'attachment', photos)
      setPhotos([])
    }
    setServerFiles(data.files)
    return data
  }

  const saveDraft = async () => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await save()
      setNotice('Draft saved. Nothing is sent to the main office until you submit.')
    } catch (err) {
      setError(err.errors?.join(' ') || err.message)
    } finally {
      setBusy(false)
    }
  }

  const submit = async () => {
    const data = await save()
    await requestService.submit(data.request.id)
    navigate(toPath(ROUTES.CENTER.INVENTORY_REQUEST, { id: data.request.id }))
  }

  const removeServerFile = async (fileId) => {
    try {
      const d = await requestService.removeFile(requestId, fileId)
      setServerFiles(d.files)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loadError) {
    return (
      <>
        <PageHeader title="Inventory request" />
        <Workspace back={ROUTES.CENTER.INVENTORY_REQUESTS} backLabel="Inventory requests">
          <ErrorState what="this draft" message={loadError} />
        </Workspace>
      </>
    )
  }

  const filledItems = items.filter((i) => i.product_id)
  return (
    <>
      <PageHeader title={requestId ? 'Draft inventory request' : 'New inventory request'} subtitle="Write or upload your request letter, attach supporting photos, and list the items you need from the main office." />
      {notice && (
        <p className="notice-bar" role="status">
          <Icon name="check" size={16} />
          {notice}
        </p>
      )}
      <Workspace back={ROUTES.CENTER.INVENTORY_REQUESTS} backLabel="Inventory requests" title="Request details" flush>
        <form className="form-card" aria-busy={!loaded} onSubmit={(e) => e.preventDefault()} noValidate>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {/* 1. Letter */}
          <div className="form-section">
            <div className="form-section-intro">
              <h3>Request letter</h3>
              <p>Write a formal letter here, or upload one you already signed.</p>
            </div>
            <div className="form-fields">
              <div className="segmented wide" role="radiogroup" aria-label="How to provide the letter">
                {[
                  ['composed', 'Write it here'],
                  ['uploaded', 'Upload a letter'],
                ].map(([value, text]) => (
                  <label key={value} className={letter.letter_mode === value ? 'on' : undefined}>
                    <input type="radio" name="letter_mode" value={value} checked={letter.letter_mode === value} onChange={() => setLetter((l) => ({ ...l, letter_mode: value }))} />
                    {text}
                  </label>
                ))}
              </div>
              <TextInput id="letter_subject" label="Subject" required maxLength={200} placeholder="e.g. Request for welding supplies for SMAW NC II Batch 2027-01" {...set('letter_subject')} />
              {letter.letter_mode === 'composed' ? (
                <>
                  <div className="form-row even">
                    <TextInput id="letter_date" label="Date" type="date" required {...set('letter_date')} />
                    <TextArea id="letter_recipient" label="Recipient" rows={2} required maxLength={255} {...set('letter_recipient')} />
                  </div>
                  <TextArea id="letter_body" label="Letter" rows={10} required maxLength={20000} {...set('letter_body')} />
                  <div className="form-row even">
                    <TextInput id="letter_signatory" label="Signatory" required maxLength={150} {...set('letter_signatory')} />
                    <TextInput id="letter_position" label="Position" maxLength={150} {...set('letter_position')} />
                  </div>
                  <div>
                    <Button variant="secondary" onClick={() => setPreview(true)}>
                      <Icon name="eye" size={16} />
                      Preview letter
                    </Button>
                  </div>
                </>
              ) : (
                <div className="field">
                  <span>Letter file</span>
                  {letterFile ? (
                    <div className="pending-file">
                      <Icon name="documents" size={16} />
                      <span className="truncate">{letterFile.name}</span>
                      <small className="muted">Uploads when you save</small>
                      <button type="button" className="link-btn" onClick={() => setPreview(true)}>
                        Preview
                      </button>
                      <button type="button" className="icon-btn" aria-label="Remove the chosen letter" onClick={() => setLetterFile(null)}>
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  ) : serverLetter ? (
                    <div className="pending-file">
                      <Icon name="documents" size={16} />
                      <a className="truncate" href={requestService.fileUrl(serverLetter.id)} target="_blank" rel="noreferrer">
                        {serverLetter.original_name}
                      </a>
                      <button type="button" className="link-btn" onClick={() => setPreview(true)}>
                        Preview
                      </button>
                      <a className="link-btn" href={requestService.fileDownloadUrl(serverLetter.id)}>
                        Download
                      </a>
                      <button type="button" className="icon-btn" aria-label="Remove the letter" onClick={() => removeServerFile(serverLetter.id)}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  ) : null}
                  <label className="file-drop" htmlFor="letter-file">
                    <Icon name="upload" size={18} />
                    {serverLetter || letterFile ? 'Replace the letter' : 'Choose the letter (PDF, DOCX or DOC, up to 10 MB)'}
                  </label>
                  <input
                    id="letter-file"
                    type="file"
                    className="visually-hidden"
                    accept={LETTER_ACCEPT}
                    onChange={(e) => {
                      setLetterFile(e.target.files?.[0] ?? null)
                      e.target.value = ''
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 2. Photos */}
          <div className="form-section">
            <div className="form-section-intro">
              <h3>Supporting photos</h3>
              <p>Optional. Photos of worn-out tools, empty stock, or the training area. Up to {MAX_PHOTOS}.</p>
            </div>
            <div className="form-fields">
              <PhotoGallery
                photos={[
                  ...serverPhotos.map((f) => ({ key: f.id, src: requestService.fileUrl(f.id), name: f.original_name, server: true, id: f.id })),
                  ...photoPreviews.map((p) => ({ ...p, name: `${p.name} (uploads when you save)` })),
                ]}
                empty="No photos attached."
                onRemove={(p) => (p.server ? removeServerFile(p.id) : setPhotos((list) => list.filter((f) => f !== p.file)))}
              />
              {photoRoom > 0 && (
                <>
                  <label className="file-drop" htmlFor="photo-files">
                    <Icon name="image" size={18} />
                    Add photos (JPG, PNG or WebP, up to 10 MB each)
                  </label>
                  <input
                    id="photo-files"
                    type="file"
                    multiple
                    className="visually-hidden"
                    accept={PHOTO_ACCEPT}
                    onChange={(e) => {
                      const picked = Array.from(e.target.files ?? []).slice(0, photoRoom)
                      setPhotos((list) => [...list, ...picked])
                      e.target.value = ''
                    }}
                  />
                </>
              )}
            </div>
          </div>

          {/* 3. Items */}
          <div className="form-section">
            <div className="form-section-intro">
              <h3>Requested items</h3>
              <p>Choose from the main office inventory. Stock is checked again when the items are prepared.</p>
            </div>
            <div className="form-fields">
              <ul className="item-editor">
                {items.map((row, i) => {
                  const product = byId[row.product_id]
                  const over = product && Number(row.quantity) > Number(product.quantity)
                  return (
                    <li key={i}>
                      <label className="field" htmlFor={`item-${i}`}>
                        <span>Item</span>
                        <select id={`item-${i}`} value={row.product_id} onChange={(e) => setItem(i, 'product_id', e.target.value)}>
                          <option value="">Choose an item</option>
                          {catalog.map((p) => (
                            <option key={p.id} value={p.id} disabled={items.some((r, j) => j !== i && String(r.product_id) === String(p.id))}>
                              {p.product_name} · {p.quantity} {p.unit} in stock
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field qty-field" htmlFor={`qty-${i}`}>
                        <span>Quantity</span>
                        <div className="input-unit">
                          <input id={`qty-${i}`} type="number" min={1} max={100000} value={row.quantity} onChange={(e) => setItem(i, 'quantity', e.target.value)} />
                          <span>{product?.unit || 'unit'}</span>
                        </div>
                      </label>
                      <TextInput id={`why-${i}`} label="Justification (optional)" maxLength={500} placeholder="e.g. 20 trainees, 4 per station" value={row.justification} onChange={(e) => setItem(i, 'justification', e.target.value)} />
                      <button type="button" className="icon-btn item-remove" aria-label="Remove this item" onClick={() => setItems((list) => (list.length > 1 ? list.filter((_, j) => j !== i) : [{ product_id: '', quantity: '', justification: '' }]))}>
                        <Icon name="trash" size={15} />
                      </button>
                      {over && <p className="field-hint warn">Only {product.quantity} {product.unit} are in stock now. The main office may not be able to fulfil the full quantity.</p>}
                    </li>
                  )
                })}
              </ul>
              <div>
                <Button variant="secondary" onClick={() => setItems((list) => [...list, { product_id: '', quantity: '', justification: '' }])}>
                  <Icon name="plus" size={16} />
                  Add item
                </Button>
              </div>
            </div>
          </div>

          <div className="form-actions">
            {requestId && (
              <Button variant="ghost" className="push-left danger-text" onClick={() => setDeleting(true)} disabled={busy}>
                <Icon name="trash" size={16} />
                Delete draft
              </Button>
            )}
            <Button variant="secondary" onClick={saveDraft} disabled={busy || !loaded}>
              {busy ? 'Saving…' : 'Save draft'}
            </Button>
            <Button onClick={() => setConfirming(true)} disabled={busy || !loaded || !filledItems.length}>
              Submit to the main office
            </Button>
          </div>
        </form>
      </Workspace>

      <Modal open={preview} title="Letter preview" onClose={() => setPreview(false)} footer={<Button onClick={() => setPreview(false)}>Close</Button>}>
        {preview &&
          (letter.letter_mode === 'composed' ? (
            <LetterDocument letter={letter} centerName={user?.training_center_name} />
          ) : letterFile ? (
            <LetterFilePreview file={{ original_name: letterFile.name, file_size: letterFile.size, mime_type: letterFile.type || (letterFile.name.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : '') }} url={letterFileUrl} downloadUrl={letterFileUrl} />
          ) : serverLetter ? (
            <LetterFilePreview file={serverLetter} url={requestService.fileUrl(serverLetter.id)} downloadUrl={requestService.fileDownloadUrl(serverLetter.id)} />
          ) : (
            <p className="muted">Choose a letter file first.</p>
          ))}
      </Modal>

      {confirming && (
        <ConfirmDialog
          open
          title="Submit this request?"
          message={`The request goes to the main office for approval with ${filledItems.length} ${filledItems.length === 1 ? 'item' : 'items'}${serverPhotos.length + photos.length ? ` and ${serverPhotos.length + photos.length} ${serverPhotos.length + photos.length === 1 ? 'photo' : 'photos'}` : ''}. After submitting, it can no longer be changed.`}
          confirmLabel="Submit request"
          onClose={() => setConfirming(false)}
          onConfirm={submit}
        />
      )}
      {deleting && (
        <ConfirmDialog
          open
          title="Delete this draft?"
          message="The draft, its letter and photos are deleted. This cannot be undone."
          confirmLabel="Delete draft"
          variant="danger"
          onClose={() => setDeleting(false)}
          onConfirm={async () => {
            await requestService.deleteDraft(requestId)
            navigate(ROUTES.CENTER.INVENTORY_REQUESTS)
          }}
        />
      )}
    </>
  )
}
