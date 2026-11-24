// Status -> color tone. Anything not listed is neutral.
const TONES = {
  in_review: 'info',
  budget_check: 'info',
  for_approval: 'info',
  current: 'success',
  pending: 'warning',
  expiring: 'warning',
  upcoming: 'warning',
  incomplete: 'danger',
  rejected: 'danger',
  cancelled: 'danger',
  dropped: 'danger',
  approved: 'success',
  released: 'success',
  received: 'success',
  active: 'success',
  ongoing: 'success',
  open: 'success',
  complete: 'success',
  completed: 'neutral',
  closed: 'neutral',
  archived: 'neutral',
  // Batches
  suspended: 'warning',
  needs_review: 'danger',
  transferred: 'neutral',
  // Documents
  not_submitted: 'neutral',
  submitted: 'info',
  under_review: 'info',
  verified: 'success',
  // Classroom and attendance
  graded: 'success',
  turned_in: 'info',
  missing: 'danger',
  assigned: 'neutral',
  present: 'success',
  late: 'warning',
  absent: 'danger',
  excused: 'neutral',
  held: 'success',
  // Inventory requests and deliveries
  draft: 'neutral',
  processing: 'info',
  ready_for_delivery: 'info',
  ready: 'info',
  in_transit: 'warning',
  delivered: 'success',
  discrepancy: 'danger',
  used: 'neutral',
}

const keyOf = (status) => String(status).trim().toLowerCase().replace(/[\s-]+/g, '_')

/** "in_review" -> "In review" */
const labelOf = (status) => {
  const text = String(status).replace(/_/g, ' ').trim()
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/** Tinted status badge with a dot. `label` overrides the text (e.g. rejected -> "Disapproved"). */
export default function StatusBadge({ status, label }) {
  if (!status) return <span className="muted">—</span>
  const tone = TONES[keyOf(status)] ?? 'neutral'
  return <span className={`status-badge status-${tone}`}>{label ?? labelOf(status)}</span>
}
