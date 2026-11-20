import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import TextArea from '../../../components/form/TextArea.jsx'
import TextInput from '../../../components/form/TextInput.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES } from '../../../constants/routes.js'
import { programService } from '../../../services/programService.js'

// Figma: Registration Inventory 11
// Field names follow the backend's /courses endpoint.
export default function RegisterProgramPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ course_code: '', course_name: '', qualification: 'NC II', capacity: 25, status: 'open', description: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const field = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.course_code.trim() || !form.course_name.trim()) return setError('Enter both the program code and name.')
    setBusy(true)
    setError('')
    try {
      await programService.create({ ...form, capacity: Number(form.capacity) || 25 })
      navigate(ROUTES.CENTER.PROGRAMS)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Programs" subtitle="Register a program your center is accredited to offer." />
      <Workspace back={ROUTES.CENTER.PROGRAMS} backLabel="Programs" title="Register a program" flush>
        <form className="form-card" onSubmit={handleSubmit} noValidate>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-section">
            <div className="form-section-intro">
              <h3>Program</h3>
              <p>Use the code and title from the training regulations.</p>
            </div>
            <div className="form-fields">
              <div className="form-row">
                <TextInput id="course_name" label="Program name" placeholder="e.g. Shielded Metal Arc Welding" required {...field('course_name')} />
                <TextInput id="course_code" label="Program code" placeholder="e.g. SMAW-NCII" required {...field('course_code')} />
              </div>
              <div className="form-row even">
                <TextInput id="qualification" label="Qualification level" placeholder="e.g. NC II" {...field('qualification')} />
                <TextInput id="capacity" label="Trainees per batch" type="number" min={1} {...field('capacity')} />
              </div>
              <TextArea id="description" label="Description" rows={4} placeholder="What trainees learn, e.g. welding carbon steel plates and pipes using SMAW." {...field('description')} />
            </div>
          </div>
          <div className="form-actions">
            <Button variant="secondary" to={ROUTES.CENTER.PROGRAMS}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Register program'}
            </Button>
          </div>
        </form>
      </Workspace>
    </>
  )
}
