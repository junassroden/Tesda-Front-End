// Every URL in the app. Use these instead of typing paths by hand.
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',

  ADMIN: {
    DASHBOARD: '/admin',
    DOCUMENTS: '/admin/documents',
    DOCUMENT_DETAIL: '/admin/documents/:id',
    INVENTORY: '/admin/inventory',
    REGISTER_ITEM: '/admin/inventory/register',
    INVENTORY_REQUESTS: '/admin/inventory/requests',
    INVENTORY_REQUEST_DETAIL: '/admin/inventory/requests/:id',
    ALLOWANCE: '/admin/allowance',
    ALLOWANCE_CHECKLIST: '/admin/allowance/:id',
  },

  CENTER: {
    DASHBOARD: '/center',
    PROGRAMS: '/center/programs',
    REGISTER_PROGRAM: '/center/programs/register',
    BATCHES: '/center/programs/:programId/batches',
    STUDENTS: '/center/programs/:programId/batches/:batchId/students',
    AVAILABLE_INVENTORY: '/center/request-inventory',
    REQUEST_ITEM: '/center/request-inventory/:itemId',
    REQUEST_ALLOWANCE: '/center/request-allowance',
    DELIVERY_PERSONNEL: '/center/delivery-personnel',
  },
}

/** Fills route params: toPath(ROUTES.ADMIN.DOCUMENT_DETAIL, { id: 5 }) gives '/admin/documents/5'. */
export function toPath(route, params = {}) {
  return route.replace(/:(\w+)/g, (_, key) => encodeURIComponent(params[key]))
}

// Account roles as stored by the backend (users.role).
export const ROLES = {
  ADMIN: 'admin',
  LEARNING_CENTER: 'center_admin',
}

/** Where each role lands after logging in. */
export const HOME_BY_ROLE = {
  [ROLES.ADMIN]: ROUTES.ADMIN.DASHBOARD,
  [ROLES.LEARNING_CENTER]: ROUTES.CENTER.DASHBOARD,
}
