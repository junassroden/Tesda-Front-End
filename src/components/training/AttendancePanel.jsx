import { useState } from 'react'
import Button from '../Button/Button.jsx'
import DataTable from '../DataTable/DataTable.jsx'
import StatusBadge from '../DataTable/StatusBadge.jsx'
import TextInput from '../form/TextInput.jsx'
import Icon from '../Icon/Icon.jsx'
import Modal from '../Modal/Modal.jsx'
import { batchService } from '../../services/trainingService.js'
import { shortDate } from '../../utils/format.js'
import { hoursLabel, sessionLabel } from '../../utils/training.js'

const MARKS = ['present', 'late', 'absent', 'excused']
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)

/**
 * Training sessions and attendance of a batch. Recorded hours drive the batch's
 * progress and its automatic completion.
 * onSaved(payload) receives { sessions, students, batch } after each change.
 */
export default function AttendancePanel({ batch, students, sessions, canRecord, onSaved }) {
  const [editing, setEditing] = useState(null) // form values or null
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const active = students.filter((s) => s.status === 'active')
  const open = canRecord && batch.status === 'ongoing'

  const startNew = () => {
    setError('')
    setEditing({
      session_date: today(),
      start_time: (batch.session_start ?? '').slice(0, 5),
      end_time: (batch.session_end ?? '').slice(0, 5),
      hours: '',
      topic: '',
      status: 'held',
      attendance: Object.fromEntries(active.map((s) => [s.id, 'present'])),
      existing: false,
    })
  }

  const startEdit = (s) => {
    setError('')
    const marks = s.marks ?? {}
    setEditing({
      id: s.id,
      session_date: s.session_date,
      start_time: (s.start_time ?? '').slice(0, 5),
      end_time: (s.end_time ?? '').slice(0, 5),
      hours: s.hours ? String(s.hours) : '',
      topic: s.topic ?? '',
      status: s.status,
      attendance: Object.fromEntries(active.map((st) => [st.id, marks[st.id] ?? 'absent'])),
      existing: true,
    })
  }

  const set = (key, value) => setEditing((e) => ({ ...e, [key]: value }))
  const mark = (id, value) => setEditing((e) => ({ ...e, attendance: { ...e.attendance, [id]: value } }))
  const markAll = (value) => setEditing((e) => ({ ...e, attendance: Object.fromEntries(active.map((s) => [s.id, value])) }))

  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      // eslint-disable-next-line no-unused-vars
      const { id, existing, ...session } = editing
      const data = await batchService.recordSession(batch.id, session)
      onSaved(data)
      setEditing(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`Delete the session of ${shortDate(editing.session_date)} and its attendance?`)) return
    setBusy(true)
    try {
      onSaved(await batchService.deleteSession(batch.id, editing.id))
      setEditing(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    {
      key: 'session_date',
      label: 'Date',
      render: (s) => (
        <span className="cell-stack">
          <strong className="num">{shortDate(s.session_date)}</strong>
          <small>{s.start_time ? sessionLabel(s.start_time, s.end_time) : 'Time not recorded'}</small>
        </span>
      ),
    },
    { key: 'topic', label: 'Topic', className: 'cell-wrap', render: (s) => <span className="muted">{s.topic || '—'}</span> },
    { key: 'hours', label: 'Hours', align: 'end', render: (s) => <span className="num">{s.status === 'held' ? hoursLabel(s.hours) : '—'}</span> },
    { key: 'present', label: 'Present', align: 'end', render: (s) => <span className="num">{s.status === 'held' ? `${s.present}/${Object.keys(s.marks ?? {}).length}` : '—'}</span> },
    { key: 'status', label: 'Session', render: (s) => <StatusBadge status={s.status} /> },
  ]

  return (
    <>
      <div className="panel-toolbar">
        <p className="muted">
          {batch.sessions_held} {batch.sessions_held === 1 ? 'session' : 'sessions'} held · {hoursLabel(batch.held_hours)} of {batch.required_hours ? `${batch.required_hours} required hours` : 'hours (no requirement set)'}
        </p>
        {open && (
          <Button onClick={startNew} disabled={!active.length} title={!active.length ? 'Enroll trainees first' : undefined}>
            <Icon name="plus" size={16} />
            Record session
          </Button>
        )}
      </div>
      {!open && canRecord && batch.status !== 'ongoing' && (
        <p className="inline-alert neutral">
          <Icon name="clock" size={16} />
          {batch.status === 'upcoming' ? 'Attendance opens when the batch starts.' : batch.status === 'suspended' ? 'Training is suspended. Attendance resumes when the batch is resumed.' : 'This batch is closed. Its attendance is kept as a record.'}
        </p>
      )}
      <DataTable
        columns={columns}
        rows={sessions}
        empty={{ icon: 'calendar', title: 'No sessions recorded', text: open ? 'Record each training day with its hours and attendance.' : 'No training sessions were recorded for this batch.' }}
        onRowClick={open ? startEdit : undefined}
      />

      <Modal
        open={Boolean(editing)}
        title={editing?.existing ? `Session of ${shortDate(editing.session_date)}` : 'Record a session'}
        onClose={() => !busy && setEditing(null)}
        footer={
          <>
            {editing?.existing && (
              <Button variant="ghost" onClick={remove} disabled={busy} className="push-left">
                <Icon name="trash" size={16} />
                Delete
              </Button>
            )}
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" form="session-form" disabled={busy}>
              {busy ? 'Saving…' : 'Save session'}
            </Button>
          </>
        }
      >
        {editing && (
          <form id="session-form" className="form-fields" onSubmit={save}>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-row even">
              <TextInput id="session_date" label="Date" type="date" required max={today()} min={batch.start_date || undefined} value={editing.session_date} disabled={editing.existing} onChange={(e) => set('session_date', e.target.value)} />
              <label className="field" htmlFor="session_status">
                <span>Session</span>
                <select id="session_status" value={editing.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="held">Held</option>
                  <option value="cancelled">Cancelled (no hours)</option>
                </select>
              </label>
            </div>
            {editing.status === 'held' && (
              <>
                <div className="form-row even">
                  <TextInput id="start_time" label="Start" type="time" value={editing.start_time} onChange={(e) => set('start_time', e.target.value)} />
                  <TextInput id="end_time" label="End" type="time" value={editing.end_time} onChange={(e) => set('end_time', e.target.value)} />
                </div>
                <TextInput id="hours" label="Training hours" type="number" step="0.5" min={0.5} max={24} placeholder="Worked out from the times (minus 1 h lunch for full days)" value={editing.hours} onChange={(e) => set('hours', e.target.value)} />
              </>
            )}
            <TextInput id="topic" label="Topic or module" maxLength={200} placeholder="e.g. Module 2: Installing operating systems" value={editing.topic} onChange={(e) => set('topic', e.target.value)} />
            {editing.status === 'held' && (
              <fieldset className="form-group">
                <legend>
                  Attendance
                  <span className="legend-actions">
                    <button type="button" className="link-btn" onClick={() => markAll('present')}>
                      All present
                    </button>
                  </span>
                </legend>
                <ul className="mark-list">
                  {active.map((s) => (
                    <li key={s.id}>
                      <span className="truncate">{s.full_name}</span>
                      <div className="segmented" role="radiogroup" aria-label={`Attendance for ${s.full_name}`}>
                        {MARKS.map((m) => (
                          <label key={m} className={editing.attendance[s.id] === m ? `on mark-${m}` : undefined}>
                            <input type="radio" name={`mark-${s.id}`} value={m} checked={editing.attendance[s.id] === m} onChange={() => mark(s.id, m)} />
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                          </label>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </fieldset>
            )}
          </form>
        )}
      </Modal>
    </>
  )
}
