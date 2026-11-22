import { inventoryService } from '../../services/inventoryService.js'
import { CATEGORY_LABELS, initials, stockState } from '../../utils/inventory.js'

/**
 * Inventory item card: the item's photo fills the card and the text sits on top of it,
 * so items can be told apart at a glance. Items without a photo get a quiet monogram.
 * meta: the small line under the name (quantity, price, "available"...).
 */
export default function InventoryCard({ item, meta, onOpen }) {
  const state = stockState(item)
  const photo = inventoryService.imageUrl(item)

  return (
    <button type="button" className={`inv-card${photo ? ' has-photo' : ''}`} onClick={onOpen}>
      {photo ? (
        <img className="inv-card-img" src={photo} alt="" loading="lazy" />
      ) : (
        <span className="inv-card-mark" aria-hidden="true">
          {initials(item.product_name)}
        </span>
      )}
      {state.key !== 'ok' && <span className={`inv-pill is-${state.key}`}>{state.label}</span>}
      <span className="inv-card-text">
        <span className="inv-card-category">{CATEGORY_LABELS[item.category] ?? 'Item'}</span>
        <strong className="inv-card-name">{item.product_name || 'Unnamed item'}</strong>
        {meta && <span className="inv-card-meta num">{meta}</span>}
      </span>
    </button>
  )
}

/** Placeholder card shown while items load. */
export function InventoryCardSkeleton() {
  return <span className="inv-card is-skeleton skeleton" aria-hidden="true" />
}
