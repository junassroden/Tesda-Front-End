import { useLocation, useNavigate } from 'react-router-dom'
import mark from '../../assets/images/tesda-mark.png'
import { ROUTES } from '../../constants/routes.js'
import { useAuth } from '../../hooks/useAuth.js'
import Icon from '../Icon/Icon.jsx'
import SidebarItem from './SidebarItem.jsx'

const ROLE_LABEL = { admin: 'Administrator', center_admin: 'Center admin', instructor: 'Teacher', student: 'Student' }

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'TN'

/** Office header, grouped nav links, and the signed-in user with Logout. items: [{ group, to, label, icon, exact? }] */
export default function Sidebar({ title, items }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Only the most specific matching link is active (e.g. "Supply requests" inside "Inventory").
  const activeTo = items
    .filter((i) => (i.exact ? pathname === i.to : pathname === i.to || pathname.startsWith(`${i.to}/`)))
    .sort((a, b) => b.to.length - a.to.length)[0]?.to

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  const groups = items.reduce((acc, item) => {
    const key = item.group || 'Menu'
    ;(acc[key] ||= []).push(item)
    return acc
  }, {})

  const name = user?.full_name || user?.username || 'Signed in'
  const office = user?.training_center_name || 'TESDA Region IV-B'

  return (
    <aside className="sidebar">
      <div className="org">
        <span className="org-logo">
          <img src={mark} alt="TESDA" />
        </span>
        <div className="org-text">
          <strong>{title}</strong>
          <span title={office}>{office}</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label={title}>
        {Object.entries(groups).map(([group, links]) => (
          <div key={group} className="nav-group">
            <p className="sidebar-label">{group}</p>
            {links.map((item) => (
              <SidebarItem key={item.to} to={item.to} label={item.label} icon={item.icon} active={item.to === activeTo} />
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-user">
          <span className="avatar">{initials(name)}</span>
          <div className="sidebar-user-text">
            <strong>{name}</strong>
            <span className="role-tag">{ROLE_LABEL[user?.role] ?? 'User'}</span>
          </div>
          <button type="button" className="icon-btn" onClick={handleLogout} aria-label="Log out" title="Log out">
            <Icon name="logout" size={17} />
          </button>
        </div>
        <p className="sidebar-meta">TESDA NEXUS · Region IV-B</p>
      </div>
    </aside>
  )
}
