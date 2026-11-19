/** Labeled text input. Extra props go to the <input>. */
export default function TextInput({ id, label, type = 'text', className = '', ...props }) {
  return (
    <label className={`field ${className}`.trim()} htmlFor={id}>
      <span>{label}</span>
      <input id={id} name={id} type={type} {...props} />
    </label>
  )
}
