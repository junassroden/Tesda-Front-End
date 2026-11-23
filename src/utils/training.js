// Display helpers for courses, batches, schedules and documents.
import { shortDate } from './format.js'

export const DAYS = [
  { value: 'mon', label: 'Mon', long: 'Monday' },
  { value: 'tue', label: 'Tue', long: 'Tuesday' },
  { value: 'wed', label: 'Wed', long: 'Wednesday' },
  { value: 'thu', label: 'Thu', long: 'Thursday' },
  { value: 'fri', label: 'Fri', long: 'Friday' },
  { value: 'sat', label: 'Sat', long: 'Saturday' },
  { value: 'sun', label: 'Sun', long: 'Sunday' },
]

export const MODES = [
  { value: 'face_to_face', label: 'Face-to-face' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Hybrid' },
]

export const CIVIL_STATUSES = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'separated', label: 'Separated' },
]

export const modeLabel = (value) => MODES.find((m) => m.value === value)?.label ?? '—'
export const civilLabel = (value) => CIVIL_STATUSES.find((c) => c.value === value)?.label ?? 'Not set'

/** "mon,tue,wed,thu,fri" -> "Monday to Friday"; "mon,wed,fri" -> "Mon, Wed, Fri" */
export function daysLabel(value) {
  const picked = String(value || '')
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean)
  if (!picked.length) return 'Days not set'
  const idx = picked.map((d) => DAYS.findIndex((x) => x.value === d)).filter((i) => i >= 0).sort((a, b) => a - b)
  const consecutive = idx.length > 2 && idx.every((v, i) => i === 0 || v === idx[i - 1] + 1)
  if (consecutive) return `${DAYS[idx[0]].long} to ${DAYS[idx[idx.length - 1]].long}`
  return idx.map((i) => DAYS[i].label).join(', ')
}

/** "08:00:00" -> "8:00 AM" */
export function timeLabel(value) {
  if (!value) return ''
  const [h, m] = String(value).split(':').map(Number)
  if (Number.isNaN(h)) return ''
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, '0')} ${suffix}`
}

export const sessionLabel = (start, end) => (start && end ? `${timeLabel(start)} – ${timeLabel(end)}` : start ? `From ${timeLabel(start)}` : 'Time not set')

/** Course estimate: "10 weeks", "3 months". */
export const durationLabel = (course) =>
  course?.duration_value ? `${course.duration_value} ${course.duration_unit === 'months' ? (course.duration_value === 1 ? 'month' : 'months') : course.duration_value === 1 ? 'week' : 'weeks'}` : 'Not set'

export const hoursLabel = (hours) => (hours || hours === 0 ? `${Number(hours).toLocaleString('en-PH', { maximumFractionDigits: 2 })} h` : 'Not set')

/** Plain-language training status for a batch, accounting for review and suspension. */
export function trainingState(batch) {
  if (!batch) return ''
  if (batch.status === 'suspended') return 'Suspended'
  if (batch.needs_review) return 'Needs review'
  if (batch.status === 'ongoing') return 'Ongoing'
  if (batch.status === 'upcoming') return batch.start_date ? `Starts ${shortDate(batch.start_date)}` : 'Upcoming'
  if (batch.status === 'completed') return 'Completed'
  if (batch.status === 'cancelled') return 'Cancelled'
  return batch.status
}

/** The status shown in a badge: review overrides "ongoing". */
export const batchBadge = (batch) => (batch?.needs_review ? 'needs_review' : batch?.status)

export const DOC_STATUS_LABEL = {
  not_submitted: 'Not submitted',
  submitted: 'Submitted',
  under_review: 'Under review',
  verified: 'Verified',
  rejected: 'Rejected',
}

export const fileSize = (bytes) => {
  const n = Number(bytes) || 0
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export const initials = (name = '') =>
  String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

/** Batch fields as the edit form holds them (all strings). */
export function batchToForm(batch = {}) {
  return {
    batch_name: batch.batch_name ?? '',
    start_date: batch.start_date ?? '',
    end_date: batch.end_date ?? '',
    total_hours: batch.total_hours ?? '',
    training_days: batch.training_days ?? '',
    days_of_week: batch.days_of_week ?? 'mon,tue,wed,thu,fri',
    session_start: (batch.session_start ?? '').slice(0, 5),
    session_end: (batch.session_end ?? '').slice(0, 5),
    venue: batch.venue ?? '',
    session_frequency: batch.session_frequency ?? '',
    training_mode: batch.batch_training_mode ?? '',
    capacity: batch.capacity ?? 25,
    requires_confirmation: Number(batch.requires_confirmation) === 1,
    instructor_id: batch.instructor_id ?? '',
  }
}

/** Batch form values -> API payload. */
export const batchPayload = (form) => ({
  ...form,
  capacity: Number(form.capacity) || 25,
  requires_confirmation: form.requires_confirmation ? 1 : 0,
})

/** Student record form fields (as the /center/students endpoint names them). */
export const EMPTY_STUDENT = {
  first_name: '',
  middle_name: '',
  last_name: '',
  birthdate: '',
  sex: '',
  civil_status: '',
  highest_education: '',
  address: '',
  guardian_name: '',
  guardian_contact: '',
  email: '',
  contact_number: '',
}

export const studentToForm = (s = {}) => Object.fromEntries(Object.keys(EMPTY_STUDENT).map((k) => [k, s[k] ?? '']))
