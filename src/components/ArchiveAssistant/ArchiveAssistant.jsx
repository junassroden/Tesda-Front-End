import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES, toPath } from '../../constants/routes.js'
import { documentService } from '../../services/documentService.js'
import { shortDate } from '../../utils/format.js'
import Icon from '../Icon/Icon.jsx'

const MAX_LENGTH = 240
const EXAMPLES = ['Memorandum about the welding schedule', 'Certificates from 2026', 'Request letter for supplies']

/** The same light plural stem the server searches with, so highlights match what was found. */
function stem(word) {
  if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3)
  if (word.length > 4 && /(?:ches|shes|xes|sses)$/.test(word)) return word.slice(0, -2)
  if (word.length > 4 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

/** Wraps every matched word in the excerpt in <mark>. */
function Highlighted({ text, words }) {
  const stems = [...new Set(words.map(stem))].filter(Boolean)
  if (!stems.length) return text
  const escaped = stems.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'))
  return parts.map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : part))
}

function DocumentResult({ doc, terms }) {
  const matched = doc.matched ?? []
  const isImage = doc.mime_type?.startsWith('image/')
  const detail = toPath(ROUTES.ADMIN.DOCUMENT_DETAIL, { id: doc.id })
  const meta = [doc.label, doc.created_at && shortDate(doc.created_at)].filter(Boolean).join(' · ')

  return (
    <li className="assistant-doc">
      <div className="assistant-doc-head">
        <span className="assistant-doc-icon">
          <Icon name={isImage ? 'image' : 'documents'} size={18} />
        </span>
        <div className="assistant-doc-title">
          <Link to={detail} title={doc.original_name}>
            {doc.original_name}
          </Link>
          {meta && <small>{meta}</small>}
        </div>
      </div>

      {terms.length > 0 && matched.length > 0 && (
        <p className="assistant-doc-match">
          <span className={matched.length === terms.length ? 'is-full' : undefined}>
            {matched.length}/{terms.length}
          </span>
          Matched {matched.join(', ')}
        </p>
      )}

      {doc.snippet && (
        <p className="assistant-doc-snippet">
          <Highlighted text={doc.snippet} words={matched} />
        </p>
      )}

      <div className="assistant-doc-actions">
        <Link to={detail} className="btn btn-primary">
          <Icon name="eye" size={14} />
          Open
        </Link>
        <a href={documentService.downloadUrl(doc.id)} className="btn btn-secondary">
          <Icon name="download" size={14} />
          Download
        </a>
      </div>
    </li>
  )
}

function Message({ message }) {
  if (message.role === 'user') {
    return (
      <li className="assistant-msg is-user">
        <p>{message.text}</p>
      </li>
    )
  }
  const terms = message.terms ?? []
  const documents = message.documents ?? []
  return (
    <li className="assistant-msg is-bot">
      {terms.length > 0 && (
        <p className="assistant-terms">
          <span>Searched for</span>
          {terms.map((t) => (
            <em key={t}>{t}</em>
          ))}
        </p>
      )}
      <p>{message.text}</p>
      {documents.length > 0 && (
        <ul className="assistant-docs">
          {documents.map((doc) => (
            <DocumentResult key={doc.id} doc={doc} terms={terms} />
          ))}
        </ul>
      )}
    </li>
  )
}

/**
 * "Ask the archive": a chat that reads every word of the question, searches the main office
 * archive (file names, AI document types, OCR text, uploader) and answers with the matching
 * documents, best match first. History is kept in the server session.
 */
export default function ArchiveAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const launcherRef = useRef(null)

  // Load the session's history the first time the panel opens.
  useEffect(() => {
    if (!open || loaded) return
    documentService
      .chatHistory()
      .then((data) => setMessages(data.messages ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoaded(true))
  }, [open, loaded])

  useEffect(() => {
    if (!open) return undefined
    inputRef.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        launcherRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // While searching, show the typing dots; once answered, bring the latest question to the top
  // so its answer and the best match are read first (not the last, weakest result).
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const questions = list.querySelectorAll('.assistant-msg.is-user')
    const latest = questions[questions.length - 1]
    list.scrollTop = busy || !latest ? list.scrollHeight : latest.offsetTop - 16
  }, [messages, busy, open])

  const ask = async (text) => {
    const value = text.trim()
    if (!value || busy) return
    setError('')
    setBusy(true)
    setQuestion('')
    setMessages((m) => [...m, { role: 'user', text: value }])
    try {
      const data = await documentService.ask(value)
      setMessages(data.messages ?? [])
    } catch (err) {
      setMessages((m) => m.slice(0, -1))
      setQuestion(value)
      setError(err.message)
    } finally {
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  const clear = async () => {
    setError('')
    try {
      await documentService.clearChat()
      setMessages([])
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className={open ? 'assistant-launcher is-hidden' : 'assistant-launcher'}
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="archive-assistant"
      >
        <Icon name="search" size={18} />
        Ask the archive
      </button>

      <section id="archive-assistant" className={open ? 'assistant is-open' : 'assistant'} role="dialog" aria-label="Archive assistant" hidden={!open}>
        <header className="assistant-head">
          <div>
            <p className="assistant-kicker">Document archive</p>
            <h2>Archive assistant</h2>
          </div>
          <div className="assistant-head-actions">
            <button type="button" className="icon-btn" onClick={clear} disabled={!messages.length || busy} aria-label="Clear conversation" title="Clear conversation">
              <Icon name="refresh" size={17} />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                setOpen(false)
                launcherRef.current?.focus()
              }}
              aria-label="Close assistant"
              title="Close"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        </header>

        <ol ref={listRef} className="assistant-body" aria-live="polite">
          {loaded && messages.length === 0 && (
            <li className="assistant-welcome">
              <p>
                Ask for a document in your own words. I read every word of your question and search file names, document types and the text inside each scan, then send you the
                closest matches.
              </p>
              <span>Try</span>
              <div className="assistant-examples">
                {EXAMPLES.map((ex) => (
                  <button key={ex} type="button" onClick={() => ask(ex)}>
                    {ex}
                  </button>
                ))}
              </div>
            </li>
          )}
          {messages.map((m, i) => (
            <Message key={i} message={m} />
          ))}
          {busy && (
            <li className="assistant-msg is-bot is-typing" role="status">
              <span />
              <span />
              <span />
              <span className="visually-hidden">Searching the archive…</span>
            </li>
          )}
        </ol>

        {error && (
          <p className="assistant-error" role="alert">
            {error}
          </p>
        )}

        <form
          className="assistant-form"
          onSubmit={(e) => {
            e.preventDefault()
            ask(question)
          }}
        >
          <label htmlFor="assistant-input" className="visually-hidden">
            What document are you looking for?
          </label>
          <input
            ref={inputRef}
            id="assistant-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="What document are you looking for?"
            autoComplete="off"
            maxLength={MAX_LENGTH}
          />
          <button type="submit" className="assistant-send" disabled={!question.trim() || busy} aria-label="Search">
            <Icon name="arrowRight" size={18} />
          </button>
          {question.length > MAX_LENGTH - 40 && (
            <small className="assistant-count">
              {question.length}/{MAX_LENGTH}
            </small>
          )}
        </form>
      </section>
    </>
  )
}
