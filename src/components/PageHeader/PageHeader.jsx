import { usePortalName } from '../../context/PortalContext.jsx'
import ExportMenu from '../ExportMenu/ExportMenu.jsx'
import SearchBar from '../SearchBar/SearchBar.jsx'

/**
 * Gold label (the portal's name unless `eyebrow` is given), serif title and subtitle on the left;
 * search, actions and "Export report" on the right.
 * Pass `onSearch` to show the search bar and `onExport(format)` to show the export menu.
 */
export default function PageHeader({ title, subtitle, eyebrow, search, onSearch, searchPlaceholder = 'Search', onExport, actions }) {
  const portal = usePortalName()
  const label = eyebrow ?? portal

  return (
    <header className="page-header">
      <div className="page-header-text">
        {label && <span className="eyebrow">{label}</span>}
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
