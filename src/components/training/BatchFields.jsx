import TextInput from '../form/TextInput.jsx'
import { DAYS, MODES } from '../../utils/training.js'

/**
 * The batch information and schedule fields, shared by "New batch" and "Edit batch".
 * form: values from batchToForm(); set(key, value). teachers: [{ id, full_name }] (create only).
 */
export default function BatchFields({ form, set, course, teachers }) {
  const field = (key) => ({ value: form[key], onChange: (e) => set(key, e.target.value) })
  const days = String(form.days_of_week || '').split(',').filter(Boolean)
  const toggleDay = (value) => {
    const next = days.includes(value) ? days.filter((d) => d !== value) : [...days, value]
    set('days_of_week', DAYS.map((d) => d.value).filter((d) => next.includes(d)).join(','))
  }

  return (
    <>
      <fieldset className="form-group">
        <legend>Batch</legend>
        <div className="form-row">
          <TextInput id="batch_name" label="Batch name" placeholder={`e.g. ${course?.course_code ?? 'CSS'} Batch 2027-01`} required maxLength={100} {...field('batch_name')} />
          <TextInput id="capacity" label="Capacity" type="number" min={1} max={500} {...field('capacity')} />
        </div>
        {teachers && (
          <label className="field" htmlFor="instructor_id">
            <span>Teacher</span>
            <select id="instructor_id" {...field('instructor_id')}>
              <option value="">Assign later</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </label>
        )}
      </fieldset>

      <fieldset className="form-group">
        <legend>Training period</legend>
        <div className="form-row even">
          <TextInput id="start_date" label="Start date" type="date" {...field('start_date')} />
          <TextInput id="end_date" label="Expected completion" type="date" min={form.start_date || undefined} {...field('end_date')} />
        </div>
        <div className="form-row even">
          <TextInput
            id="total_hours"
            label="Total training hours"
            type="number"
            min={1}
            max={5000}
            placeholder={course?.duration_hours ? `Course: ${course.duration_hours}` : 'e.g. 280'}
            {...field('total_hours')}
          />
          <TextInput id="training_days" label="Number of training days" type="number" min={1} max={1000} placeholder={course?.training_days ? `Course: ${course.training_days}` : 'e.g. 35'} {...field('training_days')} />
        </div>
        <p className="field-hint">Leave hours blank to use the course&apos;s {course?.duration_hours ? `${course.duration_hours} hours` : 'hours'}. The batch completes on its own only after these hours are recorded in attendance.</p>
      </fieldset>

      <fieldset className="form-group">
        <legend>Schedule</legend>
        <div className="field">
          <span id="days-label">Training days</span>
          <div className="day-picker" role="group" aria-labelledby="days-label">
            {DAYS.map((d) => (
              <label key={d.value} className={days.includes(d.value) ? 'day-chip on' : 'day-chip'}>
                <input type="checkbox" checked={days.includes(d.value)} onChange={() => toggleDay(d.value)} />
                {d.label}
              </label>
            ))}
          </div>
        </div>
        <div className="form-row even">
          <TextInput id="session_start" label="Daily start time" type="time" {...field('session_start')} />
          <TextInput id="session_end" label="Daily end time" type="time" {...field('session_end')} />
        </div>
        <div className="form-row even">
          <TextInput id="venue" label="Venue or room" placeholder="e.g. ICT Room 1" maxLength={150} {...field('venue')} />
          <TextInput id="session_frequency" label="Session frequency" placeholder="e.g. Daily, one session per day" maxLength={60} {...field('session_frequency')} />
        </div>
        <label className="field" htmlFor="training_mode">
          <span>Training mode</span>
          <select id="training_mode" {...field('training_mode')}>
            <option value="">Same as the course{course?.training_mode ? ` (${MODES.find((m) => m.value === course.training_mode)?.label})` : ''}</option>
            {MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <label className="check-field">
        <input type="checkbox" checked={Boolean(form.requires_confirmation)} onChange={(e) => set('requires_confirmation', e.target.checked)} />
        <span>
          <strong>Require my confirmation to complete</strong>
          <small>The batch stays active after its end date until an administrator confirms completion, even when its hours are met.</small>
        </span>
      </label>
    </>
  )
}

