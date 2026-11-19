import { NavLink } from 'react-router-dom'

/** One sidebar button. NavLink adds the "active" class on the current page. */
export default function SidebarItem({ to, label, exact = false }) {
  return (
    <NavLink to={to} end={exact} className="sidebar-item">
      {label}
    </NavLink>
  )
}
