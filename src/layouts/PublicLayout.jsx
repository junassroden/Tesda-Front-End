import { NavLink, Outlet } from 'react-router-dom'
import logo from '../assets/logo.svg'
import { ROUTES } from '../constants/routes.js'

/** Logo on the left; Home · About Us · Login on the right. */
export default function PublicLayout() {
  return (
    <div className="public">
      <header className="public-header">
        <NavLink className="brand" to={ROUTES.HOME} aria-label="TESDA NEXUS home">
          <img src={logo} alt="" />
        </NavLink>
        <nav className="public-nav" aria-label="Main">
          <NavLink to={ROUTES.HOME} end>
            Home
          </NavLink>
          <a href="/#about">About Us</a>
          <NavLink to={ROUTES.LOGIN}>Login</NavLink>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
