import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar.jsx'
import Topbar from '../components/Topbar/Topbar.jsx'
import { ADMIN_NAV } from '../constants/navItems.js'
import { ROUTES } from '../constants/routes.js'

/** Main office sidebar + top bar + the current admin page. */
export default function AdminLayout() {
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar title="Main office" items={ADMIN_NAV} />
      <div className="app-column">
        <Topbar portal="Main office" home={ROUTES.ADMIN.DASHBOARD} items={ADMIN_NAV} />
        <main id="main" className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
