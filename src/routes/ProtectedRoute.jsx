import { Navigate, Outlet, useLocation } from 'react-router-dom'
import mark from '../assets/images/tesda-mark.png'
import { HOME_BY_ROLE, ROUTES } from '../constants/routes.js'
import { useAuth } from '../hooks/useAuth.js'

/**
 * Lets through signed-in users whose role is in `roles`.
 * Not signed in: go to /login. Wrong role: go to that user's own home.
 */
export default function ProtectedRoute({ roles }) {
  const { user } = useAuth()
  const location = useLocation()

  if (user === undefined) {
    return (
      <div className="loading-screen" role="status">
        <img src={mark} alt="" />
        <span>Checking your session…</span>
      </div>
    )
  }
  if (!user) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(user.role)) {
    const home = HOME_BY_ROLE[user.role]
    // Roles without a portal yet (student) would loop between pages, so explain instead.
    if (!home) {
      return (
        <div className="loading-screen" role="status">
          <img src={mark} alt="" />
          <span>Your account doesn&apos;t have a portal in TESDA NEXUS yet.</span>
        </div>
      )
    }
    return <Navigate to={home} replace />
  }
  return <Outlet />
}
