import { Navigate, Route, Routes } from 'react-router-dom'
import { ROLES, ROUTES } from '../constants/routes.js'
import AdminLayout from '../layouts/AdminLayout.jsx'
import LearningCenterLayout from '../layouts/LearningCenterLayout.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'
import StudentLayout from '../layouts/StudentLayout.jsx'
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
import BatchPage from '../pages/learning-center/programs/BatchPage.jsx'
import StudentListPage from '../pages/learning-center/programs/StudentListPage.jsx'
import BatchHistoryPage from '../pages/learning-center/BatchHistoryPage.jsx'
import StudentRecordsPage from '../pages/learning-center/students/StudentRecordsPage.jsx'
import StudentRecordPage from '../pages/learning-center/students/StudentRecordPage.jsx'
import AvailableInventoryPage from '../pages/learning-center/request-inventory/AvailableInventoryPage.jsx'
import RequestItemPage from '../pages/learning-center/request-inventory/RequestItemPage.jsx'
import RequestAllowancePage from '../pages/learning-center/RequestAllowancePage.jsx'
import DeliveryPersonnelPage from '../pages/learning-center/DeliveryPersonnelPage.jsx'

import TeacherDashboard from '../pages/teacher/TeacherDashboard.jsx'
import TeacherProgramsPage from '../pages/teacher/TeacherProgramsPage.jsx'
import TeacherProgramPage from '../pages/teacher/TeacherProgramPage.jsx'

import ClassroomPage from '../pages/classroom/ClassroomPage.jsx'
import ClassroomsPage from '../pages/classroom/ClassroomsPage.jsx'
import MyDocumentsPage from '../pages/student/MyDocumentsPage.jsx'
import StudentDashboard from '../pages/student/StudentDashboard.jsx'
import StudentProfilePage from '../pages/student/StudentProfilePage.jsx'

import PrintBatchPage from '../pages/print/PrintBatchPage.jsx'
import PrintStudentPage from '../pages/print/PrintStudentPage.jsx'

const { ADMIN: A, CENTER: C, TEACHER: T, STUDENT: S, PRINT: P } = ROUTES

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
          <Route path={A.TRAINING} element={<BatchHistoryPage portal="admin" />} />
          <Route path={A.TRAINING_BATCH} element={<BatchPage portal="admin" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.LEARNING_CENTER]} />}>
        <Route element={<LearningCenterLayout />}>
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
          <Route path={T.CLASSROOMS} element={<ClassroomsPage portal="teacher" />} />
          <Route path={T.CLASSROOM} element={<ClassroomPage portal="teacher" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.STUDENT]} />}>
        <Route element={<StudentLayout />}>
          <Route path={S.DASHBOARD} element={<StudentDashboard />} />
          <Route path={S.CLASSROOMS} element={<ClassroomsPage portal="student" />} />
          <Route path={S.CLASSROOM} element={<ClassroomPage portal="student" />} />
          <Route path={S.DOCUMENTS} element={<MyDocumentsPage />} />
          <Route path={S.PROFILE} element={<StudentProfilePage />} />
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
  )
}
