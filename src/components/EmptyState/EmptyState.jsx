import Icon from '../Icon/Icon.jsx'

/** Centered icon + title + text for lists with nothing in them yet. */
export default function EmptyState({ icon = 'inbox', title, text, compact = false, children }) {
  return (
    <div className={compact ? 'empty-state compact' : 'empty-state'}>
      <span className="empty-icon">
        <Icon name={icon} size={20} />
      </span>
      {title && <strong>{title}</strong>}
      {text && <p>{text}</p>}
      {children}
    </div>
  )
}

/** Skeleton rows for a list while it loads. */
export function ListSkeleton({ rows = 3 }) {
  return (
    <div className="list-rows" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="list-row with-icon">
          <span className="skeleton skeleton-icon" />
          <div className="skeleton-stack">
            <span className="skeleton skeleton-line" style={{ width: `${60 - i * 10}%` }} />
            <span className="skeleton skeleton-line short" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** "Couldn't load …" with the server's message and a retry. Use instead of an empty or not-found state when a request fails. */
export function ErrorState({ what, message, onRetry, compact = false }) {
  return (
    <div className={compact ? 'empty-state compact is-error' : 'empty-state is-error'} role="alert">
      <span className="empty-icon">
        <Icon name="alert" size={20} />
      </span>
      <strong>{`Couldn’t load ${what}`}</strong>
      {message && <p>{message}</p>}
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          <Icon name="refresh" size={16} />
          Try again
        </button>
      )}
    </div>
  )
}
