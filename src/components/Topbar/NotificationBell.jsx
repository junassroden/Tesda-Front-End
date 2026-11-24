import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES, toPath } from '../../constants/routes.js'
import { useAuth } from '../../hooks/useAuth.js'
import { notificationService } from '../../services/requestService.js'
import { timeAgo } from '../../utils/format.js'
import Icon from '../Icon/Icon.jsx'

const REFRESH_MS = 60_000

/** Where a notification leads, for the signed-in user's role. */
function linkFor(n, role) {
  if (n.entity_type === 'inventory_request') {
    const route = { center_admin: ROUTES.CENTER.INVENTORY_REQUEST, admin: ROUTES.ADMIN.INVENTORY_REQUEST_DETAIL, inventory_staff: ROUTES.INVENTORY.REQUEST }[role]
    return route ? toPath(route, { id: n.entity_id }) : null
  }
  if (n.entity_type === 'inventory_delivery' && role === 'delivery_staff') return toPath(ROUTES.DELIVERY.DETAIL, { id: n.entity_id })
  if (n.entity_type === 'student_document' && role === 'student') return ROUTES.STUDENT.DOCUMENTS
  if (n.entity_type === 'classroom_submission' && role === 'student') return ROUTES.STUDENT.CLASSROOMS
  return null
}

/** Top bar bell: unread count, latest notifications, refreshed every minute. */
export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState({ notifications: [], unread: 0 })
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const load = useCallback(
    () =>
      notificationService
        .list()
        .then(setData)
        .catch(() => {}),
    [],
  )

  useEffect(() => {
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => clearInterval(timer)
  }, [load])

  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const openOne = async (n) => {
    setOpen(false)
    if (!Number(n.is_read)) {
      notificationService.read(n.id).then((d) => setData((cur) => ({ ...cur, unread: d.unread, notifications: cur.notifications.map((x) => (x.id === n.id ? { ...x, is_read: 1 } : x)) })))
    }
    const to = linkFor(n, user?.role)
    if (to) navigate(to)
  }

  const readAll = async () => {
    const d = await notificationService.read()
    setData((cur) => ({ unread: d.unread, notifications: cur.notifications.map((x) => ({ ...x, is_read: 1 })) }))
  }

  return (
    <div className="bell" ref={ref}>
      <button
        type="button"
        className="icon-btn bell-btn"
        aria-label={data.unread ? `Notifications, ${data.unread} unread` : 'Notifications'}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o)
          if (!open) load()
        }}
      >
        <Icon name="inbox" size={18} />
        {data.unread > 0 && <span className="bell-count num">{data.unread > 99 ? '99+' : data.unread}</span>}
      </button>
      {open && (
        <div className="bell-menu" role="dialog" aria-label="Notifications">
          <div className="bell-head">
            <strong>Notifications</strong>
            {data.unread > 0 && (
              <button type="button" className="link-btn" onClick={readAll}>
                Mark all read
              </button>
            )}
          </div>
          {data.notifications.length ? (
            <ul className="bell-list">
              {data.notifications.map((n) => (
                <li key={n.id}>
                  <button type="button" className={Number(n.is_read) ? 'bell-item' : 'bell-item is-unread'} onClick={() => openOne(n)}>
                    <strong>{n.title}</strong>
                    <span>{n.message}</span>
                    <small>{timeAgo(n.created_at)}</small>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="bell-empty muted">You&apos;re all caught up.</p>
          )}
        </div>
      )}
    </div>
  )
}
