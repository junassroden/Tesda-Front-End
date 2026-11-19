import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import NumberInput from '../../../components/form/NumberInput.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { LEARNING_CENTER_SUBTITLE } from '../../../constants/navItems.js'
import { ROUTES } from '../../../constants/routes.js'
import { inventoryService } from '../../../services/inventoryService.js'

// Figma: Request Inventory 02
// Sending a request needs a backend endpoint; until then the button is disabled.
export default function RequestItemPage() {
  const { itemId } = useParams()
  const [item, setItem] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [personnel, setPersonnel] = useState('')

  useEffect(() => {
    inventoryService
      .get(itemId)
      .then((data) => setItem(data?.product ?? data))
      .catch(() => setItem(false))
  }, [itemId])

  const stock = item ? String(item.quantity ?? 0).padStart(2, '0') : '00'

  return (
    <>
      <PageHeader title="Request Inventory" subtitle={LEARNING_CENTER_SUBTITLE} />
      <Workspace back={ROUTES.CENTER.AVAILABLE_INVENTORY} flush>
        <div className="detail-head">
          <div>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600 }}>{item ? item.product_name : item === false ? 'Item not found' : 'Loading…'}</h2>
            <p>{item?.description || 'Item description'}</p>
          </div>
          <div className="detail-qty">
            Quantity <span>{stock}</span>
          </div>
        </div>

        <div className="ph detail-media short" role="img" aria-label="Item image placeholder" />

        <form className="allowance-form" style={{ paddingTop: 0 }} onSubmit={(e) => e.preventDefault()}>
          <div className="form-row even" style={{ maxWidth: 640 }}>
            <label className="field compact" htmlFor="personnel">
              <span>Delivery Personnel</span>
              <select id="personnel" value={personnel} onChange={(e) => setPersonnel(e.target.value)}>
                <option value="">Delivery Personnel</option>
              </select>
            </label>
            <NumberInput id="quantity" label="Quantity to request" className="compact" value={quantity} onChange={setQuantity} min={1} max={item ? Number(item.quantity) || undefined : undefined} />
          </div>
          <div className="ph detail-media short" style={{ margin: 0 }} role="img" aria-label="Delivery details placeholder" />
          <div className="form-actions">
            <span className="sample-tag">Inventory requests are not available yet</span>
            <Button type="submit" className="btn-lg" disabled>
              Request Item
            </Button>
          </div>
        </form>
      </Workspace>
    </>
  )
}
