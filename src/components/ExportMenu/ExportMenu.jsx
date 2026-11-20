import { useEffect, useRef, useState } from 'react'
import Button from '../Button/Button.jsx'
import Icon from '../Icon/Icon.jsx'

const FORMATS = [
  { value: 'excel', label: 'Excel', ext: '.xls' },
  { value: 'pdf', label: 'PDF', ext: '.pdf' },
  { value: 'word', label: 'Word', ext: '.doc' },
]

/** "Export report" button with an Excel / PDF / Word menu. Closes on outside click or Esc. */
export default function ExportMenu({ onSelect, label = 'Export report' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="export-menu" ref={ref}>
      <Button variant="secondary" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu">
        <Icon name="download" size={17} />
        {label}
      </Button>
      {open && (
        <ul className="export-menu-list" role="menu">
          {FORMATS.map((f) => (
            <li key={f.value}>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  onSelect(f.value)
                }}
              >
                {f.label}
                <span>{f.ext}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
