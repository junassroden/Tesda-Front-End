import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar.jsx'
import Topbar from '../components/Topbar/Topbar.jsx'
import { LEARNING_CENTER_NAV } from '../constants/navItems.js'
import { ROUTES } from '../constants/routes.js'

/** Learning center sidebar + top bar + the current page. */
export default function LearningCenterLayout() {
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar title="Learning center" items={LEARNING_CENTER_NAV} />
      <div className="app-column">
        <Topbar portal="Learning center" home={ROUTES.CENTER.DASHBOARD} items={LEARNING_CENTER_NAV} />
        <main id="main" className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
