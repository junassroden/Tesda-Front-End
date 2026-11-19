import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar.jsx'
import { LEARNING_CENTER_NAV } from '../constants/navItems.js'

/** Sidebar "LEARNING CENTER PAGE" + the current learning center page. */
export default function LearningCenterLayout() {
  return (
    <div className="app-shell">
      <Sidebar title="LEARNING CENTER PAGE" items={LEARNING_CENTER_NAV} />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
