import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import ImageUpload from '../../../components/form/ImageUpload.jsx'
import NumberInput from '../../../components/form/NumberInput.jsx'
import TextArea from '../../../components/form/TextArea.jsx'
import TextInput from '../../../components/form/TextInput.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES } from '../../../constants/routes.js'
import { inventoryService } from '../../../services/inventoryService.js'

// Figma: Registration Inventory 04
export default function RegisterItemPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState(null) // not sent yet: /products has no image upload
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!name.trim()) return setError('Enter the item name.')
    setBusy(true)
    setError('')
    try {
      await inventoryService.create({ product_name: name.trim(), quantity: Number(quantity) || 0, description: description.trim() })
      navigate(ROUTES.ADMIN.INVENTORY)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Inventory" subtitle="Add a supply or piece of equipment to the main office stock." />
      <Workspace back={ROUTES.ADMIN.INVENTORY} backLabel="Inventory" title="Register an item" flush>
        <form className="form-card" onSubmit={handleSubmit} noValidate>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="form-section">
            <div className="form-section-intro">
              <h3>Item details</h3>
              <p>What learning centers will see when they request it.</p>
            </div>
            <div className="form-fields">
              <div className="form-row">
                <TextInput id="product_name" label="Item name" placeholder="e.g. Welding machine (MIG)" value={name} onChange={(e) => setName(e.target.value)} required />
                <NumberInput id="quantity" label="Quantity on hand" value={quantity} onChange={setQuantity} />
              </div>
              <TextArea id="description" label="Description" rows={3} placeholder="e.g. MIG (Metal Inert Gas / GMAW), 200A, with regulator" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-intro">
              <h3>Photo</h3>
              <p>Optional. Helps centers pick the right item.</p>
            </div>
            <ImageUpload id="image" file={image} onChange={setImage} />
          </div>

          <div className="form-actions">
            <Button variant="secondary" to={ROUTES.ADMIN.INVENTORY}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Register item'}
            </Button>
          </div>
        </form>
      </Workspace>
    </>
  )
}
