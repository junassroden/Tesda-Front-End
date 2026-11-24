import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { ROLES, ROUTES } from '../constants/routes.js'
import PublicLayout from '../layouts/PublicLayout.jsx'
import PortalLayout from '../layouts/PortalLayout.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import { ADMIN_NAV, DELIVERY_NAV, INVENTORY_NAV, LEARNING_CENTER_NAV, STUDENT_NAV, TEACHER_NAV } from '../constants/navItems.js'

import LandingPage from '../pages/public/LandingPage.jsx'
const LoginPage = lazy(() => import('../pages/public/LoginPage.jsx'))
const VerifyPage = lazy(() => import('../pages/public/VerifyPage.jsx'))

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard.jsx'))
const DocumentsPage = lazy(() => import('../pages/admin/documents/DocumentsPage.jsx'))
const DocumentDetailPage = lazy(() => import('../pages/admin/documents/DocumentDetailPage.jsx'))
const InventoryItemPage = lazy(() => import('../pages/admin/inventory/InventoryItemPage.jsx'))
const InventoryPage = lazy(() => import('../pages/admin/inventory/InventoryPage.jsx'))
const RegisterItemPage = lazy(() => import('../pages/admin/inventory/RegisterItemPage.jsx'))
const InventoryRequestsPage = lazy(() => import('../pages/admin/inventory/InventoryRequestsPage.jsx'))
const InventoryRequestDetailPage = lazy(() => import('../pages/admin/inventory/InventoryRequestDetailPage.jsx'))
const AllowanceTrackerPage = lazy(() => import('../pages/admin/allowance/AllowanceTrackerPage.jsx'))
const AllowanceChecklistPage = lazy(() => import('../pages/admin/allowance/AllowanceChecklistPage.jsx'))
const StaffPage = lazy(() => import('../pages/admin/StaffPage.jsx'))
const LedgerPage = lazy(() => import('../pages/admin/LedgerPage.jsx'))

const LCDashboard = lazy(() => import('../pages/learning-center/LCDashboard.jsx'))
const ProgramListPage = lazy(() => import('../pages/learning-center/programs/ProgramListPage.jsx'))
const RegisterProgramPage = lazy(() => import('../pages/learning-center/programs/RegisterProgramPage.jsx'))
const BatchListPage = lazy(() => import('../pages/learning-center/programs/BatchListPage.jsx'))
const BatchPage = lazy(() => import('../pages/learning-center/programs/BatchPage.jsx'))
const StudentListPage = lazy(() => import('../pages/learning-center/programs/StudentListPage.jsx'))
const BatchHistoryPage = lazy(() => import('../pages/learning-center/BatchHistoryPage.jsx'))
const StudentRecordsPage = lazy(() => import('../pages/learning-center/students/StudentRecordsPage.jsx'))
const StudentRecordPage = lazy(() => import('../pages/learning-center/students/StudentRecordPage.jsx'))
const AvailableInventoryPage = lazy(() => import('../pages/learning-center/request-inventory/AvailableInventoryPage.jsx'))
const RequestAllowancePage = lazy(() => import('../pages/learning-center/RequestAllowancePage.jsx'))
const DeliveryPersonnelPage = lazy(() => import('../pages/learning-center/DeliveryPersonnelPage.jsx'))
const CenterInventoryRequestsPage = lazy(() => import('../pages/learning-center/inventory-requests/InventoryRequestsPage.jsx'))
const InventoryRequestFormPage = lazy(() => import('../pages/learning-center/inventory-requests/InventoryRequestFormPage.jsx'))
const CenterInventoryRequestPage = lazy(() => import('../pages/learning-center/inventory-requests/InventoryRequestPage.jsx'))

const ProcessingListPage = lazy(() => import('../pages/inventory/ProcessingListPage.jsx'))
const ProcessingRequestPage = lazy(() => import('../pages/inventory/ProcessingRequestPage.jsx'))
const DeliveriesPage = lazy(() => import('../pages/delivery/DeliveriesPage.jsx'))
const DeliveryDetailPage = lazy(() => import('../pages/delivery/DeliveryDetailPage.jsx'))
const ScanPage = lazy(() => import('../pages/delivery/ScanPage.jsx'))

const TeacherDashboard = lazy(() => import('../pages/teacher/TeacherDashboard.jsx'))
const TeacherProgramsPage = lazy(() => import('../pages/teacher/TeacherProgramsPage.jsx'))
const TeacherProgramPage = lazy(() => import('../pages/teacher/TeacherProgramPage.jsx'))

const ClassroomPage = lazy(() => import('../pages/classroom/ClassroomPage.jsx'))
const ClassroomsPage = lazy(() => import('../pages/classroom/ClassroomsPage.jsx'))
const MyDocumentsPage = lazy(() => import('../pages/student/MyDocumentsPage.jsx'))
const StudentDashboard = lazy(() => import('../pages/student/StudentDashboard.jsx'))
const StudentProfilePage = lazy(() => import('../pages/student/StudentProfilePage.jsx'))

const PrintBatchPage = lazy(() => import('../pages/print/PrintBatchPage.jsx'))
const PrintStudentPage = lazy(() => import('../pages/print/PrintStudentPage.jsx'))

const { ADMIN: A, CENTER: C, TEACHER: T, STUDENT: S, PRINT: P, INVENTORY: I, DELIVERY: D } = ROUTES

/** Old item links open a new request with that item already listed. */
function RequestItemRedirect() {
  const { itemId } = useParams()
  return <Navigate to={`${C.NEW_INVENTORY_REQUEST}?item=${encodeURIComponent(itemId)}`} replace />
}

/** Full-screen fallback while a page outside the portal shell (login, verify, print) loads. */
function ScreenLoading() {
  return <div className="page-loading is-screen" role="status"><span className="page-loading-bar" /><span className="visually-hidden">Loading…</span></div>
}

/** All routes in one place. Every page except the landing page is loaded on demand. */
export default function AppRoutes() {
  return (
    <Suspense fallback={<ScreenLoading />}>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.HOME} element={<LandingPage />} />
      </Route>
      {/* Login has no site header in Figma. */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      {/* Public: anyone can check a printed sheet's QR code. */}
      <Route path={ROUTES.VERIFY_HOME} element={<VerifyPage />} />
      <Route path={ROUTES.VERIFY} element={<VerifyPage />} />

      <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
        <Route element={<PortalLayout title="Main office" items={ADMIN_NAV} home={A.DASHBOARD} assistant />}>
          <Route path={A.DASHBOARD} element={<AdminDashboard />} />
          <Route path={A.DOCUMENTS} element={<DocumentsPage />} />
          <Route path={A.DOCUMENT_DETAIL} element={<DocumentDetailPage />} />
          <Route path={A.INVENTORY} element={<InventoryPage />} />
          <Route path={A.REGISTER_ITEM} element={<RegisterItemPage />} />
          <Route path={A.INVENTORY_ITEM} element={<InventoryItemPage />} />
          <Route path={A.INVENTORY_REQUESTS} element={<InventoryRequestsPage />} />
          <Route path={A.INVENTORY_REQUEST_DETAIL} element={<InventoryRequestDetailPage />} />
          <Route path={A.ALLOWANCE} element={<AllowanceTrackerPage />} />
          <Route path={A.ALLOWANCE_CHECKLIST} element={<AllowanceChecklistPage />} />
          <Route path={A.TRAINING} element={<BatchHistoryPage portal="admin" />} />
          <Route path={A.STAFF} element={<StaffPage />} />
          <Route path={A.LEDGER} element={<LedgerPage />} />
          <Route path={A.TRAINING_BATCH} element={<BatchPage portal="admin" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.LEARNING_CENTER]} />}>
        <Route element={<PortalLayout title="Learning center" items={LEARNING_CENTER_NAV} home={C.DASHBOARD} />}>
          <Route path={C.DASHBOARD} element={<LCDashboard />} />
          <Route path={C.PROGRAMS} element={<ProgramListPage />} />
          <Route path={C.REGISTER_PROGRAM} element={<RegisterProgramPage />} />
          <Route path={C.EDIT_PROGRAM} element={<RegisterProgramPage />} />
          <Route path={C.BATCHES} element={<BatchListPage />} />
          <Route path={C.BATCH} element={<BatchPage />} />
          <Route path={C.STUDENTS} element={<BatchPage />} />
          <Route path={C.HISTORY} element={<BatchHistoryPage />} />
          <Route path={C.STUDENT_RECORDS} element={<StudentRecordsPage />} />
          <Route path={C.STUDENT_RECORD} element={<StudentRecordPage />} />
          <Route path={C.AVAILABLE_INVENTORY} element={<AvailableInventoryPage />} />
          <Route path={C.REQUEST_ITEM} element={<RequestItemRedirect />} />
          <Route path={C.INVENTORY_REQUESTS} element={<CenterInventoryRequestsPage />} />
          <Route path={C.NEW_INVENTORY_REQUEST} element={<InventoryRequestFormPage />} />
          <Route path={C.EDIT_INVENTORY_REQUEST} element={<InventoryRequestFormPage />} />
          <Route path={C.INVENTORY_REQUEST} element={<CenterInventoryRequestPage />} />
          <Route path={C.REQUEST_ALLOWANCE} element={<RequestAllowancePage />} />
          <Route path={C.DELIVERY_PERSONNEL} element={<DeliveryPersonnelPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.TEACHER]} />}>
        <Route element={<PortalLayout title="Teacher" items={TEACHER_NAV} home={T.DASHBOARD} />}>
          <Route path={T.DASHBOARD} element={<TeacherDashboard />} />
          <Route path={T.PROGRAMS} element={<TeacherProgramsPage />} />
          <Route path={T.PROGRAM} element={<TeacherProgramPage />} />
          <Route path={T.STUDENTS} element={<StudentListPage portal="teacher" />} />
          <Route path={T.CLASSROOMS} element={<ClassroomsPage portal="teacher" />} />
          <Route path={T.CLASSROOM} element={<ClassroomPage portal="teacher" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.STUDENT]} />}>
        <Route element={<PortalLayout title="Student" items={STUDENT_NAV} home={S.DASHBOARD} />}>
          <Route path={S.DASHBOARD} element={<StudentDashboard />} />
          <Route path={S.CLASSROOMS} element={<ClassroomsPage portal="student" />} />
          <Route path={S.CLASSROOM} element={<ClassroomPage portal="student" />} />
          <Route path={S.DOCUMENTS} element={<MyDocumentsPage />} />
          <Route path={S.PROFILE} element={<StudentProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.INVENTORY]} />}>
        <Route element={<PortalLayout title="Inventory personnel" items={INVENTORY_NAV} home={I.DASHBOARD} />}>
          <Route path={I.DASHBOARD} element={<ProcessingListPage />} />
          <Route path={I.REQUEST} element={<ProcessingRequestPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.DELIVERY]} />}>
        <Route element={<PortalLayout title="Delivery personnel" items={DELIVERY_NAV} home={D.DASHBOARD} />}>
          <Route path={D.DASHBOARD} element={<DeliveriesPage />} />
          <Route path={D.SCAN} element={<ScanPage />} />
          <Route path={D.DETAIL} element={<DeliveryDetailPage />} />
          <Route path={D.HISTORY} element={<DeliveriesPage history />} />
        </Route>
      </Route>

      {/* Print-ready sheets open in their own tab, without the portal chrome. */}
      <Route element={<ProtectedRoute roles={[ROLES.LEARNING_CENTER]} />}>
        <Route path={P.STUDENT} element={<PrintStudentPage />} />
      </Route>
      <Route element={<ProtectedRoute roles={[ROLES.LEARNING_CENTER, ROLES.ADMIN]} />}>
        <Route path={P.BATCH} element={<PrintBatchPage />} />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
    </Suspense>
  )
}
