import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../Icon/Icon.jsx'
import AccountMenu from './AccountMenu.jsx'

// Labels for the sub-pages that follow a nav section in the URL.
const SEGMENT_LABELS = {
  register: 'Register',
  requests: 'Requests',
  batches: 'Batches',
  students: 'Trainees',
  items: 'Item',
  edit: 'Edit',
  classrooms: 'Classrooms',
}

const dateFormat = new Intl.DateTimeFormat('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

/** Today's date, refreshed every minute so a tab left open overnight stays correct. */
function useToday() {
  const [today, setToday] = useState(() => dateFormat.format(new Date()))
  useEffect(() => {
    const id = setInterval(() => setToday(dateFormat.format(new Date())), 60_000)
    return () => clearInterval(id)
  }, [])
  return today
}

/** Breadcrumbs from the URL, built on the sidebar's nav items. */
function useCrumbs(portal, home, items) {
  const { pathname } = useLocation()
  const section = [...items].filter((i) => !i.exact && pathname.startsWith(i.to)).sort((a, b) => b.to.length - a.to.length)[0]
  const crumbs = [{ label: portal, to: home }]
  if (section) {
    crumbs.push({ label: section.label, to: section.to })
    const rest = pathname.slice(section.to.length).split('/').filter(Boolean)
    rest.forEach((seg) => crumbs.push({ label: SEGMENT_LABELS[seg] ?? (/^\d+$/.test(seg) ? `#${seg}` : seg) }))
  } else if (pathname !== home) {
    crumbs.push({ label: 'Page' })
  } else {
    crumbs.push({ label: 'Dashboard' })
  }
  return crumbs
}

/** Sticky bar above every app page: breadcrumbs, today's date, and the account menu. */
export default function Topbar({ portal, home, items }) {
  const crumbs = useCrumbs(portal, home, items)
  const today = useToday()

  return (
    <div className="topbar">
      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <span key={`${c.label}-${i}`} className="crumb">
            {i > 0 && (
              <span className="crumb-sep" aria-hidden="true">
                /
              </span>
            )}
            {c.to && i < crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current={i === crumbs.length - 1 ? 'page' : undefined}>{c.label}</span>}
          </span>
        ))}
      </nav>

      <div className="topbar-right">
        <span className="topbar-date">
          <Icon name="calendar" size={15} />
          {today}
        </span>
        <span className="topbar-divider" aria-hidden="true" />
        <AccountMenu />
      </div>
    </div>
  )
}
