/**
 * Row list used by "List of Request", "List of Programs", etc.
 * columns: [{ key, label, render?(row), align?: 'end' }]
 * showHeader: false hides the header row visually (admin lists in Figma have none).
 * leadingIcon: adds the small placeholder icon at the start of each row.
 * onRowClick(row) makes rows clickable.
 */
export default function DataTable({ columns, rows, onRowClick, showHeader = true, leadingIcon = false, emptyText = 'No records yet.', rowKey = 'id' }) {
  const colCount = columns.length + (leadingIcon ? 1 : 0)
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
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="data-table-empty">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={row[rowKey] ?? i} onClick={onRowClick ? () => onRowClick(row) : undefined} className={onRowClick ? 'clickable' : undefined}>
                {leadingIcon && (
                  <td className="cell-icon">
                    <span className="ph ph-icon" />
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className={c.align === 'end' ? 'cell-end' : undefined}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
