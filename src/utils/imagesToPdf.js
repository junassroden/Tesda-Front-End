// Builds a PDF from JPEG pages in the browser, with no library: each page is
// one JPEG image drawn full-page (DCTDecode keeps the JPEG bytes as they are).

const PAGE_WIDTH = 595.28 // A4 width in points; height follows the photo's shape.

const encoder = new TextEncoder()

/**
 * @param {{ blob: Blob, width: number, height: number }[]} pages JPEG blobs and pixel sizes
 * @returns {Promise<Blob>} application/pdf
 */
export async function imagesToPdf(pages) {
  if (!pages.length) throw new Error('Add at least one page.')

  const chunks = []
  const offsets = []
  let length = 0
  const push = (part) => {
    const bytes = typeof part === 'string' ? encoder.encode(part) : part
    chunks.push(bytes)
    length += bytes.length
  }
  const startObject = (id) => {
    offsets[id] = length
    push(`${id} 0 obj\n`)
  }

  // Object ids: 1 catalog, 2 page tree, then three per page (page, content, image).
  const pageId = (i) => 3 + i * 3
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')

  startObject(1)
  push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')

  startObject(2)
  const kids = pages.map((_, i) => `${pageId(i)} 0 R`).join(' ')
  push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>\nendobj\n`)

  for (let i = 0; i < pages.length; i++) {
    const { blob, width, height } = pages[i]
    const jpeg = new Uint8Array(await blob.arrayBuffer())
    const w = PAGE_WIDTH
    const h = +((PAGE_WIDTH * height) / width).toFixed(2)
    const [id, contentId, imageId] = [pageId(i), pageId(i) + 1, pageId(i) + 2]

    startObject(id)
    push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`)

    const draw = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`
    startObject(contentId)
    push(`<< /Length ${draw.length} >>\nstream\n${draw}\nendstream\nendobj\n`)

    startObject(imageId)
    push(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`)
    push(jpeg)
    push('\nendstream\nendobj\n')
  }

  const objectCount = 3 + pages.length * 3
  const xrefStart = length
  let xref = `xref\n0 ${objectCount}\n0000000000 65535 f \n`
  for (let id = 1; id < objectCount; id++) xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  push(xref)
  push(`trailer\n<< /Size ${objectCount} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`)

  return new Blob(chunks, { type: 'application/pdf' })
}
