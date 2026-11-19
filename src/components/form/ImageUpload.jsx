import { useEffect, useMemo } from 'react'

/** Wide box with an "Insert Image" button in the middle; shows a preview once a file is picked. onChange receives the File (or null). */
export default function ImageUpload({ id, label = 'Insert Image', file, onChange }) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  // Free the old preview URL when the file changes or the component unmounts.
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  return (
    <label className="image-upload" htmlFor={id}>
      {preview ? <img src={preview} alt="Selected" /> : <span className="image-upload-btn">{label}</span>}
      <input id={id} name={id} type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0] ?? null)} hidden />
    </label>
  )
}
