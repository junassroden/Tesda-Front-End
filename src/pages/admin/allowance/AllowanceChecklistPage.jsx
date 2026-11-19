import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumb from '../../../components/Breadcrumb/Breadcrumb.jsx'
import Button from '../../../components/Button/Button.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import { ROUTES } from '../../../constants/routes.js'

// Placeholder requirements; replace with the real list from the backend.
const REQUIREMENTS = ['Attendance sheet', 'Student list', 'Training schedule', 'Signed request letter']

// Figma: Allowance Tracking 9
export default function AllowanceChecklistPage() {
  const { id } = useParams()
  const [checked, setChecked] = useState({})

  return (
    <>
      <Breadcrumb items={[{ label: 'Allowance Tracking', to: ROUTES.ADMIN.ALLOWANCE }, { label: `Request #${id}` }]} />
      <PageHeader title="Allowance Checklist" subtitle={`Request #${id}`} />
      <section className="panel">
        <ul className="checklist">
          {REQUIREMENTS.map((req) => (
            <li key={req}>
              <label>
                <input type="checkbox" checked={!!checked[req]} onChange={(e) => setChecked((c) => ({ ...c, [req]: e.target.checked }))} />
                {req}
              </label>
            </li>
          ))}
        </ul>
        <div className="form-actions">
          <Button disabled>Save</Button>
        </div>
        <p className="notice">Allowance tracking is not available yet.</p>
      </section>
    </>
  )
}
