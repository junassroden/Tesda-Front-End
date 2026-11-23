import { useState } from 'react'
import Button from '../Button/Button.jsx'
import TextArea from '../form/TextArea.jsx'
import TextInput from '../form/TextInput.jsx'
import Modal from '../Modal/Modal.jsx'

/**
 * Confirmation for an important action, optionally asking for a reason and/or a date.
 * onConfirm({ reason, date }) returns a promise; its error message shows in the dialog.
 * Mount it with a `key` per action so the fields start empty each time.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'primary',
  reason, // { label, required, placeholder }
  date, // { label, required, min, value }
  children,
  onConfirm,
  onClose,
}) {
  const [text, setText] = useState('')
  const [day, setDay] = useState(date?.value ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    if (reason?.required && !text.trim()) return setError(`${reason.label} is required.`)
    if (date?.required && !day) return setError(`${date.label} is required.`)
    setBusy(true)
    setError('')
    try {
      await onConfirm({ reason: text.trim(), date: day })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={busy ? () => {} : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="confirm-dialog-form" variant={variant} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    >
      <form id="confirm-dialog-form" className="form-fields" onSubmit={submit}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {message && <p className="confirm-message">{message}</p>}
        {children}
        {date && <TextInput id="confirm-date" label={date.label} type="date" min={date.min} required={date.required} value={day} onChange={(e) => setDay(e.target.value)} />}
        {reason && (
          <TextArea id="confirm-reason" label={reason.label} rows={3} maxLength={500} required={reason.required} placeholder={reason.placeholder} value={text} onChange={(e) => setText(e.target.value)} />
        )}
      </form>
    </Modal>
  )
}
