import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ErrorState } from '../../components/EmptyState/EmptyState.jsx'
import PdfPages from '../../components/training/PdfPages.jsx'
import { PrintHeader, PrintToolbar } from '../../components/training/PrintParts.jsx'
import { documentFiles, studentRecordService } from '../../services/trainingService.js'
import { dateRange, shortDate } from '../../utils/format.js'
import { DOC_STATUS_LABEL, civilLabel } from '../../utils/training.js'

const TITLES = { info: 'Student information sheet', checklist: 'Student document checklist', packet: 'Student enrollment packet' }

/** Print-ready student sheets: information sheet, document checklist, or the full enrollment packet. */
export default function PrintStudentPage() {
  const { studentId, kind } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const title = TITLES[kind] ?? TITLES.info
  useEffect(() => {
    document.title = data ? `${title} · ${data.student.full_name}` : title
  }, [data, title])

  useEffect(() => {
    studentRecordService
      .get(studentId)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [studentId])

  if (error) return <ErrorState what="this record" message={error} />
  if (!data) return <p className="print-loading">Preparing the sheet…</p>

  const s = data.student
  const verified = data.documents.filter((d) => d.status === 'verified' && d.files.length)

  return (
    <div className="print-doc">
      <PrintToolbar title={title} waitFor={kind === 'packet' ? verified.reduce((n, d) => n + d.files.filter((f) => f.mime_type === 'application/pdf').length, 0) : 0} />
      <PrintHeader center={s.training_center_name} address={s.center_address} title={title} />

      {(kind === 'info' || kind === 'packet') && <InfoSheet s={s} enrollments={data.enrollments} />}
      {(kind === 'checklist' || kind === 'packet') && <Checklist s={s} documents={data.documents} summary={data.summary} breakBefore={kind === 'packet'} />}
      {kind === 'packet' && <Copies documents={verified} />}

      <footer className="print-foot">
        Generated {new Date().toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' })} from TESDA NEXUS. Personal information: handle under the Data Privacy Act of 2012.
      </footer>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </div>
  )
}

function InfoSheet({ s, enrollments }) {
  return (
    <section className="print-section">
      <h2>Personal information</h2>
      <dl className="print-grid">
        <Row label="Student ID" value={s.student_number} />
        <Row label="Last name" value={s.last_name} />
        <Row label="First name" value={s.first_name} />
        <Row label="Middle name" value={s.middle_name} />
        <Row label="Birthdate" value={s.birthdate ? shortDate(s.birthdate) : ''} />
        <Row label="Sex" value={s.sex ? s.sex.charAt(0).toUpperCase() + s.sex.slice(1) : ''} />
        <Row label="Civil status" value={s.civil_status ? civilLabel(s.civil_status) : ''} />
        <Row label="Highest education" value={s.highest_education} />
        <Row label="Address" value={s.address} />
        <Row label="Email" value={s.email} />
        <Row label="Contact number" value={s.contact_number} />
        <Row label="Guardian / emergency contact" value={[s.guardian_name, s.guardian_contact].filter(Boolean).join(' · ')} />
      </dl>
      <h2>Training record</h2>
      {enrollments.length ? (
        <table className="print-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Batch</th>
              <th>Training period</th>
              <th>Teacher</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <tr key={e.batch_id}>
                <td>
                  {e.course_name} ({e.course_code})
                </td>
                <td>{e.batch_name}</td>
                <td>{dateRange(e.start_date, e.end_date)}</td>
                <td>{e.instructor_name || '—'}</td>
                <td>{e.membership_status === 'dropped' ? 'Removed' : e.membership_status.charAt(0).toUpperCase() + e.membership_status.slice(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Not enrolled in a batch yet.</p>
      )}
      <div className="print-sign">
        <div>
          <span />
          Signature of student over printed name
        </div>
        <div>
          <span />
          Registrar / learning center officer
        </div>
      </div>
    </section>
  )
}

function Checklist({ s, documents, summary, breakBefore }) {
  return (
    <section className={breakBefore ? 'print-section page-break' : 'print-section'}>
      <h2>Document checklist · {s.full_name}</h2>
      <p>
        {summary.verified} of {summary.required} required documents verified{summary.complete ? ': complete.' : '.'}
      </p>
      <table className="print-table">
        <thead>
          <tr>
            <th>Document</th>
            <th>Copies required</th>
            <th>Copies on file</th>
            <th>Status</th>
            <th>Verified</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => (
            <tr key={d.requirement_type_id}>
              <td>
                <span className="print-box" aria-hidden="true">
                  {d.status === 'verified' ? '✓' : ''}
                </span>
                {d.name}
              </td>
              <td>{d.applies ? d.required_copies : 'Not required'}</td>
              <td>{d.applies ? d.uploaded_copies : '—'}</td>
              <td>{d.applies ? DOC_STATUS_LABEL[d.status] : 'Not applicable'}</td>
              <td>{d.verified_at ? `${shortDate(d.verified_at)}${d.verified_by_name ? `, ${d.verified_by_name}` : ''}` : '—'}</td>
              <td>{d.remarks || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Copies({ documents }) {
  if (!documents.length) {
    return (
      <section className="print-section page-break">
        <h2>Verified document copies</h2>
        <p>No verified document copies are on file yet.</p>
      </section>
    )
  }
  return documents.map((d) => (
    <section key={d.requirement_type_id} className="print-section page-break">
      <h2>
        {d.name} · {d.files.length} {d.files.length === 1 ? 'copy' : 'copies'}
      </h2>
      {d.files.map((f, i) =>
        f.mime_type === 'application/pdf' ? (
          <PdfCopy key={f.id} file={f} index={i} />
        ) : (
          <figure key={f.id} className="packet-copy">
            <img className="packet-image" src={documentFiles.url(f.id)} alt={`${d.name}, copy ${i + 1}`} />
            <figcaption>
              Copy {i + 1}: {f.original_name}
            </figcaption>
          </figure>
        ),
      )}
    </section>
  ))
}

function PdfCopy({ file, index }) {
  return (
    <figure className="packet-copy">
      <PdfPages url={documentFiles.url(file.id)} name={file.original_name} />
      <figcaption>
        Copy {index + 1}: {file.original_name}
      </figcaption>
    </figure>
  )
}
