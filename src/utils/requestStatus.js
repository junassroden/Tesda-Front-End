// Status groups for supply (inventory) and allowance requests, shared by the dashboards.
// Every status the backend can return belongs to exactly one group, so the parts always add
// up to the total. Anything unexpected is counted as "other" instead of disappearing.
import { countOf } from './format.js'

export const SUPPLY = {
  toReview: ['pending'],
  toRelease: ['approved', 'processing', 'ready_for_delivery'],
  onTheWay: ['in_transit', 'delivered'],
  received: ['completed'],
  rejected: ['rejected'],
  discrepancy: ['discrepancy'],
}

/** On-screen names of inventory request statuses ("rejected" is shown as Disapproved). */
export const REQUEST_STATUS_LABEL = {
  draft: 'Draft',
  pending: 'Pending approval',
  approved: 'Approved',
  rejected: 'Disapproved',
  processing: 'Processing',
  ready_for_delivery: 'Ready for delivery',
  in_transit: 'In transit',
  delivered: 'Delivered',
  completed: 'Completed',
  discrepancy: 'Discrepancy reported',
  cancelled: 'Cancelled',
}

/** Delivery and QR code statuses as delivery personnel see them. */
export const DELIVERY_STATUS_LABEL = { ready: 'Awaiting release', in_transit: 'In transit', delivered: 'Delivered', cancelled: 'Cancelled' }
export const QR_STATUS_LABEL = { active: 'Active', used: 'Used', cancelled: 'Cancelled' }

/** The path of a request, for progress steppers. */
export const REQUEST_STEPS = ['pending', 'approved', 'processing', 'ready_for_delivery', 'in_transit', 'delivered', 'completed']

export const ALLOWANCE = {
  toDecide: ['pending', 'budget_check', 'for_approval'],
  toRelease: ['approved'],
  released: ['released'],
  rejected: ['rejected'],
}

/** Allowance statuses whose amounts are still owed (requested, not yet released, not rejected). */
export const ALLOWANCE_UNRELEASED = [...ALLOWANCE.toDecide, ...ALLOWANCE.toRelease]

/**
 * Split a by_status map into labelled parts that sum exactly to the total.
 * groups: [{ label, statuses }]. Returns { parts: [{ label, value }], total }.
 */
export function splitByStatus(byStatus = {}, groups) {
  const known = new Set(groups.flatMap((g) => g.statuses))
  const parts = groups.map((g) => ({ label: g.label, value: countOf(byStatus, g.statuses) }))
  const other = countOf(
    byStatus,
    Object.keys(byStatus).filter((s) => !known.has(s)),
  )
  if (other > 0) parts.push({ label: 'other', value: other })
  return { parts, total: parts.reduce((sum, p) => sum + p.value, 0) }
}

/** "3 to review · 1 to release · 5 released", skipping zero parts; "None yet" when empty. */
export const describeParts = (parts) =>
  parts
    .filter((p) => p.value > 0)
    .map((p) => `${p.value} ${p.label}`)
    .join(' · ') || 'None yet'
