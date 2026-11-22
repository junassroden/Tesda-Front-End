import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes.js'
import { useAuth } from '../../hooks/useAuth.js'
import Icon from '../Icon/Icon.jsx'

const ROLE_LABEL = { admin: 'Main office administrator', center_admin: 'Learning center administrator', instructor: 'Teacher', student: 'Student' }

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'TN'

/** Signed-in user in the top bar: name and role, with office details and Log out in a menu. */
export default function AccountMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleLogout = async () => {
    setBusy(true)
    await logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  const name = user?.full_name || user?.username || 'Signed in'
  const role = ROLE_LABEL[user?.role] ?? 'User'
  const office = user?.training_center_name || 'TESDA Region IV-B · Main office'

  return (
    <div className="account" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        className="account-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account: ${name}`}
      >
        <span className="avatar">{initials(name)}</span>
        <span className="account-text">
          <strong>{name}</strong>
          <span>{role}</span>
        </span>
        <Icon name="chevronDown" size={15} className="account-caret" />
      </button>

      <div className={open ? 'account-menu open' : 'account-menu'} role="menu" aria-hidden={!open}>
        <div className="account-head">
          <strong>{name}</strong>
          <span>{role}</span>
          <span>{office}</span>
        </div>
        <button type="button" role="menuitem" className="account-item" onClick={handleLogout} disabled={busy} tabIndex={open ? 0 : -1}>
          <Icon name="logout" size={16} />
          {busy ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </div>
  )
}
