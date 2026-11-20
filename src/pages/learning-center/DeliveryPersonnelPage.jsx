import { useEffect, useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import DataTable from '../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import TextInput from '../../components/form/TextInput.jsx'
import Icon from '../../components/Icon/Icon.jsx'
import Modal from '../../components/Modal/Modal.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import { inventoryService } from '../../services/inventoryService.js'

const COLUMNS = [
  { key: 'full_name', label: 'Name' },
  { key: 'contact_number', label: 'Contact', render: (r) => <span className="num muted">{r.contact_number || '—'}</span> },
  { key: 'vehicle', label: 'Vehicle', render: (r) => <span className="muted">{r.vehicle || '—'}</span> },
  { key: 'plate_number', label: 'Plate no.', render: (r) => <span className="num">{r.plate_number || '—'}</span> },
  { key: 'is_active', label: 'Status', render: (r) => <StatusBadge status={Number(r.is_active) ? 'active' : 'inactive'} /> },
]

const EMPTY_FORM = { full_name: '', contact_number: '', vehicle: '', plate_number: '' }

// No Figma screen; follows the other list pages.
export default function DeliveryPersonnelPage() {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    inventoryService
      .deliveryPersonnel()
      .then((data) => setPeople(data.personnel ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const field = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const res = await inventoryService.addDeliveryPerson(form)
      setPeople(res.personnel ?? [])
      setForm(EMPTY_FORM)
      setOpen(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Delivery personnel" subtitle="People who pick up approved supplies from the main office for your center." />
      <Workspace
        title="Your delivery team"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Icon name="plus" size={17} />
            Add person
          </Button>
        }
        flush
      >
        {error && (
          <p className="form-error inset" role="alert">
            {error}
          </p>
        )}
        <DataTable
          columns={COLUMNS}
          rows={people}
          loading={loading}
          leadingIcon="truck"
          empty={{ icon: 'truck', title: 'No delivery personnel yet', text: 'Add the people who pick up supplies, so you can name them on a request.' }}
        />
      </Workspace>

      <Modal
        open={open}
        title="Add delivery personnel"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="delivery-form" disabled={saving}>
              {saving ? 'Saving…' : 'Add person'}
            </Button>
          </>
        }
      >
        <form id="delivery-form" className="form-fields" onSubmit={save}>
          {formError && <p className="form-error">{formError}</p>}
          <TextInput id="full_name" label="Full name" placeholder="e.g. Carlos Medina" required {...field('full_name')} />
          <TextInput id="contact_number" label="Contact number" placeholder="e.g. 0919 100 0001" {...field('contact_number')} />
          <div className="form-row even">
            <TextInput id="vehicle" label="Vehicle" placeholder="e.g. L300 Van" {...field('vehicle')} />
            <TextInput id="plate_number" label="Plate number" placeholder="e.g. ABC 1234" {...field('plate_number')} />
          </div>
        </form>
      </Modal>
    </>
  )
}
