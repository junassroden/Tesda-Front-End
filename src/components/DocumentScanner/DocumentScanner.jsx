import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '../Icon/Icon.jsx'
import { imagesToPdf } from '../../utils/imagesToPdf.js'

// Server limits (DocumentArchiveController / document_ai/inference.py).
const MAX_PAGES = 20
const MAX_BYTES = 10 * 1024 * 1024
// Keeps each page sharp enough for OCR while 20 pages still fit in 10 MB.
const MAX_SIDE = 1800
const JPEG_QUALITY = 0.82

const defaultName = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `Scan ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}-${pad(d.getMinutes())}`
}

/** Draws a video frame or image to a JPEG no larger than MAX_SIDE, optionally cleaned up for text. */
function toJpeg(source, sourceWidth, sourceHeight, enhance) {
  const scale = Math.min(1, MAX_SIDE / Math.max(sourceWidth, sourceHeight))
  const width = Math.round(sourceWidth * scale)
  const height = Math.round(sourceHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(source, 0, 0, width, height)

  const image = ctx.getImageData(0, 0, width, height)
  const px = image.data
  const histogram = new Uint32Array(256)
  for (let i = 0; i < px.length; i += 4) histogram[Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2])]++

  // Brightness below which the given share of pixels fall.
  const total = width * height
  const percentile = (share) => {
    let seen = 0
    for (let v = 0; v < 256; v++) {
      seen += histogram[v]
      if (seen >= total * share) return v
    }
    return 255
  }

  // A covered, busy or still-starting camera hands back an all-black frame.
  if (percentile(0.99) < 10) {
    return Promise.reject(new Error('The camera sent a black picture. Check that it is not covered or in use by another app (such as Meet), wait a second, and try again.'))
  }

  if (enhance) {
    // Auto-levels in grayscale: the darkest 1% maps to black and the brightest 2% to white,
    // so dim photos are brightened instead of crushed, and paper comes out white.
    const low = percentile(0.01)
    const high = Math.max(low + 32, percentile(0.98))
    const scale = 255 / (high - low)
    for (let i = 0; i < px.length; i += 4) {
      const gray = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]
      px[i] = px[i + 1] = px[i + 2] = Math.max(0, Math.min(255, (gray - low) * scale))
    }
    ctx.putImageData(image, 0, 0)
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve({ blob, width, height, url: URL.createObjectURL(blob) }) : reject(new Error('The photo could not be processed.'))), 'image/jpeg', JPEG_QUALITY),
  )
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`${file.name} is not an image this browser can read.`))
    }
    img.src = url
  })
}

/**
 * Full-screen "cam scanner": take photos page by page, review them, then save
 * them as one PDF. onSave(file) uploads it; Cancel discards every page.
 */
export default function DocumentScanner({ open, onClose, onSave }) {
  const dialogRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const galleryRef = useRef(null)
  const [pages, setPages] = useState([])
  const [preview, setPreview] = useState(null)
  const [cameraState, setCameraState] = useState('idle') // idle | starting | live | unavailable
  const [cameraError, setCameraError] = useState('')
  const [enhance, setEnhance] = useState(true)
  const [name, setName] = useState(defaultName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const startCamera = useCallback(async () => {
    stopCamera()
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unavailable')
      setCameraError(window.isSecureContext ? 'This browser cannot open the camera.' : 'The camera needs a secure (https or localhost) address.')
      return
    }
    setCameraState('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setCameraState('live')
      setCameraError('')
    } catch (err) {
      setCameraState('unavailable')
      setCameraError(err?.name === 'NotAllowedError' ? 'Camera permission was denied. Allow it in the browser, or add photos from the gallery.' : 'No camera could be opened. Add photos from the gallery instead.')
    }
  }, [stopCamera])

  const releasePages = (list) => list.forEach((p) => URL.revokeObjectURL(p.url))

  const reset = useCallback(() => {
    stopCamera()
    setPages((list) => {
      releasePages(list)
      return []
    })
    setPreview(null)
    setName(defaultName())
    setError('')
    setBusy(false)
    setConfirmCancel(false)
    setCameraState('idle')
  }, [stopCamera])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      startCamera()
    }
    if (!open && dialog.open) dialog.close()
  }, [open, startCamera])

  useEffect(() => () => stopCamera(), [stopCamera])

  const full = pages.length >= MAX_PAGES

  const capture = async () => {
    const video = videoRef.current
    // HAVE_CURRENT_DATA: the camera has delivered a real frame to draw.
    if (!video || cameraState !== 'live' || !video.videoWidth || video.readyState < 2 || full) return
    setFlash(true)
    setTimeout(() => setFlash(false), 180)
    try {
      const page = await toJpeg(video, video.videoWidth, video.videoHeight, enhance)
      setPages((list) => [...list, { ...page, id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}` }])
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const addFromGallery = async (event) => {
    const files = [...event.target.files]
    event.target.value = ''
    const room = MAX_PAGES - pages.length
    if (files.length > room) setError(`Only ${MAX_PAGES} pages fit in one document. The extra photos were skipped.`)
    for (const file of files.slice(0, room)) {
      try {
        const { img, url } = await loadImage(file)
        const page = await toJpeg(img, img.naturalWidth, img.naturalHeight, enhance)
        URL.revokeObjectURL(url)
        setPages((list) => [...list, { ...page, id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}` }])
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const removePage = (id) => {
    setPages((list) => {
      const page = list.find((p) => p.id === id)
      if (page) URL.revokeObjectURL(page.url)
      return list.filter((p) => p.id !== id)
    })
    setPreview((p) => (p === id ? null : p))
  }

  const movePage = (id, step) =>
    setPages((list) => {
      const i = list.findIndex((p) => p.id === id)
      const j = i + step
      if (i < 0 || j < 0 || j >= list.length) return list
      const next = [...list]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  const close = () => {
    reset()
    onClose()
  }

  const requestCancel = () => {
    if (busy) return
    if (pages.length) setConfirmCancel(true)
    else close()
  }

  const save = async () => {
    if (!pages.length || busy) return
    setBusy(true)
    setError('')
    try {
      const pdf = await imagesToPdf(pages)
      if (pdf.size > MAX_BYTES) throw new Error(`The PDF is ${(pdf.size / 1048576).toFixed(1)} MB; the limit is 10 MB. Remove a few pages and save again.`)
      const base = (name.trim() || defaultName()).replace(/[\\/:*?"<>|]+/g, '-').replace(/\.pdf$/i, '')
      stopCamera()
      await onSave(new File([pdf], `${base}.pdf`, { type: 'application/pdf' }))
      reset()
      onClose()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const previewPage = pages.find((p) => p.id === preview)

  return (
    <dialog
      ref={dialogRef}
      className="scanner"
      aria-label="Scan document"
      onCancel={(e) => {
        e.preventDefault()
        if (preview) setPreview(null)
        else requestCancel()
      }}
    >
      <div className="scanner-box">
        <header className="scanner-header">
          <button type="button" className="btn btn-ghost" onClick={requestCancel} disabled={busy}>
            Cancel
          </button>
          <input className="scanner-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} aria-label="Document name" disabled={busy} />
          <button type="button" className="btn btn-primary" onClick={save} disabled={!pages.length || busy}>
            <Icon name={busy ? 'clock' : 'check'} size={17} />
            {busy ? 'Saving…' : `Save PDF${pages.length ? ` (${pages.length})` : ''}`}
          </button>
        </header>

        <div className="scanner-stage">
          <video ref={videoRef} className="scanner-video" playsInline muted autoPlay hidden={cameraState !== 'live' || !!previewPage} />
          {previewPage ? (
            <img className="scanner-preview" src={previewPage.url} alt={`Page ${pages.indexOf(previewPage) + 1}`} />
          ) : (
            <>
              {cameraState === 'live' && <span className="scanner-guide" aria-hidden="true" />}
              {cameraState === 'starting' && <p className="scanner-message">Opening camera…</p>}
              {cameraState === 'unavailable' && (
                <div className="scanner-message">
                  <Icon name="camera" size={32} />
                  <p>{cameraError}</p>
                  <div className="scanner-message-actions">
                    <button type="button" className="btn btn-secondary" onClick={startCamera}>
                      Try again
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => galleryRef.current?.click()}>
                      Choose photos
                    </button>
                  </div>
                </div>
              )}
              {flash && <span className="scanner-flash" aria-hidden="true" />}
            </>
          )}
          {previewPage && (
            <button type="button" className="btn btn-secondary scanner-back" onClick={() => setPreview(null)}>
              <Icon name="arrowLeft" size={17} />
              Back to camera
            </button>
          )}
          {busy && <p className="scanner-message scanner-busy">Saving and reading the text. This can take a minute…</p>}
        </div>

        {(error || full) && (
          <p className="form-error scanner-error" role="alert">
            {error || `${MAX_PAGES} pages is the most one document can hold.`}
          </p>
        )}

        {pages.length > 0 && (
          <ol className="scanner-pages" aria-label="Captured pages">
            {pages.map((p, i) => (
              <li key={p.id} className={p.id === preview ? 'is-active' : ''}>
                <button type="button" className="scanner-thumb" onClick={() => setPreview(p.id)} aria-label={`View page ${i + 1}`}>
                  <img src={p.url} alt="" />
                  <span>{i + 1}</span>
                </button>
                <div className="scanner-thumb-tools">
                  <button type="button" onClick={() => movePage(p.id, -1)} disabled={i === 0 || busy} aria-label={`Move page ${i + 1} left`}>
                    <Icon name="arrowLeft" size={14} />
                  </button>
                  <button type="button" onClick={() => removePage(p.id)} disabled={busy} aria-label={`Delete page ${i + 1}`}>
                    <Icon name="trash" size={14} />
                  </button>
                  <button type="button" onClick={() => movePage(p.id, 1)} disabled={i === pages.length - 1 || busy} aria-label={`Move page ${i + 1} right`}>
                    <Icon name="arrowRight" size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}

        <footer className="scanner-controls">
          <button type="button" className="scanner-side" onClick={() => galleryRef.current?.click()} disabled={busy || full}>
            <Icon name="image" size={22} />
            <span>Gallery</span>
          </button>
          <button type="button" className="scanner-shutter" onClick={capture} disabled={cameraState !== 'live' || busy || full || !!preview} aria-label="Take photo">
            <span />
          </button>
          <button type="button" className={`scanner-side${enhance ? ' is-on' : ''}`} onClick={() => setEnhance((v) => !v)} aria-pressed={enhance} disabled={busy}>
            <Icon name="sparkle" size={22} />
            <span>{enhance ? 'Enhance on' : 'Enhance off'}</span>
          </button>
          <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={addFromGallery} />
        </footer>

        {confirmCancel && (
          <div className="scanner-confirm" role="alertdialog" aria-labelledby="scanner-confirm-title">
            <div>
              <h3 id="scanner-confirm-title">Discard this scan?</h3>
              <p>
                The {pages.length} captured {pages.length === 1 ? 'page' : 'pages'} will be deleted and nothing is saved.
              </p>
              <div className="scanner-message-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setConfirmCancel(false)}>
                  Keep scanning
                </button>
                <button type="button" className="btn btn-danger" onClick={close}>
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </dialog>
  )
}
