import { ROUTES } from './routes.js'

// Sidebar buttons for each role (labels as in Figma). `exact` means active only on that exact path.
export const ADMIN_NAV = [
  { to: ROUTES.ADMIN.DASHBOARD, label: 'Dashboard', exact: true },
  { to: ROUTES.ADMIN.DOCUMENTS, label: 'Documents' },
  { to: ROUTES.ADMIN.INVENTORY, label: 'Inventory' },
  { to: ROUTES.ADMIN.ALLOWANCE, label: 'Allowance Track' },
]

export const LEARNING_CENTER_NAV = [
  { to: ROUTES.CENTER.DASHBOARD, label: 'Dashboard', exact: true },
  { to: ROUTES.CENTER.PROGRAMS, label: 'Programs' },
  { to: ROUTES.CENTER.AVAILABLE_INVENTORY, label: 'Request Inventory' },
  { to: ROUTES.CENTER.REQUEST_ALLOWANCE, label: 'Request Allowance' },
  { to: ROUTES.CENTER.DELIVERY_PERSONNEL, label: 'Delivery Personnel' },
]

// Subtitle and search hint shown under each page title, per role (from Figma).
export const ADMIN_SUBTITLE = 'Company documents, main-building items, and batch allowance requests.'
export const LEARNING_CENTER_SUBTITLE = 'Your student batches, resource requests, and allowance checklists.'
