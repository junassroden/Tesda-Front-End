import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Breadcrumb from '../../../components/Breadcrumb/Breadcrumb.jsx'
import Button from '../../../components/Button/Button.jsx'
import NumberInput from '../../../components/form/NumberInput.jsx'
import TextArea from '../../../components/form/TextArea.jsx'
import TextInput from '../../../components/form/TextInput.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import { ROUTES } from '../../../constants/routes.js'
import { programService } from '../../../services/programService.js'

// Figma: Registration Inventory 11
// Field names follow the backend's /courses endpoint. Check /course-options for any required fields.
export default function RegisterProgramPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ course_code: '', course_name: '', qualification: '', description: '' })
  const [capacity, setCapacity] = useState(25)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const field = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await programService.create({ ...form, capacity })
      navigate(ROUTES.CENTER.PROGRAMS)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Programs', to: ROUTES.CENTER.PROGRAMS }, { label: 'Register program' }]} />
      <PageHeader title="Register Program" />
      <form className="panel form-fields" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}
        <TextInput id="course_code" label="Program code" required {...field('course_code')} />
        <TextInput id="course_name" label="Program name" required {...field('course_name')} />
        <TextInput id="qualification" label="Qualification" {...field('qualification')} />
        <NumberInput id="capacity" label="Capacity" value={capacity} onChange={setCapacity} min={1} />
        <TextArea id="description" label="Description" {...field('description')} />
        <div className="form-actions">
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Register'}
          </Button>
          <Button variant="secondary" to={ROUTES.CENTER.PROGRAMS}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  )
}
