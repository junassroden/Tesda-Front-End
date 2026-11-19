import { useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import TextArea from '../../components/form/TextArea.jsx'
import TextInput from '../../components/form/TextInput.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import { allowanceService } from '../../services/allowanceService.js'

// Figma: Request Allowance 01
export default function RequestAllowancePage() {
  const [form, setForm] = useState({ program: '', batch: '', notes: '' })
  const [message, setMessage] = useState('')

  const field = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      await allowanceService.request(form)
      setMessage('Request sent.')
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <>
      <PageHeader title="Request Allowance" subtitle="Ask the TESDA office to release a batch's allowance" />
      <form className="panel form-fields" onSubmit={handleSubmit}>
        <TextInput id="program" label="Program" required {...field('program')} />
        <TextInput id="batch" label="Batch" required {...field('batch')} />
        <TextArea id="notes" label="Notes" {...field('notes')} />
        <div className="form-actions">
          <Button type="submit">Submit request</Button>
        </div>
        {message && <p className="notice">{message}</p>}
      </form>
    </>
  )
}
