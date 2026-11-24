import { lazy, Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar.jsx'
import Topbar from '../components/Topbar/Topbar.jsx'
import { PortalProvider } from '../context/PortalContext.jsx'

// Loaded only in the portals that show it (main office).
const ArchiveAssistant = lazy(() => import('../components/ArchiveAssistant/ArchiveAssistant.jsx'))

function PageLoading() {
  return (
    <div className="page-loading" role="status">
      <span className="page-loading-bar" />
      <span className="visually-hidden">Loading page…</span>
    </div>
  )
}

/**
 * Sidebar + top bar + the current page, for every signed-in portal.
 * title: the portal's name. items: its sidebar links. home: its dashboard path.
 * assistant: show the "Ask the archive" document chat (main office only).
 */
export default function PortalLayout({ title, items, home, assistant = false }) {
  return (
    <PortalProvider value={title}>
      <div className="app-shell">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Sidebar title={title} items={items} />
        <div className="app-column">
          <Topbar portal={title} home={home} items={items} />
          <main id="main" className="app-main">
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
        {assistant && (
          <Suspense fallback={null}>
            <ArchiveAssistant />
          </Suspense>
        )}
      </div>
    </PortalProvider>
  )
}
