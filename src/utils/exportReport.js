// Export a table as Excel, PDF or Word without extra libraries.
// columns: [{ key, label }], rows: [{ [key]: value }]

const escape = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

function tableHtml(title, columns, rows) {
  const head = columns.map((c) => `<th>${escape(c.label)}</th>`).join('')
  const body = rows.map((row) => `<tr>${columns.map((c) => `<td>${escape(row[c.key])}</td>`).join('')}</tr>`).join('')
  return `<html><head><meta charset="utf-8"><title>${escape(title)}</title>
<style>body{font-family:Arial,sans-serif}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:6px;text-align:left}</style>
</head><body><h2>${escape(title)}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`
}

function download(content, type, filename) {
  const url = URL.createObjectURL(new Blob(['﻿', content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/** format: 'excel' | 'pdf' | 'word' */
export function exportReport(format, { title = 'Report', columns, rows }) {
  const html = tableHtml(title, columns, rows)
  const name = title.replace(/[^\w-]+/g, '_')

  if (format === 'excel') return download(html, 'application/vnd.ms-excel', `${name}.xls`)
  if (format === 'word') return download(html, 'application/msword', `${name}.doc`)
  if (format === 'pdf') {
    // Opens the browser print dialog, where the user picks "Save as PDF".
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }
}
