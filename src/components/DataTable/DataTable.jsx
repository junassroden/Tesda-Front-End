import { Link } from 'react-router-dom'
import Icon from '../Icon/Icon.jsx'

/**
 * Row list used by the request, program, batch and student lists.
 * columns: [{ key, label, render?(row), align?: 'end', className? }]
 * showHeader: false hides the header row visually (kept for screen readers).
 * leadingIcon: icon name shown at the start of each row.
 * loading: shows skeleton rows. empty: { title, text, icon } shown when there are no rows.
 * rowHref(row) makes each row a real link: the primary cell (a column with `primary: true`, else the
 *   first non-checkbox column) holds a <Link> stretched over the row, so keyboard, screen readers and
 *   Ctrl+click all work. Buttons and checkboxes inside the row stay clickable above it.
 * onRowClick(row) is the older click-only version, kept for callers that do not navigate.
 * showArrow adds a hover arrow at the end of the row.
 */
const cellClass = (c) => [c.align === 'end' ? 'cell-end' : '', c.className || ''].filter(Boolean).join(' ') || undefined

export default function DataTable({ columns, rows, rowHref, onRowClick, showHeader = true, leadingIcon, loading = false, empty, emptyText = 'No records yet.', rowKey = 'id', showArrow = false }) {
  const clickable = Boolean(rowHref || onRowClick)
  const colCount = columns.length + (leadingIcon ? 1 : 0) + (clickable && showArrow ? 1 : 0)
  const primaryKey = (columns.find((c) => c.primary) ?? columns.find((c) => c.key !== 'check'))?.key

  return (
    <div className="data-table">
      <table>
        <thead className={showHeader ? undefined : 'visually-hidden'}>
          <tr>
            {leadingIcon && <th className="cell-icon" aria-hidden="true" />}
            {columns.map((c) => (
              <th key={c.key} className={cellClass(c)}>
                {c.label}
              </th>
            ))}
            {clickable && showArrow && (
              <th className="cell-end">
                <span className="visually-hidden">Open</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }, (_, i) => (
              <tr key={`skeleton-${i}`} aria-hidden="true">
                {leadingIcon && (
                  <td className="cell-icon">
                    <span className="skeleton" style={{ width: 34, height: 34 }} />
                  </td>
                )}
                {columns.map((c, j) => (
                  <td key={c.key} className={c.className}>
                    <span className="skeleton skeleton-line" style={{ width: `${[70, 50, 40, 60][(i + j) % 4]}%` }} />
                  </td>
                ))}
                {onRowClick && showArrow && <td />}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={colCount}>
                <div className="empty-state">
                  <span className="empty-icon">
                    <Icon name={empty?.icon || 'inbox'} size={22} />
                  </span>
                  <strong>{empty?.title || 'Nothing here yet'}</strong>
                  <p>{empty?.text || emptyText}</p>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row[rowKey] ?? i}
                onClick={!rowHref && onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  !rowHref && onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onRowClick(row)
                        }
                      }
                    : undefined
                }
                tabIndex={!rowHref && onRowClick ? 0 : undefined}
                className={clickable ? 'clickable' : undefined}
              >
                {leadingIcon && (
                  <td className="cell-icon">
                    <span className="row-icon">
                      <Icon name={leadingIcon} size={17} />
                    </span>
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className={cellClass(c)}>
                    {rowHref && c.key === primaryKey ? (
                      <Link to={rowHref(row)} className="row-link">
                        {c.render ? c.render(row) : row[c.key]}
                      </Link>
                    ) : c.render ? (
                      c.render(row)
                    ) : (
                      row[c.key]
                    )}
                  </td>
                ))}
                {clickable && showArrow && (
                  <td className="cell-end">
                    <span className="row-go">
                      <Icon name="arrowRight" size={17} />
                    </span>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
