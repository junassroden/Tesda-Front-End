import { Link } from 'react-router-dom'

/** Program Name > Batch List > Student Lists. items: [{ label, to? }] (last one is the current page) */
export default function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={item.label}>
          {i > 0 && <span className="breadcrumb-sep"> &gt; </span>}
          {item.to && i < items.length - 1 ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </span>
      ))}
    </nav>
  )
}
