import { useEffect, useMemo } from 'react'
import Icon from '../Icon/Icon.jsx'

/** Dashed drop area with a preview once a file is picked. onChange receives the File (or null). */
export default function ImageUpload({ id, file, onChange }) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  // Free the old preview URL when the file changes or the component unmounts.
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  return (
    <label className="image-upload" htmlFor={id}>
      {preview ? (
        <img src={preview} alt="Selected item" />
      ) : (
        <span className="image-upload-prompt">
          <span className="empty-icon">
            <Icon name="image" size={22} />
          </span>
          <strong>
            Add a photo of the item, or <b>browse</b>
          </strong>
          <small>PNG or JPG, up to 5 MB</small>
        </span>
      )}
      <input id={id} name={id} type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0] ?? null)} hidden />
    </label>
  )
}
