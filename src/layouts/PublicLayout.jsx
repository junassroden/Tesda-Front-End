import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import logo from '../assets/images/tesda-logo.png'
import Icon from '../components/Icon/Icon.jsx'
import { ROUTES } from '../constants/routes.js'
import { CONTACT, SITE_NAV } from '../constants/site.js'

const slug = (text) => text.toLowerCase().replaceAll(' ', '-')

/** Header (logo block, contact row, nav), page, and footer for the public website. */
export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (event) => event.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="site" id="top">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className={menuOpen ? 'site-header is-open' : 'site-header'}>
        <div className="site-wrap site-header-row">
          <Link className="site-logo" to={ROUTES.HOME} aria-label="TESDA NEXUS home" onClick={closeMenu}>
            <img src={logo} alt="" />
            <span>TESDA NEXUS</span>
          </Link>

          <div className="site-header-main">
            <div className="site-header-top">
              <ul className="site-header-contact">
                <li>
                  <Icon name="mail" size={15} />
                  <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                </li>
                <li aria-hidden="true" className="site-dash" />
                <li>
                  <Icon name="phone" size={15} />
                  <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
                </li>
              </ul>
              <div className="site-header-social">
                <a href={CONTACT.facebook} target="_blank" rel="noreferrer" aria-label="TESDA on Facebook">
                  <Icon name="facebook" size={17} />
                </a>
                <a href={CONTACT.website} target="_blank" rel="noreferrer" aria-label="tesda.gov.ph">
                  <Icon name="globe" size={17} />
                </a>
              </div>
            </div>

            <div className="site-header-bottom">
              <nav className="site-nav" id="site-nav" aria-label="Main">
                <ul>
                  {SITE_NAV.map((item, i) => (
                    <li key={item.href} className={item.children ? 'has-sub' : undefined}>
                      <a href={item.href} className={i === 0 ? 'is-current' : undefined} onClick={closeMenu}>
                        {item.label}
                        {item.children && <Icon name="chevronDown" size={14} />}
                      </a>
                      {item.children && (
                        <ul className="site-subnav">
                          {item.children.map((child) => (
                            <li key={child}>
                              <a href={`#service-${slug(child)}`} onClick={closeMenu}>
                                {child}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
                <Link to={ROUTES.LOGIN} className="site-btn site-nav-login" onClick={closeMenu}>
                  Log in to your portal
                </Link>
              </nav>

              <Link to={ROUTES.LOGIN} className="site-btn site-header-cta">
                Log in to your portal
              </Link>

              <button
                type="button"
                className="site-menu-btn"
                aria-expanded={menuOpen}
                aria-controls="site-nav"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <Icon name={menuOpen ? 'x' : 'menu'} size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <Outlet />

      <footer className="site-footer">
        <div className="site-wrap site-footer-grid">
          <div>
            <h3>Quick Links</h3>
            <ul className="site-footer-links">
              {SITE_NAV.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Useful Links</h3>
            <ul className="site-footer-links">
              <li>
                <Link to={ROUTES.LOGIN}>Portal log in</Link>
              </li>
              <li>
                <Link to={ROUTES.VERIFY_HOME}>Verify a record</Link>
              </li>
              <li>
                <a href={CONTACT.website} target="_blank" rel="noreferrer">
                  tesda.gov.ph
                </a>
              </li>
            </ul>
          </div>

          <Link className="site-footer-logo" to={ROUTES.HOME} aria-label="TESDA NEXUS home">
            <img src={logo} alt="" />
            <strong>TESDA NEXUS</strong>
            <small>Region IV-B · MIMAROPA</small>
          </Link>

          <div className="site-footer-contact">
            <h3>For Inquiries:</h3>
            <a href={CONTACT.phoneHref} className="site-footer-phone">
              <span>
                <Icon name="phone" size={22} />
              </span>
              {CONTACT.phone}
            </a>
            <ul>
              <li>
                <Icon name="mail" size={16} />
                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              </li>
              <li>
                <Icon name="mapPin" size={16} />
                <span>TESDA {CONTACT.region}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-wrap site-footer-social">
          <a href={CONTACT.facebook} target="_blank" rel="noreferrer" aria-label="TESDA on Facebook">
            <Icon name="facebook" size={16} />
          </a>
          <a href={CONTACT.website} target="_blank" rel="noreferrer" aria-label="tesda.gov.ph">
            <Icon name="globe" size={16} />
          </a>
          <a href={`mailto:${CONTACT.email}`} aria-label="Email TESDA">
            <Icon name="mail" size={16} />
          </a>
        </div>

        <div className="site-wrap site-footer-bottom">
          <p>Copyright © {new Date().getFullYear()} Technical Education and Skills Development Authority · Region IV-B (MIMAROPA). All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  )
}
