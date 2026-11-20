import { Link } from 'react-router-dom'

/** Program > Batch list > Student list. items: [{ label, to? }] (last one is the current page) */
export default function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="breadcrumb-item">
          {i > 0 && (
            <span className="breadcrumb-sep" aria-hidden="true">
              /{' '}
            </span>
          )}
          {item.to && i < items.length - 1 ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </span>
      ))}
    </nav>
  )
}
