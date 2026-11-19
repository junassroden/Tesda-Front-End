import { useEffect, useRef, useState } from 'react'
import Button from '../Button/Button.jsx'

const FORMATS = [
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'Pdf' },
  { value: 'word', label: 'Word' },
]

/** "Export report" button with an Excel / Pdf / Word dropdown. */
export default function ExportMenu({ onSelect, label = 'Export report' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="export-menu" ref={ref}>
      <Button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu">
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
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
