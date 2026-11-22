import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar.jsx'
import Topbar from '../components/Topbar/Topbar.jsx'
import { TEACHER_NAV } from '../constants/navItems.js'
import { ROUTES } from '../constants/routes.js'

/** Teacher sidebar + top bar + the current page. */
export default function TeacherLayout() {
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar title="Teacher" items={TEACHER_NAV} />
      <div className="app-column">
        <Topbar portal="Teacher" home={ROUTES.TEACHER.DASHBOARD} items={TEACHER_NAV} />
        <main id="main" className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
