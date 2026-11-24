import { useState } from 'react'
import { Link } from 'react-router-dom'
import regionalOffice from '../../assets/images/bg.png'
import innovationCenter from '../../assets/images/innovation-center.jpg'
import provincialOffice from '../../assets/images/provincial-office.jpg'
import Icon from '../../components/Icon/Icon.jsx'
import { ROUTES } from '../../constants/routes.js'
import { CONTACT } from '../../constants/site.js'
import { useReveal } from '../../hooks/useReveal.js'

const SERVICES = [
  { icon: 'documents', title: 'Document archive', text: 'Scanned uploads, OCR text search, sorting by document type, official letters and memoranda' },
  { icon: 'request', title: 'Supply requests', text: 'Item requests from learning centers, stock checks, approval, delivery and receipt' },
  { icon: 'allowance', title: 'Training allowances', text: 'Allowance requests per batch, trainee checklists, review and release of funds' },
  { icon: 'programs', title: 'Programs and batches', text: 'Course registration, batch scheduling, class lists, and teacher assignments' },
  { icon: 'users', title: 'Trainee records', text: 'Enrollment, requirements, attendance, and completion status for every trainee' },
  { icon: 'shield', title: 'Release ledger', text: 'Hash-linked approvals and releases, a complete audit trail, and tamper-evident records' },
]

// Sample announcements: replace with the regional office's real updates.
const ARTICLES = [
  {
    image: regionalOffice,
    alt: 'The TESDA MIMAROPA regional office building',
    date: 'November 18, 2026',
    title: 'Learning Centers Can Now Follow Supply Requests Through to Delivery',
    text: 'Each request now shows its status at every step, from submission to the center confirming receipt, so neither side has to call to ask.',
  },
  {
    image: innovationCenter,
    alt: 'The TESDA Innovation Center building',
    date: 'October 30, 2026',
    title: 'Scanned Documents Are Now Searchable by What They Say',
    text: 'Uploads are read with OCR when they arrive. A search now finds the words inside a scan, not just the file name.',
  },
]

const RECENT = [
  { image: provincialOffice, date: 'October 12, 2026', title: 'Allowance Checklists Added for Every Training Batch' },
  { image: regionalOffice, date: 'September 25, 2026', title: 'Printed Records Now Carry a QR Code Anyone Can Verify' },
  { image: innovationCenter, date: 'September 3, 2026', title: 'Teachers Can Build Class Lists in Their Own Portal' },
]

const OTHER_SERVICES = [
  { image: provincialOffice, title: 'Record Verification', sub: 'Printed Sheets', to: ROUTES.VERIFY_HOME },
  { image: innovationCenter, title: 'Assessment', sub: 'National Certificates', href: CONTACT.website },
  { image: regionalOffice, title: 'Scholarships', sub: 'TWSP, PESFA, STEP', href: CONTACT.website },
]

const slug = (text) => text.toLowerCase().replaceAll(' ', '-')

function Eyebrow({ children, className = '' }) {
  return <p className={`h-eyebrow ${className}`.trim()}>{children}</p>
}

/** "Get in touch" form. There is no mail backend, so sending opens the visitor's email app with the message filled in. */
function ContactForm() {
  const [form, setForm] = useState({ first: '', last: '', email: '', subject: '', message: '' })
  const update = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }))

  const onSubmit = (event) => {
    event.preventDefault()
    const body = `${form.message}\n\n${form.first} ${form.last}\n${form.email}`
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <form className="h-form" onSubmit={onSubmit}>
      <label>
        <span>First Name</span>
        <input required autoComplete="given-name" value={form.first} onChange={update('first')} />
      </label>
      <label>
        <span>Last Name</span>
        <input required autoComplete="family-name" value={form.last} onChange={update('last')} />
      </label>
      <label>
        <span>E-mail Address</span>
        <input required type="email" autoComplete="email" placeholder="Your e-mail address" value={form.email} onChange={update('email')} />
      </label>
      <label>
        <span>Subject</span>
        <input required placeholder="What is your inquiry about?" value={form.subject} onChange={update('subject')} />
      </label>
      <label className="is-wide">
        <span>Question / Message</span>
        <textarea required rows={6} placeholder="Tell us briefly what you need so we can give you a proper answer." value={form.message} onChange={update('message')} />
      </label>
      <div className="is-wide">
        <button type="submit" className="site-btn h-btn-dark">
          Send Message
        </button>
      </div>
    </form>
  )
}

export default function LandingPage() {
  useReveal()

  return (
    <main id="main">
      {/* Hero */}
      <section className="h-hero" aria-labelledby="hero-title">
        <img className="h-hero-bg" src={regionalOffice} alt="" />
        <div className="site-wrap h-hero-inner rise">
          <Eyebrow>TESDA Region IV-B · MIMAROPA</Eyebrow>
          <h1 id="hero-title">
            Skilled People,
            <br />
            Trusted Records
          </h1>
          <p>
            The shared system of the TESDA MIMAROPA regional office and its learning centers, for supply and allowance requests, official documents, programs, and trainee
            records.
          </p>
          <Link to={ROUTES.LOGIN} className="site-btn h-btn-gold">
            Log in to your portal
          </Link>
        </div>
      </section>

      {/* About */}
      <section id="about" className="h-about" aria-labelledby="about-title">
        <div className="site-wrap" data-reveal>
          <h2 id="about-title" className="h-eyebrow">
            TESDA NEXUS · Region IV-B
          </h2>
          <p>TESDA NEXUS is the shared record of the TESDA MIMAROPA regional office and the learning centers it serves across Mindoro, Marinduque, Romblon, and Palawan.</p>
          <p>We help learning centers request supplies and training allowances, and follow each request from submission through review, approval, and release.</p>
          <p>We keep the region’s official documents in one archive. Every upload is read with OCR, so a document can be found by the words inside it, not just its name.</p>
          <p>
            For programs and trainees, teachers and center administrators register courses, open batches, build class lists, and keep each trainee’s requirements in order. Every
            approval and release is written to a hash-linked ledger, so the record stays complete and any change to it can be seen.
          </p>
          <p>Our portals are open to TESDA personnel, partner learning centers, and teachers. Printed records can be verified by anyone, no account needed.</p>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="h-practice" aria-labelledby="services-title">
        <div className="site-wrap">
          <h2 id="services-title" className="h-eyebrow is-center" data-reveal>
            Our Services
          </h2>
          <div className="h-practice-grid">
            {SERVICES.map((s, i) => (
              <article key={s.title} id={`service-${slug(s.title)}`} className={i === 2 ? 'h-practice-card is-featured' : 'h-practice-card'} data-reveal data-delay={(i % 3) * 60}>
                <Icon name={s.icon} size={50} strokeWidth={1} />
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Updates + other services share one dark band, as on the reference layout */}
      <div className="h-band">
        <section id="news" className="h-news" aria-labelledby="news-title">
          <div className="site-wrap">
            <div className="h-heading" data-reveal>
              <Eyebrow className="is-center">News &amp; Updates</Eyebrow>
              <h2 id="news-title">Announcements</h2>
            </div>
            <div className="h-news-action">
              <a href={CONTACT.website} target="_blank" rel="noreferrer" className="site-btn h-btn-gold is-small">
                View All &gt;
              </a>
            </div>

            <div className="h-news-grid">
              {ARTICLES.map((a, i) => (
                <article key={a.title} className="h-article" data-reveal data-delay={i * 80}>
                  <img src={a.image} alt={a.alt} />
                  <div className="h-article-body">
                    <h3>{a.title}</h3>
                    <p className="h-date">
                      <Icon name="calendar" size={14} />
                      {a.date}
                    </p>
                    <p>{a.text}</p>
                    <a href={CONTACT.website} target="_blank" rel="noreferrer" className="site-btn h-btn-dark is-small">
                      Read More
                    </a>
                  </div>
                </article>
              ))}

              <aside className="h-recent" aria-labelledby="recent-title" data-reveal data-delay="160">
                <h3 id="recent-title">Recent Updates</h3>
                <ul>
                  {RECENT.map((r) => (
                    <li key={r.title}>
                      <img src={r.image} alt="" />
                      <div>
                        <h4>{r.title}</h4>
                        <p className="h-date">
                          <Icon name="calendar" size={14} />
                          {r.date}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </div>
        </section>

        <section className="h-others" aria-labelledby="other-title">
          <div className="site-wrap">
            <div className="h-heading is-light" data-reveal>
              <Eyebrow className="is-center">Other Services</Eyebrow>
              <h2 id="other-title">Beyond the Portal</h2>
            </div>

            <div className="h-others-grid">
              {OTHER_SERVICES.map((s, i) => {
                const button = s.to ? (
                  <Link to={s.to} className="site-btn h-btn-dark is-small">
                    Learn More
                  </Link>
                ) : (
                  <a href={s.href} target="_blank" rel="noreferrer" className="site-btn h-btn-dark is-small">
                    Learn More
                  </a>
                )
                return (
                  <article key={s.title} className="h-other" data-reveal data-delay={i * 80}>
                    <img src={s.image} alt="" />
                    <div className="h-other-card">
                      <h3>{s.title}</h3>
                      <p>{s.sub}</p>
                      {button}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Contact */}
      <section id="contact" className="h-contact" aria-labelledby="contact-title">
        <div className="site-wrap">
          <div className="h-contact-card" data-reveal>
            <div className="h-heading">
              <Eyebrow className="is-center">Contact Us</Eyebrow>
              <h2 id="contact-title">Get in Touch</h2>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  )
}
