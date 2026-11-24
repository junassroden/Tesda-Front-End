import { ROUTES } from '../constants/routes.js'

// Labels for the blockchain ledger.

export const LEDGER_TYPE_LABEL = {
  system: 'System',
  inventory_request: 'Inventory request',
  inventory_delivery: 'Delivery',
  allowance_request: 'Allowance',
  student_document: 'Student document',
  batch: 'Training batch',
  document: 'Archived document',
  seal: 'Printed document',
}

export const LEDGER_ACTION_LABEL = {
  genesis: 'Genesis',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Disapproved',
  generated: 'QR code generated',
  released: 'Released',
  delivered: 'Delivered',
  received: 'Receipt confirmed',
  discrepancy: 'Discrepancy reported',
  resolved: 'Discrepancy resolved',
  verified: 'Verified',
  completed: 'Completed',
  archived: 'Archived',
  deleted: 'Deleted',
  issued: 'Sealed for printing',
}

export const BLOCK_STATUS = {
  verified: { label: 'Verified', tone: 'verified' },
  tampered: { label: 'Tampered', tone: 'rejected' },
  missing: { label: 'Record missing', tone: 'rejected' },
  removed: { label: 'Deleted (recorded)', tone: 'closed' },
  unverifiable: { label: 'Chain only', tone: 'closed' },
}

/** "a3f0…9c1d" */
export const shortHash = (hash) => (hash ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : '—')

/** Public block explorer links for anchors. */
export const bitcoinBlockUrl = (hashOrHeight) => `https://blockstream.info/block/${hashOrHeight}`

/** The public verification URL a printed sheet's QR code opens. */
export const verifyUrl = (token) => `${window.location.origin}${ROUTES.VERIFY.replace(':token', token)}`
