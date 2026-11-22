// Shared helpers for inventory items (main office stock).

export const CATEGORY_LABELS = {
  equipment: 'Equipment',
  tool: 'Tool',
  ppe: 'PPE',
  supply: 'Supply',
  consumable: 'Consumable',
}

export const qtyOf = (item) => Number(item?.quantity) || 0

/** In stock / low (at or below the reorder level) / out of stock. */
export function stockState(item) {
  const qty = qtyOf(item)
  const reorder = Number(item?.reorder_level) || 0
  if (qty <= 0) return { key: 'out', label: 'Out of stock' }
  if (qty <= reorder) return { key: 'low', label: 'Low stock' }
  return { key: 'ok', label: 'In stock' }
}

/** "Welding gloves" -> "WG" */
export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '—'
