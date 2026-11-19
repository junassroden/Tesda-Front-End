import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.svg'
import { ROUTES } from '../../constants/routes.js'
import { useAuth } from '../../hooks/useAuth.js'
import SidebarItem from './SidebarItem.jsx'

/** Logo, "TESDA NEXUS" + role label, nav buttons, and Logout at the bottom. items: [{ to, label, exact? }] */
export default function Sidebar({ title, items }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logo} alt="" />
        <div>
          <strong>TESDA NEXUS</strong>
          <span>{title}</span>
        </div>
      </div>
      <nav className="sidebar-nav" aria-label={title}>
        {items.map((item) => (
          <SidebarItem key={item.to} {...item} />
        ))}
      </nav>
      <button type="button" className="sidebar-item sidebar-logout" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  )
}
