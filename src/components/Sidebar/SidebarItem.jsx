import { Link } from 'react-router-dom'
import Icon from '../Icon/Icon.jsx'

/** One sidebar link. The Sidebar decides which single link is active. */
export default function SidebarItem({ to, label, icon, active = false }) {
  return (
    <Link to={to} className={active ? 'sidebar-item active' : 'sidebar-item'} aria-current={active ? 'page' : undefined}>
      {icon && <Icon name={icon} size={17} />}
      <span>{label}</span>
    </Link>
  )
}
