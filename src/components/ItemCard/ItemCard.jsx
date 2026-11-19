/** Inventory card: image (or placeholder), name, description, quantity "00", and a ⋮ menu button. */
export default function ItemCard({ image, name, quantity, description, onClick, onMenu }) {
  const Tag = onClick ? 'button' : 'article'
  const qty = String(quantity ?? 0).padStart(2, '0')
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
          ⋮
        </span>
      )}
      <div className={image ? 'item-card-image' : 'item-card-image ph'}>{image && <img src={image} alt="" />}</div>
      <div className="item-card-body">
        <div>
          <h3>{name || 'Item name'}</h3>
          <p>{description || 'Item description'}</p>
        </div>
        <span className="item-card-qty">{qty}</span>
      </div>
    </Tag>
  )
}
