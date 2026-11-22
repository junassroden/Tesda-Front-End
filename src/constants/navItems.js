import { ROUTES } from './routes.js'

// Sidebar links for each role, grouped. `exact` = active only on that exact path.
// `icon` is a name from components/Icon.
export const ADMIN_NAV = [
  { group: 'Overview', to: ROUTES.ADMIN.DASHBOARD, label: 'Dashboard', icon: 'dashboard', exact: true },
  { group: 'Records', to: ROUTES.ADMIN.DOCUMENTS, label: 'Documents', icon: 'documents' },
  { group: 'Records', to: ROUTES.ADMIN.INVENTORY, label: 'Inventory', icon: 'inventory' },
  { group: 'Records', to: ROUTES.ADMIN.INVENTORY_REQUESTS, label: 'Supply requests', icon: 'request' },
  { group: 'Records', to: ROUTES.ADMIN.ALLOWANCE, label: 'Allowance tracking', icon: 'allowance' },
]

export const LEARNING_CENTER_NAV = [
  { group: 'Overview', to: ROUTES.CENTER.DASHBOARD, label: 'Dashboard', icon: 'dashboard', exact: true },
  { group: 'Training', to: ROUTES.CENTER.PROGRAMS, label: 'Programs', icon: 'programs' },
  { group: 'Requests', to: ROUTES.CENTER.AVAILABLE_INVENTORY, label: 'Request inventory', icon: 'request' },
  { group: 'Requests', to: ROUTES.CENTER.REQUEST_ALLOWANCE, label: 'Request allowance', icon: 'coins' },
  { group: 'Team', to: ROUTES.CENTER.DELIVERY_PERSONNEL, label: 'Delivery personnel', icon: 'truck' },
]

export const TEACHER_NAV = [
  { group: 'Overview', to: ROUTES.TEACHER.DASHBOARD, label: 'My batches', icon: 'dashboard', exact: true },
  { group: 'Training', to: ROUTES.TEACHER.PROGRAMS, label: 'Programs', icon: 'programs' },
]

// Subtitle shown under each page title, per role.
export const ADMIN_SUBTITLE = 'Main office records, supplies, and allowance requests from every learning center.'
export const LEARNING_CENTER_SUBTITLE = 'Your programs, student batches, and requests to the main office.'
