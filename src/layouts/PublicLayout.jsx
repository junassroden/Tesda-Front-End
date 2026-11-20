import { Link, Outlet } from 'react-router-dom'
import mark from '../assets/images/tesda-mark.png'
import Button from '../components/Button/Button.jsx'
import { ROUTES } from '../constants/routes.js'

/** Top bar + footer around the public pages. */
export default function PublicLayout() {
  return (
    <div className="public">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="island-wrap">
        <nav className="island" aria-label="Main">
          <Link className="brand" to={ROUTES.HOME} aria-label="TESDA NEXUS home">
            <img src={mark} alt="" />
            <span className="brand-text">
              <strong>TESDA NEXUS</strong>
              <span>Region IV-B</span>
            </span>
          </Link>
          <div className="island-links">
            <a href="#portals">Portals</a>
            <a href="#how-it-works">How it works</a>
          </div>
          <Button to={ROUTES.LOGIN}>Log in</Button>
        </nav>
      </header>

      <Outlet />

      <footer className="site-footer">
        <div className="site-footer-inner">
          <span>© {new Date().getFullYear()} Technical Education and Skills Development Authority · Region IV-B (MIMAROPA)</span>
          <span>For TESDA personnel, partner learning centers, and enrolled trainees.</span>
        </div>
      </footer>
    </div>
  )
}
