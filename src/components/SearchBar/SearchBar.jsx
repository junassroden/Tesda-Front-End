import Icon from '../Icon/Icon.jsx'

/** Controlled search box with a magnifier icon. onChange receives the text, not the event. */
export default function SearchBar({ value = '', onChange, placeholder = 'Search' }) {
  return (
    <div className="search-field">
      <Icon name="search" size={17} />
      <input type="search" className="search-bar" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  )
}
