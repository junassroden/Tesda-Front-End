import ExportMenu from '../ExportMenu/ExportMenu.jsx'
import SearchBar from '../SearchBar/SearchBar.jsx'

/**
 * Title + subtitle on the left; search, actions and "Export report" on the right.
 * Pass `onSearch` to show the search bar and `onExport(format)` to show the export menu.
 */
export default function PageHeader({ title, subtitle, eyebrow, search, onSearch, searchPlaceholder = 'Search', onExport, actions }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {(onSearch || actions || onExport) && (
        <div className="page-header-tools">
          {onSearch && <SearchBar value={search} onChange={onSearch} placeholder={searchPlaceholder} />}
          {actions}
          {onExport && <ExportMenu onSelect={onExport} />}
        </div>
      )}
    </header>
  )
}
