import { useEffect, useRef, useState } from 'react'

let pdfjsPromise = null
const loadPdfjs = () => {
  pdfjsPromise ??= Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(([pdfjs, worker]) => {
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    return pdfjs
  })
  return pdfjsPromise
}

/**
 * Renders every page of a PDF as images, for printing (the enrollment packet).
 * onReady() is called once all pages are drawn or the file failed.
 */
export default function PdfPages({ url, name, onReady, maxPages = 20 }) {
  const box = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    let task
    loadPdfjs()
      .then(async (pdfjs) => {
        task = pdfjs.getDocument({ url, withCredentials: true })
        const pdf = await task.promise
        const count = Math.min(pdf.numPages, maxPages)
        for (let n = 1; n <= count && !cancelled; n++) {
          const page = await pdf.getPage(n)
          const viewport = page.getViewport({ scale: 1.6 })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
          if (cancelled) return
          const img = document.createElement('img')
          img.src = canvas.toDataURL('image/png')
          img.alt = `${name}, page ${n}`
          img.className = 'packet-image'
          box.current?.appendChild(img)
        }
      })
      .catch(() => !cancelled && setError(`${name} could not be rendered. Print it from the file instead.`))
      .finally(() => !cancelled && onReady?.())
    return () => {
      cancelled = true
      task?.destroy?.()
    }
  }, [url, name, maxPages, onReady])

  return (
    <div ref={box} className="packet-pdf">
      {error && <p className="muted">{error}</p>}
    </div>
  )
}
