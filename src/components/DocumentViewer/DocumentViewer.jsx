import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '../Icon/Icon.jsx'

// In-app viewer for archived files, styled like the rest of the portal instead of
// the browser's own PDF viewer. PDFs are drawn page by page with pdf.js (loaded
// only when a PDF is opened); images use the same frame and controls.

const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3]
const PAGE_GAP = 16
const SIDE_PADDING = 48

let pdfjsPromise = null
function loadPdfjs() {
  pdfjsPromise ??= Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(([pdfjs, worker]) => {
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    return pdfjs
  })
  return pdfjsPromise
}

/** One PDF page: a sized placeholder that renders to a canvas once it scrolls near view. */
function PdfPage({ pdf, number, width, height, scale, root }) {
  const boxRef = useRef(null)
  const canvasRef = useRef(null)
  const [near, setNear] = useState(false)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), { root, rootMargin: '600px 0px' })
    observer.observe(box)
    return () => observer.disconnect()
  }, [root])

  useEffect(() => {
    if (!near) return
    let task = null
    let cancelled = false
    pdf.getPage(number).then((page) => {
      if (cancelled) return
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const viewport = page.getViewport({ scale: scale * ratio })
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      task = page.render({ canvas, viewport })
      task.promise.then(
        () => !cancelled && setDrawn(true),
        () => {},
      )
    })
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [pdf, number, scale, near])

  return (
    <div ref={boxRef} className={`viewer-page${drawn ? '' : ' is-loading'}`} data-page={number} style={{ width: width * scale, height: height * scale }}>
      <canvas ref={canvasRef} aria-label={`Page ${number}`} role="img" />
    </div>
  )
}

/**
 * @param {{ url: string, mimeType: string, name: string, downloadUrl: string }} props
 */
export default function DocumentViewer({ url, mimeType, name, downloadUrl }) {
  const frameRef = useRef(null)
  const [body, setBody] = useState(null) // scroll container, kept in state so pages can observe it
  const [bodyWidth, setBodyWidth] = useState(0)
  const [pdf, setPdf] = useState(null)
  const [sizes, setSizes] = useState([]) // [{ width, height }] in PDF points, or the image's pixels
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [zoom, setZoom] = useState('fit') // 'fit' or a number
  const [current, setCurrent] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [fullscreen, setFullscreen] = useState(false)

  const isPdf = mimeType === 'application/pdf'

  // Load the file.
  useEffect(() => {
    let cancelled = false
    let task = null
    // Callers key the viewer by file, so state starts fresh for each document.
    if (!isPdf) return undefined // images report their size from <img onLoad>

    loadPdfjs()
      .then(async (pdfjs) => {
        task = pdfjs.getDocument({ url, withCredentials: true })
        const doc = await task.promise
        const pageSizes = []
        for (let n = 1; n <= doc.numPages; n++) {
          const viewport = (await doc.getPage(n)).getViewport({ scale: 1 })
          pageSizes.push({ width: viewport.width, height: viewport.height })
        }
        if (cancelled) return
        setPdf(doc)
        setSizes(pageSizes)
        setStatus('ready')
      })
      .catch(() => !cancelled && setStatus('error'))

    return () => {
      cancelled = true
      task?.destroy()
    }
  }, [url, isPdf])

  // Track the visible width so "fit" can follow the layout.
  useEffect(() => {
    if (!body) return
    const observer = new ResizeObserver(([entry]) => setBodyWidth(entry.contentRect.width))
    observer.observe(body)
    return () => observer.disconnect()
  }, [body])

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === frameRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const widest = sizes.reduce((max, s) => Math.max(max, s.width), 0)
  const fitScale = widest && bodyWidth ? Math.max(0.1, (bodyWidth - SIDE_PADDING) / widest) : 1
  // Fit never blows small images up past their real size.
  const scale = zoom === 'fit' ? (isPdf ? Math.min(fitScale, 2) : Math.min(fitScale, 1)) : zoom
  const pageCount = isPdf ? sizes.length : sizes.length ? 1 : 0

  const zoomBy = (direction) => {
    const next = direction > 0 ? ZOOM_STEPS.find((z) => z > scale + 0.01) : [...ZOOM_STEPS].reverse().find((z) => z < scale - 0.01)
    if (next) setZoom(next)
  }

  const onScroll = useCallback(() => {
    if (!body) return
    const marker = body.scrollTop + body.clientHeight / 3
    let page = 1
    for (const el of body.querySelectorAll('[data-page]')) {
      if (el.offsetTop <= marker) page = Number(el.dataset.page)
    }
    setCurrent(page)
    setPageInput(String(page))
  }, [body])

  const goTo = (page) => {
    const target = Math.min(Math.max(1, page), pageCount || 1)
    const el = body?.querySelector(`[data-page="${target}"]`)
    if (el) body.scrollTo({ top: el.offsetTop - PAGE_GAP, behavior: 'smooth' })
    setCurrent(target)
    setPageInput(String(target))
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else frameRef.current?.requestFullscreen?.()
  }

  const ready = status === 'ready'

  return (
    <section ref={frameRef} className={`viewer${fullscreen ? ' is-fullscreen' : ''}`} aria-label={`Preview of ${name}`}>
      <div className="viewer-toolbar">
        <div className="viewer-group viewer-title">
          <span className="viewer-badge">{isPdf ? 'PDF' : 'Image'}</span>
          <span className="viewer-name" title={name}>
            {name}
          </span>
        </div>

        <div className="viewer-group">
          {isPdf && (
            <>
              <button type="button" className="viewer-btn" onClick={() => goTo(current - 1)} disabled={!ready || current <= 1} aria-label="Previous page">
                <Icon name="chevronUp" size={16} />
              </button>
              <form
                className="viewer-page-field"
                onSubmit={(e) => {
                  e.preventDefault()
                  goTo(Number(pageInput) || current)
                }}
              >
                <input value={pageInput} onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ''))} onBlur={() => setPageInput(String(current))} inputMode="numeric" aria-label="Page number" disabled={!ready} />
                <span>/ {pageCount || '–'}</span>
              </form>
              <button type="button" className="viewer-btn" onClick={() => goTo(current + 1)} disabled={!ready || current >= pageCount} aria-label="Next page">
                <Icon name="chevronDown" size={16} />
              </button>
              <span className="viewer-divider" aria-hidden="true" />
            </>
          )}
          <button type="button" className="viewer-btn" onClick={() => zoomBy(-1)} disabled={!ready || scale <= ZOOM_STEPS[0] + 0.01} aria-label="Zoom out">
            <Icon name="minus" size={16} />
          </button>
          <span className="viewer-zoom num">{ready ? `${Math.round(scale * 100)}%` : '–'}</span>
          <button type="button" className="viewer-btn" onClick={() => zoomBy(1)} disabled={!ready || scale >= ZOOM_STEPS.at(-1) - 0.01} aria-label="Zoom in">
            <Icon name="plus" size={16} />
          </button>
          <button type="button" className={`viewer-btn viewer-text-btn${zoom === 'fit' ? ' is-active' : ''}`} onClick={() => setZoom('fit')} disabled={!ready} aria-pressed={zoom === 'fit'}>
            Fit
          </button>
        </div>

        <div className="viewer-group viewer-end">
          <a className="viewer-btn" href={downloadUrl} aria-label="Download" title="Download">
            <Icon name="download" size={16} />
          </a>
          <button type="button" className="viewer-btn" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit full screen' : 'Full screen'} title={fullscreen ? 'Exit full screen' : 'Full screen'}>
            <Icon name={fullscreen ? 'collapse' : 'expand'} size={16} />
          </button>
        </div>
      </div>

      <div ref={setBody} className="viewer-body" onScroll={onScroll}>
        {status === 'error' && (
          <div className="viewer-state">
            <Icon name="documents" size={28} />
            <p>This file could not be shown here.</p>
            <a className="btn btn-secondary" href={downloadUrl}>
              <Icon name="download" size={16} />
              Download instead
            </a>
          </div>
        )}

        {status === 'loading' && isPdf && (
          <div className="viewer-state" aria-live="polite">
            <span className="viewer-spinner" aria-hidden="true" />
            <p>Opening document…</p>
          </div>
        )}

        {isPdf && ready && (
          <div className="viewer-pages">
            {sizes.map((size, i) => (
              <PdfPage key={i} pdf={pdf} number={i + 1} width={size.width} height={size.height} scale={scale} root={body} />
            ))}
          </div>
        )}

        {!isPdf && status !== 'error' && (
          <div className="viewer-pages">
            <div className={`viewer-page${ready ? '' : ' is-loading'}`} data-page={1} style={sizes[0] ? { width: sizes[0].width * scale, height: sizes[0].height * scale } : { width: 320, height: 420 }}>
              <img
                src={url}
                alt={name}
                onLoad={(e) => {
                  setSizes([{ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight }])
                  setStatus('ready')
                }}
                onError={() => setStatus('error')}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
