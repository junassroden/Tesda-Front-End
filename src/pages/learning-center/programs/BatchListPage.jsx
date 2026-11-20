import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Breadcrumb from '../../../components/Breadcrumb/Breadcrumb.jsx'
import Button from '../../../components/Button/Button.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../../components/DataTable/StatusBadge.jsx'
import TextInput from '../../../components/form/TextInput.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import Modal from '../../../components/Modal/Modal.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../../constants/routes.js'
import { programService } from '../../../services/programService.js'
import { dateRange } from '../../../utils/format.js'

const COLUMNS = [
  { key: 'batch_number', label: 'No.', render: (r) => <span className="num">{String(r.batch_number).padStart(2, '0')}</span> },
  { key: 'batch_name', label: 'Batch' },
  { key: 'instructor_name', label: 'Teacher', render: (r) => <span className="muted">{r.instructor_name || '—'}</span> },
  { key: 'dates', label: 'Schedule', render: (r) => <span className="muted num">{dateRange(r.start_date, r.end_date)}</span> },
  { key: 'enrolled', label: 'Trainees', align: 'end', render: (r) => <span className="num">{`${r.enrolled}/${r.capacity}`}</span> },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

const EMPTY_FORM = { batch_name: '', start_date: '', end_date: '', capacity: 25 }

// Figma: Batch Lists 06
export default function BatchListPage() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(
    () =>
      programService
        .batches(programId)
        .then((data) => {
          setCourse(data.course)
          setBatches(data.batches ?? [])
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false)),
    [programId],
  )

  useEffect(() => {
    load()
  }, [load])

  const field = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await programService.createBatch(programId, { ...form, capacity: Number(form.capacity) || 25 })
      setOpen(false)
      setForm(EMPTY_FORM)
      await load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const programName = course?.course_name ?? 'Program'
  const rows = batches.filter((b) => `${b.batch_name} ${b.instructor_name ?? ''}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <PageHeader title={programName} subtitle={course ? `${course.course_code} · ${course.qualification}` : 'Batches for this program.'} search={search} onSearch={setSearch} searchPlaceholder="Search batches" />
      <Workspace
        back={ROUTES.CENTER.PROGRAMS}
        backLabel="Programs"
        title="Batches"
        description={<Breadcrumb items={[{ label: 'Programs', to: ROUTES.CENTER.PROGRAMS }, { label: programName }]} />}
        actions={
          <Button onClick={() => setOpen(true)} disabled={!course}>
            <Icon name="plus" size={17} />
            New batch
          </Button>
        }
        flush
      >
        {error && (
          <p className="form-error inset" role="alert">
            {error}
          </p>
        )}
        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          empty={{ icon: 'calendar', title: 'No batches yet', text: 'Open a batch when a new class starts.' }}
          onRowClick={(b) => navigate(toPath(ROUTES.CENTER.STUDENTS, { programId, batchId: b.id }))}
        />
      </Workspace>

      <Modal
        open={open}
        title="New batch"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="batch-form" disabled={saving}>
              {saving ? 'Saving…' : 'Create batch'}
            </Button>
          </>
        }
      >
        <form id="batch-form" className="form-fields" onSubmit={save}>
          {formError && <p className="form-error">{formError}</p>}
          <TextInput id="batch_name" label="Batch name" placeholder={`e.g. ${course?.course_code ?? 'CSS'} Batch 2027-01`} required {...field('batch_name')} />
          <div className="form-row even">
            <TextInput id="start_date" label="Start date" type="date" {...field('start_date')} />
            <TextInput id="end_date" label="End date" type="date" {...field('end_date')} />
          </div>
          <TextInput id="capacity" label="Capacity" type="number" min={1} max={500} {...field('capacity')} />
        </form>
      </Modal>
    </>
  )
}
