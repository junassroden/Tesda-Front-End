import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumb from '../../../components/Breadcrumb/Breadcrumb.jsx'
import Button from '../../../components/Button/Button.jsx'
import ItemCard from '../../../components/ItemCard/ItemCard.jsx'
import NumberInput from '../../../components/form/NumberInput.jsx'
import TextArea from '../../../components/form/TextArea.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import { ROUTES } from '../../../constants/routes.js'
import { inventoryService } from '../../../services/inventoryService.js'

// Figma: Request Inventory 02
// Sending a request needs a backend endpoint; until then the submit button is disabled.
export default function RequestItemPage() {
  const { itemId } = useParams()
  const [item, setItem] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState('')

  useEffect(() => {
    inventoryService
      .get(itemId)
      .then((data) => setItem(data?.product ?? data))
      .catch(() => setItem(false))
  }, [itemId])

  return (
    <>
      <Breadcrumb items={[{ label: 'Request Inventory', to: ROUTES.CENTER.AVAILABLE_INVENTORY }, { label: item?.product_name ?? 'Item' }]} />
      <PageHeader title="Request Item" />
      <div className="form-grid">
        {item ? <ItemCard name={item.product_name} quantity={item.quantity} description={item.description} /> : <p>{item === false ? 'Item not found.' : 'Loading…'}</p>}
        <form className="panel form-fields" onSubmit={(e) => e.preventDefault()}>
          <NumberInput id="quantity" value={quantity} onChange={setQuantity} min={1} max={item ? Number(item.quantity) || undefined : undefined} />
          <TextArea id="message" label="Purpose of request" value={message} onChange={(e) => setMessage(e.target.value)} />
          <div className="form-actions">
            <Button type="submit" disabled>
              Send request
            </Button>
          </div>
          <p className="notice">Inventory requests are not available yet.</p>
        </form>
      </div>
    </>
  )
}
