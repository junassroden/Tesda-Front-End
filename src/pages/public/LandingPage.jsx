import innovationCenter from '../../assets/images/innovation-center.jpg'
import Button from '../../components/Button/Button.jsx'
import Icon from '../../components/Icon/Icon.jsx'
import { ROUTES } from '../../constants/routes.js'
import { useReveal } from '../../hooks/useReveal.js'

const STEPS = [
  { title: 'Submitted', text: 'A learning center sends a supply or allowance request.', tone: 'warning' },
  { title: 'Reviewed', text: 'The main office checks stock, budget, and trainee details.', tone: 'info' },
  { title: 'Approved', text: 'The decision goes back to the center with any notes.', tone: 'success' },
  { title: 'Released', text: 'Items or funds go out, and the release is recorded.', tone: 'success' },
]

/** A small, static preview of the admin dashboard, drawn in HTML. */
function AppPreview() {
  return (
    <div className="preview" aria-hidden="true">
      <div className="preview-chrome">
        <i />
        <i />
        <i />
        <span>nexus.tesda-r4b.local/admin</span>
      </div>
      <div className="preview-body">
        <div className="preview-side">
          <b />
          <span className="on" />
          <span />
          <span />
          <span />
        </div>
        <div className="preview-main">
          <p className="preview-title">Main office overview</p>
          <div className="preview-kpis">
            <div>
              <small>Items in stock</small>
              <strong>84</strong>
            </div>
            <div>
              <small>Supply requests</small>
              <strong>3</strong>
            </div>
            <div>
              <small>Allowance</small>
              <strong>₱14k</strong>
            </div>
          </div>
          <ul className="preview-rows">
            <li>
              <span>REQ-0001 · PTC Oriental Mindoro</span>
              <em className="dot warning">Pending</em>
            </li>
            <li>
              <span>REQ-0003 · PTC Palawan</span>
              <em className="dot info">In review</em>
            </li>
            <li>
              <span>ALW-0002 · BPP Batch 2026-01</span>
              <em className="dot success">Released</em>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// Figma: Index page20 (Hero)
export default function LandingPage() {
  useReveal()

  return (
    <main id="main">
      <section className="hero">
        <div className="hero-copy rise">
          <span className="hero-badge">
            <span className="dot-live" />
            TESDA Region IV-B · MIMAROPA
          </span>
          <h1>Requests, records, and student services in one place.</h1>
          <p className="hero-lede">TESDA NEXUS connects the regional office with its learning centers. Supply and allowance requests, official documents, programs, and trainees, all on one shared record.</p>
          <div className="hero-actions">
            <Button to={ROUTES.LOGIN} className="btn-lg" trailingIcon="arrowRight">
              Log in to your portal
            </Button>
            <a href="#how-it-works" className="btn btn-secondary btn-lg">
              See how it works
            </a>
          </div>
          <ul className="hero-points">
            <li>
              <Icon name="check" size={15} /> Four portals, one per role
            </li>
            <li>
              <Icon name="check" size={15} /> Search scans by their text
            </li>
            <li>
              <Icon name="check" size={15} /> Every release on record
            </li>
          </ul>
        </div>

        <div className="hero-visual rise">
          <div className="frame">
            <img src={innovationCenter} alt="The TESDA Innovation Center building" />
          </div>
          <AppPreview />
        </div>
      </section>

      <section id="portals" className="section" aria-labelledby="portals-title">
        <div className="section-head" data-reveal>
          <span className="eyebrow">Portals</span>
          <h2 id="portals-title">Each role gets the tools it needs, and nothing it doesn’t.</h2>
        </div>

        <div className="role-grid">
          <article className="role" data-reveal>
            <div className="role-text">
              <span className="role-icon">
                <Icon name="documents" size={17} />
              </span>
              <h3>Main office administrators</h3>
              <p>Review requests from every learning center, keep the regional archive, and track what was released.</p>
            </div>
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
          </article>

          <article className="role" data-reveal data-delay="60">
            <div className="role-text">
              <span className="role-icon">
                <Icon name="request" size={17} />
              </span>
              <h3>Learning center administrators</h3>
              <p>Request supplies and allowances, follow each request, and keep trainees’ requirements in order.</p>
            </div>
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
          </article>

          <article className="role" data-reveal data-delay="120">
            <div className="role-text">
              <span className="role-icon">
                <Icon name="users" size={17} />
              </span>
              <h3>Teachers</h3>
              <p>Build class lists, open a batch for each program, and assign trainees to it.</p>
            </div>
            <div className="snippet">
              <p className="snippet-title">CSS Batch 2026-01</p>
              {['Juan Dela Cruz', 'Liza Garcia', 'Mark Villanueva'].map((n) => (
                <div key={n} className="snippet-person">
                  <span className="avatar">{n.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
                  {n}
                </div>
              ))}
            </div>
          </article>

          <article className="role" data-reveal data-delay="180">
            <div className="role-text">
              <span className="role-icon">
                <Icon name="programs" size={17} />
              </span>
              <h3>Students</h3>
              <p>See your program, batch schedule, requirements, and allowance updates from anywhere.</p>
            </div>
            <div className="snippet">
              <p className="snippet-title">Computer Systems Servicing NC II</p>
              <div className="snippet-field">
                <small>Requirements</small>
                <span className="num">3 of 4 submitted</span>
              </div>
              <div className="snippet-progress">
                <span style={{ width: '75%' }} />
              </div>
              <div className="snippet-row">
                <span>Training allowance</span>
                <em className="dot success">Released</em>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="how-it-works" className="section" aria-labelledby="flow-title">
        <div className="section-head" data-reveal>
          <span className="eyebrow">How it works</span>
          <h2 id="flow-title">One path for every request.</h2>
          <p>The center and the main office see the same status at every step.</p>
        </div>
        <ol className="timeline">
          {STEPS.map((s, i) => (
            <li key={s.title} data-reveal data-delay={i * 70}>
              <span className={`timeline-dot tone-${s.tone}`} />
              <span className="timeline-step">Step {i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section" aria-labelledby="records-title">
        <div className="section-head" data-reveal>
          <span className="eyebrow">Documents and records</span>
          <h2 id="records-title">Find any file by what it says. Trust every record.</h2>
        </div>
        <div className="feature-pair">
          <article className="feature" data-reveal>
            <h3>Search inside scanned documents</h3>
            <p>Uploads are read with OCR and sorted by type, so you can search for words inside a scan, not just its file name.</p>
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

          <article className="feature" data-reveal data-delay="80">
            <h3>Tamper-evident releases</h3>
            <p>Each approval and release is hash-linked to the one before it, so a changed record stands out right away.</p>
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
      </section>
    </main>
  )
}
