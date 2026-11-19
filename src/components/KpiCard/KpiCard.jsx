/** Label, big number, caption: "Company documents / 128 / Current company records". */
export default function KpiCard({ label, value, hint }) {
  return (
    <article className="kpi-card">
      <span>{label}</span>
      <strong>{value ?? '—'}</strong>
      {hint && <small>{hint}</small>}
    </article>
  )
}
