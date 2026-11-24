import { useState } from 'react'
import Icon from '../Icon/Icon.jsx'
import Modal from '../Modal/Modal.jsx'

/**
 * Thumbnails of supporting photos with a full-size view.
 * photos: [{ key, src, name, downloadUrl? }]. onRemove(photo) shows a remove button.
 */
export default function PhotoGallery({ photos, onRemove, empty = 'No supporting photos were attached.' }) {
  const [open, setOpen] = useState(null)
  if (!photos.length) return <p className="muted">{empty}</p>
  return (
    <>
      <ul className="photo-grid">
        {photos.map((p) => (
          <li key={p.key}>
            <button type="button" className="photo-thumb" onClick={() => setOpen(p)} aria-label={`View ${p.name}`}>
              <img src={p.src} alt="" loading="lazy" />
            </button>
            <span className="photo-name truncate" title={p.name}>
              {p.name}
            </span>
            {onRemove && (
              <button type="button" className="icon-btn photo-remove" onClick={() => onRemove(p)} aria-label={`Remove ${p.name}`}>
                <Icon name="x" size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>
      <Modal
        open={Boolean(open)}
        title={open?.name ?? 'Photo'}
        onClose={() => setOpen(null)}
        footer={
          open?.downloadUrl && (
            <a className="btn btn-secondary" href={open.downloadUrl}>
              <Icon name="download" size={15} />
              Download
            </a>
          )
        }
      >
        {open && <img className="photo-full" src={open.src} alt={open.name} />}
      </Modal>
    </>
  )
}
