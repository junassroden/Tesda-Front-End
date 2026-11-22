import { useEffect, useRef } from 'react'
import Icon from '../Icon/Icon.jsx'

/** Detail popup (the "Description" frame). Closes on Esc, the backdrop, or the × button. */
export default function Modal({ open, title, onClose, children, footer }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} className="modal" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="modal-box">
        <header className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </dialog>
  )
}
