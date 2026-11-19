/** Labeled multi-line input. Extra props go to the <textarea>. */
export default function TextArea({ id, label, rows = 2, className = '', ...props }) {
  return (
    <label className={`field ${className}`.trim()} htmlFor={id}>
      <span>{label}</span>
      <textarea id={id} name={id} rows={rows} {...props} />
    </label>
  )
}
