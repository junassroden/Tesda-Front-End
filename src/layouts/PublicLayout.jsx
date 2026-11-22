import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import mark from '../assets/images/tesda-mark.png'
import Icon from '../components/Icon/Icon.jsx'
import { ROUTES } from '../constants/routes.js'

const NAV = [
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#portals', label: 'Portals' },
  { href: '#records', label: 'Records' },
]

/** Header, page, and footer for the public website. */
export default function PublicLayout() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (event) => event.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="site">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className={['site-header', scrolled ? 'is-scrolled' : '', menuOpen ? 'is-open' : ''].filter(Boolean).join(' ')}>
        <div className="site-wrap site-header-row">
          <Link className="site-logo" to={ROUTES.HOME} aria-label="TESDA NEXUS home" onClick={closeMenu}>
            <img src={mark} alt="" />
            <span>
              <strong>TESDA NEXUS</strong>
              <small>Region IV-B</small>
            </span>
          </Link>

          <nav className="site-nav" id="site-nav" aria-label="Main">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} onClick={closeMenu}>
                {item.label}
              </a>
            ))}
            <Link to={ROUTES.LOGIN} className="site-btn site-btn-outline site-nav-login" onClick={closeMenu}>
              Log in
            </Link>
          </nav>

          <Link to={ROUTES.LOGIN} className="site-btn site-btn-outline site-header-login">
            Log in
          </Link>

          <button
            type="button"
            className="site-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Icon name={menuOpen ? 'x' : 'menu'} size={20} />
          </button>
        </div>
      </header>

      <Outlet />

      <footer className="site-footer">
        <div className="site-wrap site-cta">
          <h2>Need an account? Your learning center administrator can set one up.</h2>
          <Link to={ROUTES.LOGIN} className="site-btn site-btn-primary">
            Log in to your portal
          </Link>
        </div>

        <div className="site-footer-main">
          <div className="site-wrap site-footer-grid">
            <div className="site-footer-brand">
              <Link className="site-logo is-light" to={ROUTES.HOME} aria-label="TESDA NEXUS home">
                <img src={mark} alt="" />
                <span>
                  <strong>TESDA NEXUS</strong>
                  <small>Region IV-B</small>
                </span>
              </Link>
              <p>The shared record for the TESDA MIMAROPA regional office and its learning centers.</p>
            </div>

            <div>
              <h3>Quick links</h3>
              <ul>
                {NAV.slice(0, 4).map((item) => (
                  <li key={item.href}>
                    <a href={item.href}>{item.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3>Portals</h3>
              <ul>
                <li>
                  <Link to={ROUTES.LOGIN}>Main office</Link>
                </li>
                <li>
                  <Link to={ROUTES.LOGIN}>Learning centers</Link>
                </li>
                <li>
                  <Link to={ROUTES.LOGIN}>Teachers</Link>
                </li>
              </ul>
            </div>

            <div>
              <h3>Region IV-B</h3>
              <ul>
                <li>Occidental and Oriental Mindoro</li>
                <li>Marinduque, Romblon, Palawan</li>
                <li>
                  <a href="https://www.tesda.gov.ph" target="_blank" rel="noreferrer">
                    tesda.gov.ph
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="site-footer-bottom">
            <div className="site-wrap">
              <span>© {new Date().getFullYear()} Technical Education and Skills Development Authority · Region IV-B (MIMAROPA)</span>
              <span>For TESDA personnel, partner learning centers, and enrolled trainees.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
