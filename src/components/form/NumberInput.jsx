/** Quantity box with "00" placeholder. onChange receives a number (or '' while the box is empty). */
export default function NumberInput({ id, label = 'Quantity', value, onChange, min = 0, max, className = '' }) {
  return (
    <label className={`field ${className}`.trim()} htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        name={id}
        type="number"
        inputMode="numeric"
        className="number-input"
        placeholder="00"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      />
    </label>
  )
}
