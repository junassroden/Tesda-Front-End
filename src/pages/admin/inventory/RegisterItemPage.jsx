import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Breadcrumb from '../../../components/Breadcrumb/Breadcrumb.jsx'
import Button from '../../../components/Button/Button.jsx'
import ImageUpload from '../../../components/form/ImageUpload.jsx'
import NumberInput from '../../../components/form/NumberInput.jsx'
import TextArea from '../../../components/form/TextArea.jsx'
import TextInput from '../../../components/form/TextInput.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import { ROUTES } from '../../../constants/routes.js'
import { inventoryService } from '../../../services/inventoryService.js'

// Figma: Registration Inventory 04
export default function RegisterItemPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(0)
  const [description, setDescription] = useState('')
  const [image, setImage] = useState(null) // not sent yet: /products has no image upload
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await inventoryService.create({ product_name: name.trim(), quantity, description: description.trim() })
      navigate(ROUTES.ADMIN.INVENTORY)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Inventory', to: ROUTES.ADMIN.INVENTORY }, { label: 'Register item' }]} />
      <PageHeader title="Register Item" />
      <form className="panel form-grid" onSubmit={handleSubmit}>
        <ImageUpload id="image" file={image} onChange={setImage} />
        <div className="form-fields">
          {error && <p className="form-error">{error}</p>}
          <TextInput id="product_name" label="Item name" value={name} onChange={(e) => setName(e.target.value)} required />
          <NumberInput id="quantity" value={quantity} onChange={setQuantity} />
          <TextArea id="description" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="form-actions">
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Register'}
            </Button>
            <Button variant="secondary" to={ROUTES.ADMIN.INVENTORY}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </>
  )
}
