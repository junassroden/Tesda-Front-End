import { Link } from 'react-router-dom'
import innovationCenter from '../../assets/images/innovation-center.jpg'
import Icon from '../../components/Icon/Icon.jsx'
import { ROUTES } from '../../constants/routes.js'
import { useReveal } from '../../hooks/useReveal.js'

const SERVICES = [
  { icon: 'documents', title: 'Document archive', text: 'Upload scans once. OCR reads each page, so you can search for the words inside a file, not just its name.' },
  { icon: 'request', title: 'Supply requests', text: 'Learning centers request items from main office stock, then confirm delivery when they arrive.' },
  { icon: 'allowance', title: 'Training allowances', text: 'Request an allowance for a batch and check off each trainee before the funds are released.' },
  { icon: 'programs', title: 'Programs and batches', text: 'Register programs, open batches, and keep each class list current for the whole term.' },
]

const STEPS = [
  { title: 'Submitted', status: 'Pending', tone: 'warning', icon: 'upload', text: 'A learning center sends a supply or allowance request, with the items or the batch it covers.' },
  { title: 'Reviewed', status: 'In review', tone: 'info', icon: 'search', text: 'The main office checks stock, budget, and trainee details before it decides.' },
  { title: 'Approved', status: 'Approved', tone: 'success', icon: 'check', text: 'The decision goes back to the center with any notes from the reviewer.' },
  { title: 'Released', status: 'Released', tone: 'success', icon: 'truck', text: 'Items or funds go out, the center confirms receipt, and the release is recorded.' },
]

const PROVINCES = ['Occidental Mindoro', 'Oriental Mindoro', 'Marinduque', 'Romblon', 'Palawan']

/** "Explore more →" style text link. */
function MoreLink({ href, to, children, light = false }) {
  const className = light ? 'site-more is-light' : 'site-more'
  const body = (
    <>
      {children}
      <Icon name="arrowRight" size={17} />
    </>
  )
  return to ? (
    <Link to={to} className={className}>
      {body}
    </Link>
  ) : (
    <a href={href} className={className}>
      {body}
    </a>
  )
}

function Meta({ kind, detail, light = false }) {
  return (
    <p className={light ? 'site-meta is-light' : 'site-meta'}>
      <span>{kind}</span>
      <span>{detail}</span>
    </p>
  )
}

export default function LandingPage() {
  useReveal()

  return (
    <main id="main">
      {/* Hero */}
      <section className="s-hero">
        <div className="site-wrap s-hero-grid">
          <div className="s-hero-copy rise">
            <p className="s-kicker">TESDA Region IV-B · MIMAROPA</p>
            <h1>Requests, records, and trainee services in one place.</h1>
            <p className="s-lede">TESDA NEXUS connects the regional office with its learning centers: supply and allowance requests, official documents, programs, and trainees on one shared record.</p>
            <div className="s-hero-actions">
              <Link to={ROUTES.LOGIN} className="site-btn site-btn-primary site-btn-lg">
                Log in to your portal
              </Link>
              <MoreLink href="#how-it-works">See how it works</MoreLink>
            </div>
          </div>

          <div className="s-hero-cards rise">
            <a href="#portals" className="s-card s-card-featured">
              <img src={innovationCenter} alt="The TESDA Innovation Center building" />
              <Meta kind="Main office" detail="Region IV-B" />
              <h2>Review every supply and allowance request from one queue</h2>
              <span className="site-more">
                Explore portals
                <Icon name="arrowRight" size={17} />
              </span>
            </a>
            <a href="#services" className="s-card">
              <Meta kind="Learning centers" detail="Requests" />
              <h2>Send a request and follow it all the way to release</h2>
            </a>
            <a href="#records" className="s-card">
              <Meta kind="Records" detail="Archive" />
              <h2>Search scanned documents by the words inside them</h2>
            </a>
          </div>
        </div>
      </section>

      {/* About + services */}
      <section id="about" className="s-about" aria-labelledby="about-title">
        <div className="site-wrap">
          <div className="s-about-head" data-reveal>
            <h2 id="about-title" className="s-title">
              One shared record for TESDA MIMAROPA and its learning centers
            </h2>
            <p className="s-body">
              TESDA NEXUS replaces paper forms and long email threads between the regional office and the learning centers across Mindoro, Marinduque, Romblon, and Palawan. Every request,
              document, and release lives in one place that both sides can see.
            </p>
            <MoreLink href="#how-it-works">See how it works</MoreLink>
          </div>

          <div id="services" className="s-services">
            {SERVICES.map((s, i) => (
              <article key={s.title} className="s-service" data-reveal data-delay={i * 60}>
                <Icon name={s.icon} size={34} />
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="s-dark" aria-labelledby="flow-title">
        <div className="site-wrap">
          <div className="s-head-row" data-reveal>
            <div>
              <h2 id="flow-title" className="s-title">
                How a request moves
              </h2>
              <p className="s-body">The learning center and the main office see the same status at every step.</p>
            </div>
            <MoreLink to={ROUTES.LOGIN} light>
              Log in to start
            </MoreLink>
          </div>

          <ol className="s-steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="s-step" data-reveal data-delay={i * 60}>
                <div className="s-step-num" aria-hidden="true">
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <Icon name={s.icon} size={22} />
                </div>
                <div className="s-step-body">
                  <h3>{s.title}</h3>
                  <p className="s-step-meta">
                    Step {i + 1}
                    <span className={`s-chip tone-${s.tone}`}>{s.status}</span>
                  </p>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Portals */}
      <section id="portals" className="s-plain" aria-labelledby="portals-title">
        <div className="site-wrap">
          <div className="s-head-split" data-reveal>
            <h2 id="portals-title" className="s-title">
              Each role gets the tools it needs, and nothing it doesn’t
            </h2>
            <div>
              <p className="s-body">Your account opens the portal for your role. Main office staff, learning center administrators, and teachers each see their own work.</p>
              <MoreLink to={ROUTES.LOGIN}>Log in to your portal</MoreLink>
            </div>
          </div>

          <div className="s-portals">
            <article className="s-portal" data-reveal>
              <div className="s-portal-visual">
                <div className="snippet">
                  <div className="snippet-row">
                    <span>REQ-0001 · Welding gloves × 4</span>
                    <em className="dot warning">Pending</em>
                  </div>
                  <div className="snippet-row">
                    <span>REQ-0003 · Multimeter × 5</span>
                    <em className="dot info">In review</em>
                  </div>
                  <div className="snippet-actions">
                    <span className="mini-btn ghost">Reject</span>
                    <span className="mini-btn">Approve</span>
                  </div>
                </div>
              </div>
              <span className="s-chip tone-success">
                <Icon name="check" size={13} /> Available
              </span>
              <h3>Main office administrators</h3>
              <p>Review requests from every learning center, keep the regional archive, and track what was released.</p>
            </article>

            <article className="s-portal" data-reveal data-delay="60">
              <div className="s-portal-visual">
                <div className="snippet">
                  <div className="snippet-field">
                    <small>Item</small>
                    <span>Safety goggles</span>
                  </div>
                  <div className="snippet-field">
                    <small>Quantity</small>
                    <span className="num">6</span>
                  </div>
                  <div className="snippet-actions">
                    <span className="mini-btn">Send request</span>
                  </div>
                </div>
              </div>
              <span className="s-chip tone-success">
                <Icon name="check" size={13} /> Available
              </span>
              <h3>Learning center administrators</h3>
              <p>Request supplies and allowances, follow each request, and keep trainees’ requirements in order.</p>
            </article>

            <article className="s-portal" data-reveal data-delay="120">
              <div className="s-portal-visual">
                <div className="snippet">
                  <p className="snippet-title">CSS Batch 2026-01</p>
                  {['Juan Dela Cruz', 'Liza Garcia', 'Mark Villanueva'].map((n) => (
                    <div key={n} className="snippet-person">
                      <span className="avatar">
                        {n
                          .split(' ')
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join('')}
                      </span>
                      {n}
                    </div>
                  ))}
                </div>
              </div>
              <span className="s-chip tone-success">
                <Icon name="check" size={13} /> Available
              </span>
              <h3>Teachers</h3>
              <p>Build class lists, open a batch for each program, and assign trainees to it.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Records */}
      <section id="records" className="s-warm" aria-labelledby="records-title">
        <div className="site-wrap">
          <div className="s-head-row" data-reveal>
            <h2 id="records-title" className="s-title">
              Find any file by what it says, and trust every record
            </h2>
            <MoreLink to={ROUTES.LOGIN}>Open the archive</MoreLink>
          </div>

          <div className="s-records">
            <article className="s-record" data-reveal>
              <div className="s-record-text">
                <Icon name="search" size={28} />
                <h3>Search inside scanned documents</h3>
                <p>Uploads are read with OCR and sorted by type, so a search finds the words inside a scan.</p>
              </div>
              <div className="snippet">
                <div className="snippet-search">
                  <Icon name="search" size={14} />
                  vendor contract
                </div>
                <div className="snippet-doc">
                  <Icon name="documents" size={15} />
                  <div>
                    <span>Supplier_agreement_2026.pdf</span>
                    <small>
                      “…the <mark>vendor contract</mark> is renewed for twelve months…”
                    </small>
                  </div>
                  <em className="tag">Letter</em>
                </div>
              </div>
            </article>

            <article className="s-record" data-reveal data-delay="60">
              <div className="s-record-text">
                <Icon name="shield" size={28} />
                <h3>Tamper-evident releases</h3>
                <p>Each approval and release is hash-linked to the one before it, so a changed record stands out.</p>
              </div>
              <div className="snippet">
                {[
                  ['#2', 'ALW-0002 released', '9c1e…4a7f'],
                  ['#1', 'REQ-0002 released', '3b8d…e210'],
                  ['#0', 'Ledger started', '0000…0000'],
                ].map(([n, label, hash]) => (
                  <div key={n} className="snippet-ledger">
                    <span className="num">{n}</span>
                    <span>{label}</span>
                    <code>{hash}</code>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Region */}
      <section className="s-plain s-region" aria-labelledby="region-title">
        <div className="site-wrap">
          <h2 id="region-title" className="s-title" data-reveal>
            Serving learning centers across MIMAROPA
          </h2>
          <p className="s-body" data-reveal>
            Provincial offices and partner centers in all five provinces of Region IV-B.
          </p>
          <ul className="s-provinces" data-reveal>
            {PROVINCES.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}
