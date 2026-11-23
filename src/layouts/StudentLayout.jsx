import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar.jsx'
import Topbar from '../components/Topbar/Topbar.jsx'
import { STUDENT_NAV } from '../constants/navItems.js'
import { ROUTES } from '../constants/routes.js'

/** Student sidebar + top bar + the current page. */
export default function StudentLayout() {
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar title="Student" items={STUDENT_NAV} />
      <div className="app-column">
        <Topbar portal="Student" home={ROUTES.STUDENT.DASHBOARD} items={STUDENT_NAV} />
        <main id="main" className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
