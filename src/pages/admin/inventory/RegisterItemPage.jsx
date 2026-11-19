import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import ImageUpload from '../../../components/form/ImageUpload.jsx'
import NumberInput from '../../../components/form/NumberInput.jsx'
import TextInput from '../../../components/form/TextInput.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ADMIN_SUBTITLE } from '../../../constants/navItems.js'
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
      <PageHeader title="Inventory Registration" subtitle={ADMIN_SUBTITLE} />
      <Workspace back={ROUTES.ADMIN.INVENTORY} title="Register an Item" flush>
        <form className="form-card" onSubmit={handleSubmit}>
          {error && <p className="form-error">{error}</p>}
          <div className="form-row">
            <TextInput id="product_name" label="Item Name" placeholder="e.g Welding Machine" value={name} onChange={(e) => setName(e.target.value)} required />
            <NumberInput id="quantity" label="Quantity" value={quantity} onChange={setQuantity} />
          </div>
          <TextInput id="description" label="Item Description" placeholder="e.g MIG (Metal Inert Gas / GMAW)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <ImageUpload id="image" file={image} onChange={setImage} />
          <div className="form-actions">
            <Button type="submit" className="btn-lg" disabled={busy}>
              {busy ? 'Saving…' : 'Register Item'}
            </Button>
          </div>
        </form>
      </Workspace>
    </>
  )
}
