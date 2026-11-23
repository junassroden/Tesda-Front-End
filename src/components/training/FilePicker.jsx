import { useRef } from 'react'
import Icon from '../Icon/Icon.jsx'
import { fileSize } from '../../utils/training.js'

/**
 * A file chooser that lists what was picked. files: File[]; onChange(File[]).
 * accept: input accept string. max: how many files (multiple when > 1).
 */
export default function FilePicker({ id, label, files, onChange, accept, max = 10, hint, disabled = false }) {
  const input = useRef(null)
  const pick = (event) => {
    const chosen = Array.from(event.target.files ?? [])
    onChange([...files, ...chosen].slice(0, max))
    event.target.value = ''
  }
  const full = files.length >= max

  return (
    <div className="field file-picker">
      {label && <label htmlFor={id}>{label}</label>}
      <input ref={input} id={id} type="file" accept={accept} multiple={max > 1} onChange={pick} disabled={disabled || full} className="visually-hidden" />
      <button type="button" className="file-drop" onClick={() => input.current?.click()} disabled={disabled || full}>
        <Icon name="upload" size={18} />
        <span>{full ? `${max} ${max === 1 ? 'file' : 'files'} chosen` : max > 1 ? 'Choose files' : 'Choose a file'}</span>
      </button>
      {hint && <small>{hint}</small>}
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`}>
              <Icon name="documents" size={15} />
              <span className="truncate">{file.name}</span>
              <small className="num">{fileSize(file.size)}</small>
              <button type="button" className="icon-btn" aria-label={`Remove ${file.name}`} onClick={() => onChange(files.filter((_, j) => j !== i))}>
                <Icon name="x" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
