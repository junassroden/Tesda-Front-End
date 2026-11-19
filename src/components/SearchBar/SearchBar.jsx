/** Controlled search box. onChange receives the text, not the event. */
export default function SearchBar({ value = '', onChange, placeholder = 'Search' }) {
  return (
    <input
      type="search"
      className="search-bar"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
    />
  )
}
