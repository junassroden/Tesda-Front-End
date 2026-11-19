import ExportMenu from '../ExportMenu/ExportMenu.jsx'
import SearchBar from '../SearchBar/SearchBar.jsx'

/**
 * Title + subtitle on the left; search and "Export report" on the right.
 * Pass `onSearch` to show the search bar and `onExport(format)` to show the export menu.
 */
export default function PageHeader({ title, subtitle, search, onSearch, searchPlaceholder = 'Search records or requests', onExport, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="page-header-tools">
        {onSearch && <SearchBar value={search} onChange={onSearch} placeholder={searchPlaceholder} />}
        {actions}
        {onExport && <ExportMenu onSelect={onExport} />}
      </div>
    </header>
  )
}
