import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar.jsx'
import { ADMIN_NAV } from '../constants/navItems.js'

/** Sidebar "ADMIN PAGE" + the current admin page. */
export default function AdminLayout() {
  return (
    <div className="app-shell">
      <Sidebar title="ADMIN PAGE" items={ADMIN_NAV} />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
