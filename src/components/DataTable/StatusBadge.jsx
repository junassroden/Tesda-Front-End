// Status text -> dot color. Anything not listed is neutral.
const TONES = {
  'in review': 'info',
  current: 'success',
  pending: 'warning',
  expiring: 'warning',
  incomplete: 'danger',
  rejected: 'danger',
  approved: 'success',
  active: 'success',
  complete: 'success',
  completed: 'success',
  delivered: 'success',
}

/**
 * "• Pending" style status (table rows).
 * variant="pill" draws the boxed badge used in dashboard lists.
 */
export default function StatusBadge({ status, variant = 'dot' }) {
  if (!status) return '—'
  const tone = TONES[String(status).toLowerCase()] ?? 'neutral'
  return <span className={`status-badge status-${tone}${variant === 'pill' ? ' status-pill' : ''}`}>{status}</span>
}
