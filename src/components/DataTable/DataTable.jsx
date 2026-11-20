import Icon from '../Icon/Icon.jsx'

/**
 * Row list used by the request, program, batch and student lists.
 * columns: [{ key, label, render?(row), align?: 'end' }]
 * showHeader: false hides the header row visually (kept for screen readers).
 * leadingIcon: icon name shown at the start of each row.
 * loading: shows skeleton rows. empty: { title, text, icon } shown when there are no rows.
 * onRowClick(row) makes rows clickable and adds a hover arrow.
 */
export default function DataTable({ columns, rows, onRowClick, showHeader = true, leadingIcon, loading = false, empty, emptyText = 'No records yet.', rowKey = 'id' }) {
  const colCount = columns.length + (leadingIcon ? 1 : 0) + (onRowClick ? 1 : 0)

  return (
    <div className="data-table">
      <table>
        <thead className={showHeader ? undefined : 'visually-hidden'}>
          <tr>
            {leadingIcon && <th className="cell-icon" aria-hidden="true" />}
            {columns.map((c) => (
              <th key={c.key} className={c.align === 'end' ? 'cell-end' : undefined}>
                {c.label}
              </th>
            ))}
            {onRowClick && (
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
                  <td key={c.key}>
                    <span className="skeleton skeleton-line" style={{ width: `${[70, 50, 40, 60][(i + j) % 4]}%` }} />
                  </td>
                ))}
                {onRowClick && <td />}
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
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={onRowClick ? 'clickable' : undefined}
              >
                {leadingIcon && (
                  <td className="cell-icon">
                    <span className="row-icon">
                      <Icon name={leadingIcon} size={17} />
                    </span>
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className={c.align === 'end' ? 'cell-end' : undefined}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
                {onRowClick && (
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
