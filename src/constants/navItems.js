import { ROUTES } from './routes.js'

// Sidebar links for each role, grouped. `exact` = active only on that exact path.
// `icon` is a name from components/Icon.
export const ADMIN_NAV = [
  { group: 'Overview', to: ROUTES.ADMIN.DASHBOARD, label: 'Dashboard', icon: 'dashboard', exact: true },
  { group: 'Records', to: ROUTES.ADMIN.DOCUMENTS, label: 'Documents', icon: 'documents' },
  { group: 'Records', to: ROUTES.ADMIN.INVENTORY, label: 'Inventory', icon: 'inventory' },
  { group: 'Records', to: ROUTES.ADMIN.INVENTORY_REQUESTS, label: 'Request approvals', icon: 'request' },
  { group: 'Records', to: ROUTES.ADMIN.ALLOWANCE, label: 'Allowance tracking', icon: 'allowance' },
  { group: 'Monitoring', to: ROUTES.ADMIN.TRAINING, label: 'Training history', icon: 'calendar' },
  { group: 'Monitoring', to: ROUTES.ADMIN.LEDGER, label: 'Blockchain ledger', icon: 'shield' },
  { group: 'Team', to: ROUTES.ADMIN.STAFF, label: 'Main office staff', icon: 'users' },
]

export const LEARNING_CENTER_NAV = [
  { group: 'Overview', to: ROUTES.CENTER.DASHBOARD, label: 'Dashboard', icon: 'dashboard', exact: true },
  { group: 'Training', to: ROUTES.CENTER.PROGRAMS, label: 'Courses', icon: 'programs' },
  { group: 'Training', to: ROUTES.CENTER.HISTORY, label: 'Batch history', icon: 'calendar' },
  { group: 'Records', to: ROUTES.CENTER.STUDENT_RECORDS, label: 'Student records', icon: 'users' },
  { group: 'Requests', to: ROUTES.CENTER.INVENTORY_REQUESTS, label: 'Inventory requests', icon: 'request' },
  { group: 'Requests', to: ROUTES.CENTER.AVAILABLE_INVENTORY, label: 'Main office stock', icon: 'inventory' },
  { group: 'Requests', to: ROUTES.CENTER.REQUEST_ALLOWANCE, label: 'Request allowance', icon: 'coins' },
  { group: 'Team', to: ROUTES.CENTER.DELIVERY_PERSONNEL, label: 'Delivery personnel', icon: 'truck' },
]

export const TEACHER_NAV = [
  { group: 'Overview', to: ROUTES.TEACHER.DASHBOARD, label: 'My batches', icon: 'dashboard', exact: true },
  { group: 'Teaching', to: ROUTES.TEACHER.CLASSROOMS, label: 'Classrooms', icon: 'inbox' },
  { group: 'Training', to: ROUTES.TEACHER.PROGRAMS, label: 'Courses', icon: 'programs' },
]

export const STUDENT_NAV = [
  { group: 'Overview', to: ROUTES.STUDENT.DASHBOARD, label: 'My training', icon: 'dashboard', exact: true },
  { group: 'Learning', to: ROUTES.STUDENT.CLASSROOMS, label: 'Classrooms', icon: 'inbox' },
  { group: 'Records', to: ROUTES.STUDENT.DOCUMENTS, label: 'My documents', icon: 'documents' },
  { group: 'Records', to: ROUTES.STUDENT.PROFILE, label: 'Profile', icon: 'users' },
]

// Subtitle shown under each page title, per role.
export const ADMIN_SUBTITLE = 'Main office records, supplies, and allowance requests from every learning center.'
export const LEARNING_CENTER_SUBTITLE = 'Your courses, student batches, and requests to the main office.'

export const INVENTORY_NAV = [
  { group: 'Inventory', to: ROUTES.INVENTORY.DASHBOARD, label: 'Request processing', icon: 'inventory' },
]

export const DELIVERY_NAV = [
  { group: 'Delivery', to: ROUTES.DELIVERY.DASHBOARD, label: 'Delivery management', icon: 'truck', exact: true },
  { group: 'Delivery', to: ROUTES.DELIVERY.SCAN, label: 'Scan QR code', icon: 'camera' },
  { group: 'Delivery', to: ROUTES.DELIVERY.HISTORY, label: 'Delivery history', icon: 'calendar' },
]
