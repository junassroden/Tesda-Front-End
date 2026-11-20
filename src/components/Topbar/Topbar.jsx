import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../Icon/Icon.jsx'

// Labels for the sub-pages that follow a nav section in the URL.
const SEGMENT_LABELS = {
  register: 'Register',
  requests: 'Requests',
  batches: 'Batches',
  students: 'Trainees',
}

const today = new Intl.DateTimeFormat('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())

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

/** Sticky bar above every app page: breadcrumbs, a quick "go to page" search (Ctrl/⌘ K), and today's date. */
export default function Topbar({ portal, home, items }) {
  const crumbs = useCrumbs(portal, home, items)
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const matches = items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase())).slice(0, 6)

  const go = (to) => {
    navigate(to)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div className="topbar">
      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <span key={`${c.label}-${i}`} className="crumb">
            {i > 0 && <span className="crumb-sep">/</span>}
            {c.to && i < crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current={i === crumbs.length - 1 ? 'page' : undefined}>{c.label}</span>}
          </span>
        ))}
      </nav>

      <div className="topbar-right">
        <div className="jump">
          <Icon name="search" size={15} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder="Go to page…"
            aria-label="Go to page"
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matches[0]) go(matches[0].to)
              if (e.key === 'Escape') inputRef.current?.blur()
            }}
          />
          <kbd>Ctrl K</kbd>
          {open && matches.length > 0 && (
            <ul className="jump-list" role="listbox">
              {matches.map((m) => (
                <li key={m.to}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => go(m.to)}>
                    <Icon name={m.icon} size={15} />
                    {m.label}
                    <span>{m.group}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <span className="topbar-date">
          <Icon name="calendar" size={15} />
          {today}
        </span>
      </div>
    </div>
  )
}
