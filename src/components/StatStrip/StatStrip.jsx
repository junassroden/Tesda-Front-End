import { Link } from 'react-router-dom'
import Icon from '../Icon/Icon.jsx'

/**
 * A titled row of figures inside one bordered panel, split by hairlines.
 * Used for work queues ("Waiting on main office") and for at-a-glance records.
 *
 * cells: [{ label, value, detail?, to?, attention? }]
 *   to        makes the cell a link to the list behind the number.
 *   attention marks a work-queue count: it reads in full ink when above zero, faded at zero.
 * error: the load error message; figures show "—" and the message appears under the strip.
 */
export default function StatStrip({ id, title, cells, loading = false, error = '', onRetry, columns }) {
  return (
    <section className="card queue" aria-labelledby={title ? id : undefined}>
      {title && (
        <div className="card-head">
          <h2 id={id}>{title}</h2>
          {error && !loading && onRetry && (
            <button type="button" className="link-btn" onClick={onRetry}>
              Try again
            </button>
          )}
        </div>
      )}
      <div className="queue-grid" style={columns ? { '--queue-cols': columns } : undefined}>
        {cells.map((cell) => {
          const number = typeof cell.value === 'number' ? cell.value : Number(cell.value)
          const quiet = cell.attention && !loading && !error && !(number > 0)
          const className = ['queue-cell', cell.to ? 'is-link' : '', quiet ? 'is-quiet' : ''].filter(Boolean).join(' ')
          const body = (
            <>
              <span className="queue-label">{cell.label}</span>
              {loading ? (
                <span className="skeleton" style={{ width: 48, height: 30 }} />
              ) : (
                <strong className="queue-value">{error ? '—' : cell.value}</strong>
              )}
              {cell.detail && <small>{error && !loading ? 'Couldn’t load' : cell.detail}</small>}
              {cell.to && <Icon name="arrowRight" size={15} className="queue-go" />}
            </>
          )
          return cell.to ? (
            <Link key={cell.label} to={cell.to} className={className}>
              {body}
            </Link>
          ) : (
            <div key={cell.label} className={className}>
              {body}
            </div>
          )
        })}
      </div>
      {error && !loading && (
        <p className="form-error queue-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
