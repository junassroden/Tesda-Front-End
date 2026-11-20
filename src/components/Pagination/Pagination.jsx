import Icon from '../Icon/Icon.jsx'

/** ← 1 2 3 … → . Pair with hooks/usePagination. Shows at most 5 page numbers around the current page. */
export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null

  const first = Math.max(1, Math.min(page - 2, pageCount - 4))
  const pages = Array.from({ length: Math.min(5, pageCount) }, (_, i) => first + i)

  return (
    <nav className="pagination" aria-label="Pages">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <Icon name="arrowLeft" size={16} />
      </button>
      {pages.map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}>
          {n}
        </button>
      ))}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= pageCount} aria-label="Next page">
        <Icon name="arrowRight" size={16} />
      </button>
    </nav>
  )
}
