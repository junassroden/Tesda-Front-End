import { useEffect, useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import { ErrorState } from '../../components/EmptyState/EmptyState.jsx'
import TextInput from '../../components/form/TextInput.jsx'
import Icon from '../../components/Icon/Icon.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { studentService } from '../../services/trainingService.js'
import { shortDate } from '../../utils/format.js'
import { CIVIL_STATUSES } from '../../utils/training.js'

const FIELDS = ['full_name', 'email', 'contact_number', 'address', 'civil_status', 'highest_education', 'guardian_name', 'guardian_contact']

/** The student's own contact details. Name, birthdate and student ID are kept by the learning center. */
export default function StudentProfilePage() {
  const { setUser } = useAuth()
  const [data, setData] = useState(null)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const fill = (d) => {
    setData(d)
    const p = d.profile ?? {}
    setForm({
      full_name: d.name ?? '',
      email: d.email ?? '',
      contact_number: d.contact_number ?? '',
      address: p.address ?? '',
      civil_status: p.civil_status ?? '',
      highest_education: p.highest_education ?? '',
      guardian_name: p.guardian_name ?? '',
      guardian_contact: p.guardian_contact ?? '',
    })
  }

  useEffect(() => {
    studentService
      .profile()
      .then(fill)
      .catch((err) => setError(err.message))
  }, [])

  const field = (key) => ({ value: form?.[key] ?? '', onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })

  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    setSaveError('')
    try {
      const d = await studentService.updateProfile(Object.fromEntries(FIELDS.map((k) => [k, form[k]])))
      fill(d)
      setNotice(d.message)
      setUser((u) => (u ? { ...u, full_name: d.name } : u))
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (error) {
    return (
      <>
        <PageHeader title="Profile" />
        <Workspace>
          <ErrorState what="your profile" message={error} />
        </Workspace>
      </>
    )
  }

  const p = data?.profile
  return (
    <>
      <PageHeader title="Profile" subtitle={data ? `${p?.student_number ?? 'No student ID yet'} · ${data.training_center_name}` : 'Loading…'} />
      {notice && (
        <p className="notice-bar" role="status">
          <Icon name="check" size={16} />
          {notice}
          <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => setNotice('')}>
            <Icon name="x" size={14} />
          </button>
        </p>
      )}
      <Workspace title="Your details" flush>
        <form className="form-card" onSubmit={save} aria-busy={!form}>
          {saveError && (
            <p className="form-error" role="alert">
              {saveError}
            </p>
          )}
          <div className="form-section">
            <div className="form-section-intro">
              <h3>On file at your center</h3>
              <p>Ask your learning center to correct these.</p>
            </div>
            <dl className="fact-row">
              <div>
                <dt>Student ID</dt>
                <dd className="num">{p?.student_number || '—'}</dd>
              </div>
              <div>
                <dt>Legal name</dt>
                <dd>{p ? [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ') : '—'}</dd>
              </div>
              <div>
                <dt>Birthdate</dt>
                <dd>{p?.birthdate ? shortDate(p.birthdate) : '—'}</dd>
              </div>
            </dl>
          </div>
          <div className="form-section">
            <div className="form-section-intro">
              <h3>Contact</h3>
              <p>How your center and teacher reach you.</p>
            </div>
            <div className="form-fields">
              <TextInput id="full_name" label="Display name" required maxLength={150} disabled={!form} {...field('full_name')} />
              <div className="form-row even">
                <TextInput id="email" label="Email" type="email" required disabled={!form} {...field('email')} />
                <TextInput id="contact_number" label="Contact number" type="tel" maxLength={30} disabled={!form} {...field('contact_number')} />
              </div>
              <TextInput id="address" label="Address" maxLength={255} disabled={!form} {...field('address')} />
              <div className="form-row even">
                <TextInput id="guardian_name" label="Guardian or emergency contact" maxLength={150} disabled={!form} {...field('guardian_name')} />
                <TextInput id="guardian_contact" label="Their contact number" type="tel" maxLength={30} disabled={!form} {...field('guardian_contact')} />
              </div>
            </div>
          </div>
          <div className="form-section">
            <div className="form-section-intro">
              <h3>Background</h3>
              <p>Married students also submit a marriage contract under My documents.</p>
            </div>
            <div className="form-fields">
              <div className="form-row even">
                <label className="field" htmlFor="civil_status">
                  <span>Civil status</span>
                  <select id="civil_status" disabled={!form} {...field('civil_status')}>
                    <option value="">Not set</option>
                    {CIVIL_STATUSES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <TextInput id="highest_education" label="Highest educational attainment" maxLength={100} disabled={!form} {...field('highest_education')} />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <Button type="submit" disabled={busy || !form}>
              {busy ? 'Saving…' : 'Save profile'}
            </Button>
          </div>
        </form>
      </Workspace>
    </>
  )
}
