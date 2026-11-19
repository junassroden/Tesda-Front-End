import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { HOME_BY_ROLE, ROUTES } from '../constants/routes.js'
import { useAuth } from '../hooks/useAuth.js'

/**
 * Lets through signed-in users whose role is in `roles`.
 * Not signed in: go to /login. Wrong role: go to that user's own home.
 */
export default function ProtectedRoute({ roles }) {
  const { user } = useAuth()
  const location = useLocation()

  if (user === undefined) return <p className="loading">Loading…</p>
  if (!user) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(user.role)) {
    const home = HOME_BY_ROLE[user.role]
    // Roles without a portal (instructor, student) would loop between pages, so show a message instead.
    if (!home) return <p className="loading">Your account has no portal in TESDA NEXUS yet.</p>
    return <Navigate to={home} replace />
  }
  return <Outlet />
}
