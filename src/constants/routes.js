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
    INVENTORY_ITEM: '/admin/inventory/items/:id',
    INVENTORY_REQUESTS: '/admin/inventory/requests',
    INVENTORY_REQUEST_DETAIL: '/admin/inventory/requests/:id',
    ALLOWANCE: '/admin/allowance',
    ALLOWANCE_CHECKLIST: '/admin/allowance/:id',
    TRAINING: '/admin/training',
    TRAINING_BATCH: '/admin/training/batches/:batchId',
  },

  CENTER: {
    DASHBOARD: '/center',
    // "Programs" in the URL, "Courses" on screen: each course page holds its batches.
    PROGRAMS: '/center/programs',
    REGISTER_PROGRAM: '/center/programs/register',
    EDIT_PROGRAM: '/center/programs/:programId/edit',
    BATCHES: '/center/programs/:programId/batches',
    BATCH: '/center/programs/:programId/batches/:batchId',
    STUDENTS: '/center/programs/:programId/batches/:batchId/students', // older links; opens the batch page
    HISTORY: '/center/history',
    STUDENT_RECORDS: '/center/students',
    STUDENT_RECORD: '/center/students/:studentId',
    AVAILABLE_INVENTORY: '/center/request-inventory',
    REQUEST_ITEM: '/center/request-inventory/:itemId',
    REQUEST_ALLOWANCE: '/center/request-allowance',
    DELIVERY_PERSONNEL: '/center/delivery-personnel',
  },

  TEACHER: {
    DASHBOARD: '/teacher',
    PROGRAMS: '/teacher/programs',
    PROGRAM: '/teacher/programs/:programId',
    STUDENTS: '/teacher/programs/:programId/batches/:batchId',
    CLASSROOMS: '/teacher/classrooms',
    CLASSROOM: '/teacher/classrooms/:batchId',
  },

  STUDENT: {
    DASHBOARD: '/student',
    CLASSROOMS: '/student/classrooms',
    CLASSROOM: '/student/classrooms/:batchId',
    DOCUMENTS: '/student/documents',
    PROFILE: '/student/profile',
  },

  // Print-ready sheets (no sidebar). kind: info | checklist | packet
  PRINT: {
    STUDENT: '/print/students/:studentId/:kind',
    BATCH: '/print/batches/:batchId',
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
  TEACHER: 'instructor',
  STUDENT: 'student',
}

/** Where each role lands after logging in. */
export const HOME_BY_ROLE = {
  [ROLES.ADMIN]: ROUTES.ADMIN.DASHBOARD,
  [ROLES.LEARNING_CENTER]: ROUTES.CENTER.DASHBOARD,
  [ROLES.TEACHER]: ROUTES.TEACHER.DASHBOARD,
  [ROLES.STUDENT]: ROUTES.STUDENT.DASHBOARD,
}
