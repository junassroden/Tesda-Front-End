import { useCallback, useEffect, useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import DataTable from '../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import { ErrorState } from '../../components/EmptyState/EmptyState.jsx'
import TextInput from '../../components/form/TextInput.jsx'
import Icon from '../../components/Icon/Icon.jsx'
import Modal from '../../components/Modal/Modal.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import { staffService } from '../../services/requestService.js'
import { shortDate } from '../../utils/format.js'
import { initials } from '../../utils/training.js'

const ROLE = { inventory_staff: 'Inventory personnel', delivery_staff: 'Delivery personnel' }
const EMPTY = { full_name: '', email: '', contact_number: '', role: 'inventory_staff', password: '' }

/** Main office staff: inventory personnel prepare approved requests; delivery personnel release them by QR. */
export default function StaffPage() {
  const [staff, setStaff] = useState(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(
    () =>
      staffService
        .list()
        .then((d) => {
          setError('')
          setStaff(d.staff ?? [])
        })
        .catch((err) => setError(err.message)),
    [],
  )
  useEffect(() => {
    load()
  }, [load])

  const field = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })

  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    setFormError('')
    try {
      const d = await staffService.create(form)
      setOpen(false)
      setForm(EMPTY)
      setNotice(d.message)
      load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (person) => {
    try {
      const d = await staffService.setActive(person.id, !Number(person.is_active))
      setNotice(d.message)
      load()
    } catch (err) {
      setNotice(err.message)
    }
  }

  const columns = [
    {
      key: 'full_name',
      label: 'Name',
      render: (p) => (
        <span className="doc-name">
          <span className="avatar">{initials(p.full_name)}</span>
          <span className="cell-stack">
            <strong>{p.full_name}</strong>
            <small>{p.email}</small>
          </span>
        </span>
      ),
    },
    { key: 'role', label: 'Role', render: (p) => <span>{ROLE[p.role]}</span> },
    { key: 'last_login_at', label: 'Last login', render: (p) => <span className="muted num">{p.last_login_at ? shortDate(p.last_login_at) : 'Never'}</span> },
    { key: 'is_active', label: 'Status', render: (p) => <StatusBadge status={Number(p.is_active) ? 'active' : 'closed'} label={Number(p.is_active) ? 'Active' : 'Deactivated'} /> },
    {
      key: 'actions',
      label: '',
      align: 'end',
      render: (p) => (
        <button type="button" className={Number(p.is_active) ? 'link-btn danger' : 'link-btn'} onClick={() => toggle(p)}>
          {Number(p.is_active) ? 'Deactivate' : 'Activate'}
        </button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Main office staff"
        subtitle="Inventory personnel prepare approved requests and generate delivery QR codes. Delivery personnel scan them to release inventory."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Icon name="plus" size={16} />
            Add staff
          </Button>
        }
      />
      {notice && (
        <p className="notice-bar" role="status">
          <Icon name="check" size={16} />
          {notice}
          <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => setNotice('')}>
            <Icon name="x" size={14} />
          </button>
        </p>
      )}
      <Workspace title="Accounts" flush>
        {error && !staff ? (
          <ErrorState what="staff accounts" message={error} onRetry={load} />
        ) : (
          <DataTable columns={columns} rows={staff ?? []} loading={staff === null} empty={{ icon: 'users', title: 'No staff accounts yet', text: 'Add inventory and delivery personnel so approved requests can be prepared and released.' }} />
        )}
      </Workspace>
      <Modal
        open={open}
        title="Add main office staff"
        onClose={() => !busy && setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" form="staff-form" disabled={busy}>
              {busy ? 'Saving…' : 'Create account'}
            </Button>
          </>
        }
      >
        <form id="staff-form" className="form-fields" onSubmit={save}>
          {formError && <p className="form-error">{formError}</p>}
          <label className="field" htmlFor="staff-role">
            <span>Role</span>
            <select id="staff-role" {...field('role')}>
              <option value="inventory_staff">Inventory personnel</option>
              <option value="delivery_staff">Delivery personnel</option>
            </select>
          </label>
          <TextInput id="staff-name" label="Full name" required maxLength={150} {...field('full_name')} />
          <div className="form-row even">
            <TextInput id="staff-email" label="Email" type="email" required maxLength={255} {...field('email')} />
            <TextInput id="staff-contact" label="Contact number" type="tel" maxLength={30} {...field('contact_number')} />
          </div>
          <TextInput id="staff-password" label="Initial password" required minLength={8} maxLength={72} autoComplete="new-password" {...field('password')} />
          <p className="field-hint">At least 8 characters. Give it to the person; they sign in with their email.</p>
        </form>
      </Modal>
    </>
  )
}
