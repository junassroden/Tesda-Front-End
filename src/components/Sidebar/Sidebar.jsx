import { useLocation } from 'react-router-dom'
import logo from '../../assets/images/tesda-logo.png'
import { useAuth } from '../../hooks/useAuth.js'
import SidebarItem from './SidebarItem.jsx'

/**
 * Brand block (the index header's logo block), the portal's name and office, and grouped nav links.
 * The signed-in user lives in the top bar. items: [{ group, to, label, icon, exact? }]
 */
export default function Sidebar({ title, items }) {
  const { user } = useAuth()
  const { pathname } = useLocation()

  // Only the most specific matching link is active (e.g. "Supply requests" inside "Inventory").
  const activeTo = items
    .filter((i) => (i.exact ? pathname === i.to : pathname === i.to || pathname.startsWith(`${i.to}/`)))
    .sort((a, b) => b.to.length - a.to.length)[0]?.to

  const groups = items.reduce((acc, item) => {
    const key = item.group || 'Menu'
    ;(acc[key] ||= []).push(item)
    return acc
  }, {})

  const office = user?.training_center_name || 'TESDA Region IV-B'

  return (
    <aside className="sidebar">
      <div className="org">
        <span className="org-logo">
          <img src={logo} alt="TESDA" />
        </span>
        <div className="org-text">
          <span className="org-brand">TESDA NEXUS</span>
          <strong>{title}</strong>
          <span className="org-office" title={office}>
            {office}
          </span>
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
        <p className="sidebar-meta">Region IV-B · MIMAROPA</p>
      </div>
    </aside>
  )
}
