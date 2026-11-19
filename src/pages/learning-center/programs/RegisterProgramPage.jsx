import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import TextArea from '../../../components/form/TextArea.jsx'
import TextInput from '../../../components/form/TextInput.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { LEARNING_CENTER_SUBTITLE } from '../../../constants/navItems.js'
import { ROUTES } from '../../../constants/routes.js'
import { programService } from '../../../services/programService.js'

// Figma: Registration Inventory 11
// Field names follow the backend's /courses endpoint. If it rejects the form, check /course-options for required fields.
export default function RegisterProgramPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ course_code: '', course_name: '', description: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const field = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await programService.create(form)
      navigate(ROUTES.CENTER.PROGRAMS)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Program Lists" subtitle={LEARNING_CENTER_SUBTITLE} />
      <Workspace back={ROUTES.CENTER.PROGRAMS} title="Register Program" flush>
        <form className="form-card" onSubmit={handleSubmit} style={{ minHeight: 510, alignContent: 'start' }}>
          {error && <p className="form-error">{error}</p>}
          <div className="form-row even">
            <TextInput id="course_code" label="Program Code" placeholder="e.g SMAW NC II" required {...field('course_code')} />
            <TextInput id="course_name" label="Program Name" placeholder="e.g Shielded Metal Arc Welding" required {...field('course_name')} />
          </div>
          <TextArea id="description" label="Program Description" placeholder="e.g Covers welding of carbon steel plates and pipes" {...field('description')} />
          <div className="form-actions" style={{ marginTop: 'auto' }}>
            <Button type="submit" className="btn-lg" disabled={busy}>
              {busy ? 'Saving…' : 'Register Program'}
            </Button>
          </div>
        </form>
      </Workspace>
    </>
  )
}
