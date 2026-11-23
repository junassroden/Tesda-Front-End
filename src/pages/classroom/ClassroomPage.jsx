import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import EmptyState, { ErrorState } from '../../components/EmptyState/EmptyState.jsx'
import TextArea from '../../components/form/TextArea.jsx'
import TextInput from '../../components/form/TextInput.jsx'
import Icon from '../../components/Icon/Icon.jsx'
import Modal from '../../components/Modal/Modal.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import Tabs from '../../components/Tabs/Tabs.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import AttendancePanel from '../../components/training/AttendancePanel.jsx'
import FilePicker from '../../components/training/FilePicker.jsx'
import Meter from '../../components/training/Meter.jsx'
import { ROUTES } from '../../constants/routes.js'
import { batchService, classroomService } from '../../services/trainingService.js'
import { fullDateTime, shortDate, timeAgo } from '../../utils/format.js'
import { daysLabel, fileSize, initials, sessionLabel, trainingState } from '../../utils/training.js'

const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xlsx,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov,.txt'

const isPastDue = (item) => item.due_at && new Date(item.due_at.replace(' ', 'T')) < new Date()

/** A student's state on one assignment: graded | turned_in | missing | assigned. */
const workState = (item) => (item.submission ? (item.submission.status === 'graded' ? 'graded' : 'turned_in') : isPastDue(item) ? 'missing' : 'assigned')

/** One batch's virtual classroom. portal: 'teacher' | 'student'. */
export default function ClassroomPage({ portal }) {
  const { batchId } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('stream')
  const [notice, setNotice] = useState('')
  const back = portal === 'teacher' ? ROUTES.TEACHER.CLASSROOMS : ROUTES.STUDENT.CLASSROOMS

  const load = useCallback(
    () =>
      classroomService
        .get(batchId)
        .then((d) => {
          setError('')
          setData(d)
        })
        .catch((err) => setError(err.message)),
    [batchId],
  )

  useEffect(() => {
    load()
  }, [load])

  const say = (payload) => {
    if (payload?.message) setNotice(payload.message)
  }

  if (error && !data) {
    return (
      <>
        <PageHeader title="Classroom" />
        <Workspace back={back} backLabel="Classrooms">
          <ErrorState what="this classroom" message={error} onRetry={load} />
        </Workspace>
      </>
    )
  }
  if (!data) {
    return (
      <>
        <PageHeader title="Classroom" subtitle="Loading…" />
        <Workspace back={back} backLabel="Classrooms">
          <div className="workspace-pad muted">Loading the classroom…</div>
        </Workspace>
      </>
    )
  }

  const { batch, access } = data
  const teacher = access.role === 'teacher'
  const canPost = teacher && !access.read_only
  const assignments = data.items.filter((i) => i.item_type === 'assignment')

  const tabs = [
    { value: 'stream', label: 'Stream' },
    { value: 'classwork', label: 'Classwork', count: data.items.length },
    { value: 'people', label: 'People', count: data.people.students.length },
    { value: 'grades', label: 'Grades' },
    ...(teacher ? [{ value: 'attendance', label: 'Attendance' }] : []),
  ]

  return (
    <>
      <PageHeader title={batch.batch_name} subtitle={`${batch.course_name} · ${batch.course_code}`} />

      <section className="class-banner">
        <div>
          <span className="eyebrow">{teacher ? 'Your class' : 'Your classroom'}</span>
          <h2>{batch.course_name}</h2>
          <p>
            {batch.batch_name} · {batch.instructor_name || 'No teacher assigned'}
            {batch.days_of_week ? ` · ${daysLabel(batch.days_of_week)}` : ''}
            {batch.session_start ? `, ${sessionLabel(batch.session_start, batch.session_end)}` : ''}
            {batch.venue ? ` · ${batch.venue}` : ''}
          </p>
        </div>
        <div className="class-banner-side">
          <StatusBadge status={batch.status} />
          <Meter label="Training progress" value={batch.progress} />
        </div>
      </section>

      {access.read_only && (
        <p className="inline-alert neutral standalone">
          <Icon name="calendar" size={16} />
          {access.membership === 'completed' || batch.status === 'completed'
            ? 'This training is completed. The classroom stays open for reading; nothing new can be posted or turned in.'
            : 'This batch was cancelled. The classroom is kept read only.'}
        </p>
      )}
      {notice && (
        <p className="notice-bar" role="status">
          <Icon name="check" size={16} />
          {notice}
          <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => setNotice('')}>
            <Icon name="x" size={14} />
          </button>
        </p>
      )}

      <Workspace back={back} backLabel="Classrooms" flush>
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        {tab === 'stream' && (
          <Stream
            data={data}
            canPost={canPost}
            onPosted={(p) => {
              setData((d) => ({ ...d, stream: p.stream }))
              say(p)
            }}
            openClasswork={() => setTab('classwork')}
          />
        )}
        {tab === 'classwork' && (
          <Classwork
            data={data}
            teacher={teacher}
            canPost={canPost}
            readOnly={access.read_only}
            onItems={(p) => {
              setData((d) => ({ ...d, items: p.items }))
              say(p)
            }}
            onReload={load}
          />
        )}
        {tab === 'people' && <People people={data.people} teacher={teacher} />}
        {tab === 'grades' && (teacher ? <GradeSheet data={data} assignments={assignments} /> : <MyGrades assignments={assignments} />)}
        {tab === 'attendance' && teacher && <TeacherAttendance batchId={batch.id} />}
      </Workspace>
    </>
  )
}

/* ------------------------------------------------------------------ Stream */

function Stream({ data, canPost, onPosted, openClasswork }) {
  const [body, setBody] = useState('')
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const teacher = data.access.role === 'teacher'

  // Announcements and new classwork, newest first.
  const feed = useMemo(
    () =>
      [
        ...data.stream.map((a) => ({ kind: 'post', at: a.published_at, ...a })),
        ...data.items.map((i) => ({ kind: 'item', at: i.created_at, ...i, id: `item-${i.id}` })),
      ].sort((a, b) => String(b.at).localeCompare(String(a.at))),
    [data.stream, data.items],
  )

  const upcoming = data.items
    .filter((i) => i.item_type === 'assignment' && i.due_at && !isPastDue(i) && (teacher || !i.submission))
    .sort((a, b) => a.due_at.localeCompare(b.due_at))
    .slice(0, 5)

  const post = async (event) => {
    event.preventDefault()
    if (!body.trim()) return
    setBusy(true)
    setError('')
    try {
      onPosted(await classroomService.announce(data.batch.id, { title: title.trim(), body: body.trim() }))
      setBody('')
      setTitle('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this announcement?')) return
    try {
      onPosted(await classroomService.deleteAnnouncement(data.batch.id, id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="class-layout">
      <aside className="class-side">
        <section className="side-box">
          <h3>Upcoming</h3>
          {upcoming.length ? (
            <ul className="due-list">
              {upcoming.map((i) => (
                <li key={i.id}>
                  <button type="button" className="link-btn" onClick={openClasswork}>
                    {i.title}
                  </button>
                  <small>Due {fullDateTime(i.due_at)}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{teacher ? 'No upcoming deadlines.' : 'Nothing due soon.'}</p>
          )}
        </section>
      </aside>
      <div className="class-main">
        {canPost && (
          <form className="composer" onSubmit={post}>
            {error && <p className="form-error">{error}</p>}
            <TextInput id="post-title" label="Title (optional)" maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextArea id="post-body" label="Announce something to your class" rows={3} maxLength={10000} value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="composer-actions">
              <Button type="submit" disabled={busy || !body.trim()}>
                {busy ? 'Posting…' : 'Post'}
              </Button>
            </div>
          </form>
        )}
        {feed.length ? (
          <ul className="feed">
            {feed.map((f) =>
              f.kind === 'post' ? (
                <li key={f.id} className="feed-post">
                  <header>
                    <span className="avatar">{initials(f.posted_by_name)}</span>
                    <span className="cell-stack">
                      <strong>{f.posted_by_name || 'Teacher'}</strong>
                      <small title={fullDateTime(f.published_at)}>{timeAgo(f.published_at)}</small>
                    </span>
                    {canPost && (
                      <button type="button" className="icon-btn" aria-label="Delete announcement" onClick={() => remove(f.id)}>
                        <Icon name="trash" size={15} />
                      </button>
                    )}
                  </header>
                  {f.title && f.title !== f.body.split('\n')[0] && <h4>{f.title}</h4>}
                  <p className="pre-line">{f.body}</p>
                </li>
              ) : (
                <li key={f.id} className="feed-item">
                  <span className="row-icon">
                    <Icon name={f.item_type === 'assignment' ? 'edit' : 'documents'} size={16} />
                  </span>
                  <button type="button" className="link-btn" onClick={openClasswork}>
                    {f.created_by_name || 'Teacher'} posted a new {f.item_type}: {f.title}
                  </button>
                  <small>{timeAgo(f.created_at)}</small>
                </li>
              ),
            )}
          </ul>
        ) : (
          <EmptyState icon="inbox" title="Nothing posted yet" text={canPost ? 'Post an announcement, or share materials and assignments under Classwork.' : 'Announcements and new classwork from your teacher appear here.'} />
        )}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- Classwork */

function Classwork({ data, teacher, canPost, readOnly, onItems, onReload }) {
  const [creating, setCreating] = useState(null) // 'material' | 'assignment'
  const [openId, setOpenId] = useState(null)
  const [reviewing, setReviewing] = useState(null)

  const groups = useMemo(() => {
    const by = new Map()
    data.items.forEach((i) => {
      const key = i.topic || 'No topic'
      if (!by.has(key)) by.set(key, [])
      by.get(key).push(i)
    })
    return [...by.entries()]
  }, [data.items])

  const remove = async (item) => {
    if (!window.confirm(`Delete “${item.title}”? ${item.item_type === 'assignment' ? 'Its submissions and grades are deleted too.' : ''}`)) return
    try {
      onItems(await classroomService.deleteItem(item.id))
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <div className="workspace-pad">
      {canPost && (
        <div className="panel-toolbar">
          <p className="muted">Share learning materials and assignments with this batch.</p>
          <div className="button-row">
            <Button variant="secondary" onClick={() => setCreating('material')}>
              <Icon name="documents" size={16} />
              Material
            </Button>
            <Button onClick={() => setCreating('assignment')}>
              <Icon name="plus" size={16} />
              Assignment
            </Button>
          </div>
        </div>
      )}
      {groups.length === 0 ? (
        <EmptyState icon="documents" title="No classwork yet" text={canPost ? 'Upload modules, slides or videos, and create assignments with deadlines.' : 'Materials and assignments from your teacher appear here.'} />
      ) : (
        groups.map(([topic, items]) => (
          <section key={topic} className="topic">
            <h3 className="topic-title">{topic}</h3>
            <ul className="work-list">
              {items.map((item) => {
                const open = openId === item.id
                return (
                  <li key={item.id} className={open ? 'work open' : 'work'}>
                    <button type="button" className="work-head" aria-expanded={open} onClick={() => setOpenId(open ? null : item.id)}>
                      <span className={`row-icon ${item.item_type}`}>
                        <Icon name={item.item_type === 'assignment' ? 'edit' : 'documents'} size={16} />
                      </span>
                      <span className="cell-stack">
                        <strong>{item.title}</strong>
                        <small>
                          {item.item_type === 'assignment' ? (item.due_at ? `Due ${fullDateTime(item.due_at)}` : 'No due date') : `Material · ${shortDate(item.created_at)}`}
                          {item.max_points ? ` · ${item.max_points} points` : ''}
                        </small>
                      </span>
                      {item.item_type !== 'assignment' ? (
                        <span />
                      ) : teacher ? (
                          <span className="work-count num">
                            {item.turned_in} turned in · {item.graded} graded
                          </span>
                      ) : (
                        <StatusBadge status={workState(item)} />
                      )}
                      <Icon name={open ? 'chevronUp' : 'chevronDown'} size={16} />
                    </button>
                    {open && (
                      <div className="work-body">
                        {item.instructions && <p className="pre-line">{item.instructions}</p>}
                        {item.link_url && (
                          <a href={item.link_url} target="_blank" rel="noreferrer noopener" className="attachment">
                            <Icon name="share" size={15} />
                            <span className="truncate">{item.link_url}</span>
                          </a>
                        )}
                        <Attachments files={item.files} />
                        {teacher ? (
                          <div className="button-row">
                            {item.item_type === 'assignment' && (
                              <Button onClick={() => setReviewing(item)}>
                                Review work ({item.turned_in})
                              </Button>
                            )}
                            {canPost && (
                              <Button variant="ghost" onClick={() => remove(item)}>
                                <Icon name="trash" size={15} />
                                Delete
                              </Button>
                            )}
                          </div>
                        ) : (
                          item.item_type === 'assignment' && <MyWork item={item} readOnly={readOnly} onItems={onItems} />
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}

      {creating && <CreateItemModal type={creating} batchId={data.batch.id} topics={groups.map(([t]) => t).filter((t) => t !== 'No topic')} onClose={() => setCreating(null)} onDone={(p) => { setCreating(null); onItems(p) }} />}
      {reviewing && (
        <ReviewModal
          item={reviewing}
          readOnly={readOnly}
          onClose={() => {
            setReviewing(null)
            onReload()
          }}
        />
      )}
    </div>
  )
}

function Attachments({ files, onRemove }) {
  if (!files?.length) return null
  return (
    <ul className="attachments">
      {files.map((f) => (
        <li key={f.id} className="attachment">
          <Icon name={f.mime_type?.startsWith('image/') ? 'image' : f.mime_type?.startsWith('video/') ? 'camera' : 'documents'} size={15} />
          <a href={classroomService.fileUrl(f.id)} target="_blank" rel="noreferrer" className="truncate" title={f.original_name}>
            {f.original_name}
          </a>
          <small className="num">{fileSize(f.file_size)}</small>
          <a className="icon-btn" href={classroomService.downloadUrl(f.id)} aria-label={`Download ${f.original_name}`}>
            <Icon name="download" size={14} />
          </a>
          {onRemove && (
            <button type="button" className="icon-btn" aria-label={`Remove ${f.original_name}`} onClick={() => onRemove(f)}>
              <Icon name="x" size={14} />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

/** The student's own submission for an assignment. */
function MyWork({ item, readOnly, onItems }) {
  const sub = item.submission
  const [text, setText] = useState(sub?.answer_text ?? '')
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const graded = sub?.status === 'graded'
  const locked = readOnly || graded

  const turnIn = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      onItems(await classroomService.submit(item.id, text.trim(), files))
      setFiles([])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const removeFile = async (f) => {
    try {
      onItems(await classroomService.deleteFile(f.id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="my-work">
      <div className="my-work-head">
        <h4>Your work</h4>
        <StatusBadge status={workState(item)} />
      </div>
      {sub && (
        <p className="muted">
          Turned in {fullDateTime(sub.submitted_at)}
          {Number(sub.is_late) ? ' · late' : ''}
        </p>
      )}
      {graded && (
        <div className="grade-box">
          <strong className="num">
            {Number(sub.grade)}
            {item.max_points ? ` / ${item.max_points}` : ''}
          </strong>
          {sub.feedback && <p className="pre-line">{sub.feedback}</p>}
        </div>
      )}
      <Attachments files={sub?.files} onRemove={!locked ? removeFile : undefined} />
      {locked ? (
        sub?.answer_text && <p className="pre-line answer">{sub.answer_text}</p>
      ) : (
        <form className="form-fields" onSubmit={turnIn}>
          {error && <p className="form-error">{error}</p>}
          <TextArea id={`answer-${item.id}`} label="Answer or note (optional)" rows={3} maxLength={20000} value={text} onChange={(e) => setText(e.target.value)} />
          <FilePicker id={`work-${item.id}`} files={files} onChange={setFiles} accept={ACCEPT} max={10} hint="PDF, Office files, images or video, up to 100 MB each." />
          <div className="button-row end">
            <Button type="submit" disabled={busy || (!files.length && !text.trim() && !sub)}>
              {busy ? 'Turning in…' : sub ? 'Update submission' : 'Turn in'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

function CreateItemModal({ type, batchId, topics, onClose, onDone }) {
  const [form, setForm] = useState({ title: '', topic: '', instructions: '', link_url: '', due_at: '', max_points: type === 'assignment' ? '100' : '' })
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const field = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })

  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      onDone(await classroomService.createItem(batchId, { ...form, item_type: type }, files))
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      title={type === 'assignment' ? 'New assignment' : 'Share a material'}
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="item-form" disabled={busy}>
            {busy ? 'Uploading…' : type === 'assignment' ? 'Assign' : 'Share'}
          </Button>
        </>
      }
    >
      <form id="item-form" className="form-fields" onSubmit={save}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <TextInput id="item-title" label="Title" required maxLength={200} {...field('title')} />
        <TextInput id="item-topic" label="Topic" maxLength={100} list="topic-options" placeholder="e.g. Module 1: Hardware" {...field('topic')} />
        <datalist id="topic-options">
          {topics.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <TextArea id="item-instructions" label={type === 'assignment' ? 'Instructions' : 'Description'} rows={4} maxLength={20000} {...field('instructions')} />
        {type === 'assignment' && (
          <div className="form-row even">
            <TextInput id="item-due" label="Due" type="datetime-local" {...field('due_at')} />
            <TextInput id="item-points" label="Points" type="number" min={1} max={1000} {...field('max_points')} />
          </div>
        )}
        <TextInput id="item-link" label="Link (optional)" type="url" placeholder="https://…" maxLength={2048} {...field('link_url')} />
        <FilePicker id="item-files" label="Attachments" files={files} onChange={setFiles} accept={ACCEPT} max={10} hint="PDF, DOCX, PPTX, XLSX, images or MP4/WebM video, up to 100 MB each." />
      </form>
    </Modal>
  )
}

/** Teacher: every member's work on one assignment, with grading. */
function ReviewModal({ item, readOnly, onClose }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [grading, setGrading] = useState({}) // submission id -> { grade, feedback }

  useEffect(() => {
    classroomService
      .submissions(item.id)
      .then((d) => setRows(d.submissions ?? []))
      .catch((err) => setError(err.message))
  }, [item.id])

  const value = (r) => grading[r.id] ?? { grade: r.grade !== null && r.grade !== undefined ? String(Number(r.grade)) : '', feedback: r.feedback ?? '' }
  const set = (r, key, v) => setGrading((g) => ({ ...g, [r.id]: { ...value(r), [key]: v } }))
  const save = async (r) => {
    setError('')
    try {
      const d = await classroomService.grade(r.id, value(r).grade, value(r).feedback)
      setRows(d.submissions)
      setGrading((g) => {
        const next = { ...g }
        delete next[r.id]
        return next
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const turned = (rows ?? []).filter((r) => r.id)
  return (
    <Modal open title={`Review: ${item.title}`} onClose={onClose} footer={<Button onClick={onClose}>Done</Button>}>
      <div className="form-fields">
        {error && <p className="form-error">{error}</p>}
        {rows === null ? (
          <p className="muted">Loading…</p>
        ) : (
          <>
            <p className="muted">
              {turned.length} of {rows.filter((r) => ['active', 'completed'].includes(r.membership_status)).length} turned in
              {item.max_points ? ` · out of ${item.max_points} points` : ''}
            </p>
            <ul className="review-list">
              {rows.map((r) => (
                <li key={r.student_id}>
                  <div className="review-who">
                    <span className="avatar">{initials(r.full_name)}</span>
                    <span className="cell-stack">
                      <strong>{r.full_name}</strong>
                      <small>
                        {r.id ? `Turned in ${fullDateTime(r.submitted_at)}${Number(r.is_late) ? ' · late' : ''}` : isPastDue(item) ? 'Missing' : 'Not turned in yet'}
                        {!['active', 'completed'].includes(r.membership_status) ? ' · no longer in this batch' : ''}
                      </small>
                    </span>
                    <StatusBadge status={r.id ? (r.status === 'graded' ? 'graded' : 'turned_in') : isPastDue(item) ? 'missing' : 'assigned'} />
                  </div>
                  {r.id && (
                    <div className="review-work">
                      {r.answer_text && <p className="pre-line answer">{r.answer_text}</p>}
                      <Attachments files={r.files} />
                      {!readOnly && (
                        <div className="grade-row">
                          <TextInput id={`grade-${r.id}`} label="Grade" type="number" min={0} max={item.max_points || undefined} step="0.5" value={value(r).grade} onChange={(e) => set(r, 'grade', e.target.value)} />
                          <TextInput id={`feedback-${r.id}`} label="Feedback" maxLength={5000} value={value(r).feedback} onChange={(e) => set(r, 'feedback', e.target.value)} />
                          <Button onClick={() => save(r)} disabled={value(r).grade === ''}>
                            {r.status === 'graded' ? 'Update' : 'Return'}
                          </Button>
                        </div>
                      )}
                      {readOnly && r.status === 'graded' && (
                        <p className="muted">
                          Grade {Number(r.grade)}
                          {r.feedback ? ` · ${r.feedback}` : ''}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------ People, grades */

function People({ people, teacher }) {
  return (
    <div className="workspace-pad people">
      <section>
        <h3 className="topic-title">Teacher</h3>
        {people.teacher ? (
          <ul className="people-list">
            <li>
              <span className="avatar">{initials(people.teacher.full_name)}</span>
              <span className="cell-stack">
                <strong>{people.teacher.full_name}</strong>
                {people.teacher.email && <small>{people.teacher.email}</small>}
              </span>
            </li>
          </ul>
        ) : (
          <p className="muted">The learning center has not assigned a teacher yet.</p>
        )}
      </section>
      <section>
        <h3 className="topic-title">
          {teacher ? 'Trainees' : 'Classmates'} <span className="muted num">{people.students.length}</span>
        </h3>
        {people.students.length ? (
          <ul className="people-list">
            {people.students.map((s) => (
              <li key={s.id}>
                <span className="avatar">{initials(s.full_name)}</span>
                <span className="cell-stack">
                  <strong>{s.full_name}</strong>
                  {teacher && <small className="num">{s.student_number || s.email}</small>}
                </span>
                {teacher && s.status === 'completed' && <StatusBadge status="completed" />}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No trainees are enrolled yet. The learning center enrolls them.</p>
        )}
      </section>
      {teacher && people.former?.length > 0 && (
        <section>
          <h3 className="topic-title">Former trainees</h3>
          <p className="field-hint">Removed or transferred by the learning center. They no longer see this classroom; their past work is kept.</p>
          <ul className="people-list">
            {people.former.map((s) => (
              <li key={s.id} className="is-former">
                <span className="avatar">{initials(s.full_name)}</span>
                <span className="cell-stack">
                  <strong>{s.full_name}</strong>
                  <small>{s.status === 'transferred' ? 'Transferred' : 'Removed'}</small>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function GradeSheet({ data, assignments }) {
  const byKey = useMemo(() => Object.fromEntries((data.grades ?? []).map((g) => [`${g.item_id}-${g.student_id}`, g])), [data.grades])
  const students = data.people.students
  if (!assignments.length) return <EmptyState icon="edit" title="No assignments yet" text="Grades appear here once you create assignments and return work." />
  if (!students.length) return <EmptyState icon="users" title="No trainees yet" text="The learning center enrolls trainees in this batch." />
  const ordered = [...assignments].reverse()
  return (
    <div className="grade-sheet">
      <table>
        <thead>
          <tr>
            <th scope="col">Trainee</th>
            {ordered.map((a) => (
              <th key={a.id} scope="col" title={a.title}>
                <span className="truncate">{a.title}</span>
                <small>{a.max_points ? `of ${a.max_points}` : 'no points'}</small>
              </th>
            ))}
            <th scope="col">Completion</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const done = ordered.filter((a) => byKey[`${a.id}-${s.id}`]).length
            return (
              <tr key={s.id}>
                <th scope="row">{s.full_name}</th>
                {ordered.map((a) => {
                  const g = byKey[`${a.id}-${s.id}`]
                  return (
                    <td key={a.id} className="num">
                      {g ? g.status === 'graded' ? Number(g.grade) : <span className="cell-note">Turned in</span> : isPastDue(a) ? <span className="cell-note missing">Missing</span> : <span className="cell-note">—</span>}
                    </td>
                  )
                })}
                <td className="num">
                  {done}/{ordered.length}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MyGrades({ assignments }) {
  if (!assignments.length) return <EmptyState icon="edit" title="No assignments yet" text="Your grades and feedback appear here." />
  const graded = assignments.filter((a) => a.submission?.status === 'graded' && a.max_points)
  const pct = graded.length ? Math.round((graded.reduce((n, a) => n + Number(a.submission.grade) / a.max_points, 0) / graded.length) * 100) : null
  const done = assignments.filter((a) => a.submission).length
  return (
    <div className="workspace-pad">
      <div className="grade-summary">
        <Meter label="Assignments turned in" value={Math.round((done / assignments.length) * 100)} detail={`${done} of ${assignments.length}`} />
        <Meter label="Average score" value={pct} tone="success" detail={graded.length ? `Across ${graded.length} graded ${graded.length === 1 ? 'assignment' : 'assignments'}` : 'No graded work yet'} />
      </div>
      <ul className="work-list">
        {assignments.map((a) => (
          <li key={a.id} className="work">
            <div className="work-head static">
              <span className="cell-stack">
                <strong>{a.title}</strong>
                <small>{a.due_at ? `Due ${fullDateTime(a.due_at)}` : 'No due date'}</small>
                {a.submission?.feedback && <small className="feedback">Feedback: {a.submission.feedback}</small>}
              </span>
              <span className="num">{a.submission?.status === 'graded' ? `${Number(a.submission.grade)}${a.max_points ? ` / ${a.max_points}` : ''}` : ''}</span>
              <StatusBadge status={workState(a)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TeacherAttendance({ batchId }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    batchService
      .get(batchId)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [batchId])
  if (error) return <ErrorState what="attendance" message={error} />
  if (!data) return <div className="workspace-pad muted">Loading…</div>
  return (
    <>
      <p className="field-hint pad-x">
        {trainingState(data.batch)} · recorded hours move the batch toward completion. The learning center sees the same records.
      </p>
      <AttendancePanel batch={data.batch} students={data.students} sessions={data.sessions} canRecord={data.can_record_attendance} onSaved={(p) => setData((d) => ({ ...d, ...p }))} />
    </>
  )
}
