// Display helpers for API values.

const pesoFormat = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 })
const dateFormat = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

/** 9000 -> "₱9,000.00" */
export const peso = (value) => pesoFormat.format(Number(value) || 0)

/** "2026-11-18 09:30:00" -> "Nov 18, 2026" */
export const shortDate = (value) => {
  if (!value) return '—'
  const d = new Date(String(value).replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? '—' : dateFormat.format(d)
}

/** "2026-08-03" + "2026-11-27" -> "Aug 3, 2026 – Nov 27, 2026" */
export const dateRange = (start, end) => (start || end ? `${shortDate(start)} – ${shortDate(end)}` : 'Dates not set')

/** Time since, for activity lists: "2h ago", "3d ago", or a date. */
export const timeAgo = (value) => {
  if (!value) return ''
  const d = new Date(String(value).replace(' ', 'T'))
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (Number.isNaN(mins)) return ''
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`
  if (mins < 60 * 24 * 7) return `${Math.round(mins / 1440)}d ago`
  return shortDate(value)
}

const PENDING_STATES = ['pending', 'in_review', 'budget_check', 'for_approval', 'approved']

/** Sum a by_status map's counts for the given statuses. */
export const countOf = (byStatus = {}, statuses = PENDING_STATES) =>
  statuses.reduce((sum, s) => sum + Number(typeof byStatus[s] === 'object' ? byStatus[s]?.count : byStatus[s] || 0), 0)

/** Gmail-style time for lists: "9:23 PM" today, "Nov 18" this year, "11/18/25" before that. */
export const listTime = (value) => {
  if (!value) return ''
  const d = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })
}

/** "Nov 18, 2026, 9:23 PM", for tooltips. */
export const fullDateTime = (value) => {
  if (!value) return ''
  const d = new Date(String(value).replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}
