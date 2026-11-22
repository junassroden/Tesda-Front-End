import { Navigate, Route, Routes } from 'react-router-dom'
import { ROLES, ROUTES } from '../constants/routes.js'
import AdminLayout from '../layouts/AdminLayout.jsx'
import LearningCenterLayout from '../layouts/LearningCenterLayout.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'
import TeacherLayout from '../layouts/TeacherLayout.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'

import LandingPage from '../pages/public/LandingPage.jsx'
import LoginPage from '../pages/public/LoginPage.jsx'

import AdminDashboard from '../pages/admin/AdminDashboard.jsx'
import DocumentsPage from '../pages/admin/documents/DocumentsPage.jsx'
import DocumentDetailPage from '../pages/admin/documents/DocumentDetailPage.jsx'
import InventoryItemPage from '../pages/admin/inventory/InventoryItemPage.jsx'
import InventoryPage from '../pages/admin/inventory/InventoryPage.jsx'
import RegisterItemPage from '../pages/admin/inventory/RegisterItemPage.jsx'
import InventoryRequestsPage from '../pages/admin/inventory/InventoryRequestsPage.jsx'
import InventoryRequestDetailPage from '../pages/admin/inventory/InventoryRequestDetailPage.jsx'
import AllowanceTrackerPage from '../pages/admin/allowance/AllowanceTrackerPage.jsx'
import AllowanceChecklistPage from '../pages/admin/allowance/AllowanceChecklistPage.jsx'

import LCDashboard from '../pages/learning-center/LCDashboard.jsx'
import ProgramListPage from '../pages/learning-center/programs/ProgramListPage.jsx'
import RegisterProgramPage from '../pages/learning-center/programs/RegisterProgramPage.jsx'
import BatchListPage from '../pages/learning-center/programs/BatchListPage.jsx'
import StudentListPage from '../pages/learning-center/programs/StudentListPage.jsx'
import AvailableInventoryPage from '../pages/learning-center/request-inventory/AvailableInventoryPage.jsx'
import RequestItemPage from '../pages/learning-center/request-inventory/RequestItemPage.jsx'
import RequestAllowancePage from '../pages/learning-center/RequestAllowancePage.jsx'
import DeliveryPersonnelPage from '../pages/learning-center/DeliveryPersonnelPage.jsx'

import TeacherDashboard from '../pages/teacher/TeacherDashboard.jsx'
import TeacherProgramsPage from '../pages/teacher/TeacherProgramsPage.jsx'
import TeacherProgramPage from '../pages/teacher/TeacherProgramPage.jsx'

const { ADMIN: A, CENTER: C, TEACHER: T } = ROUTES

/** All routes in one place. */
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.HOME} element={<LandingPage />} />
      </Route>
      {/* Login has no site header in Figma. */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />

      <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
        <Route element={<AdminLayout />}>
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
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.LEARNING_CENTER]} />}>
        <Route element={<LearningCenterLayout />}>
          <Route path={C.DASHBOARD} element={<LCDashboard />} />
          <Route path={C.PROGRAMS} element={<ProgramListPage />} />
          <Route path={C.REGISTER_PROGRAM} element={<RegisterProgramPage />} />
          <Route path={C.BATCHES} element={<BatchListPage />} />
          <Route path={C.STUDENTS} element={<StudentListPage />} />
          <Route path={C.AVAILABLE_INVENTORY} element={<AvailableInventoryPage />} />
          <Route path={C.REQUEST_ITEM} element={<RequestItemPage />} />
          <Route path={C.REQUEST_ALLOWANCE} element={<RequestAllowancePage />} />
          <Route path={C.DELIVERY_PERSONNEL} element={<DeliveryPersonnelPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.TEACHER]} />}>
        <Route element={<TeacherLayout />}>
          <Route path={T.DASHBOARD} element={<TeacherDashboard />} />
          <Route path={T.PROGRAMS} element={<TeacherProgramsPage />} />
          <Route path={T.PROGRAM} element={<TeacherProgramPage />} />
          <Route path={T.STUDENTS} element={<StudentListPage portal="teacher" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}
