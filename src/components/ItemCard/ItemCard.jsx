import Icon from '../Icon/Icon.jsx'

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '—'

/** Inventory card: photo (or a branded initials tile), name, description, quantity on hand. */
export default function ItemCard({ image, name, quantity, unit = 'in stock', description, lowAt = 5, onClick, onMenu }) {
  const Tag = onClick ? 'button' : 'article'
  const qty = Number(quantity ?? 0)

  return (
    <Tag type={onClick ? 'button' : undefined} className="item-card" onClick={onClick}>
      {onMenu && (
        <span
          role="button"
          tabIndex={0}
          className="icon-btn item-card-menu"
          aria-label={`More options for ${name}`}
          onClick={(e) => {
            e.stopPropagation()
            onMenu()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              onMenu()
            }
          }}
        >
          <Icon name="more" size={18} />
        </span>
      )}
      <div className={image ? 'item-card-image' : 'item-card-image is-empty'}>{image ? <img src={image} alt={name} /> : <span aria-hidden="true">{initials(name)}</span>}</div>
      <div className="item-card-body">
        <div>
          <h3>{name || 'Unnamed item'}</h3>
          <p>{description || 'No description yet.'}</p>
        </div>
        <div className={qty <= lowAt ? 'item-card-qty low' : 'item-card-qty'}>
          <strong>{qty}</strong>
          <span>{qty <= lowAt ? 'low stock' : unit}</span>
        </div>
      </div>
    </Tag>
  )
}

/** Placeholder card shown while items load. */
export function ItemCardSkeleton() {
  return (
    <div className="item-skeleton" aria-hidden="true">
      <span className="skeleton" />
      <div>
        <span className="skeleton skeleton-line" style={{ width: '70%' }} />
        <span className="skeleton skeleton-line" style={{ width: '45%' }} />
      </div>
    </div>
  )
}
