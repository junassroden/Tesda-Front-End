/**
 * A thin labelled progress bar. value: 0-100 (null shows "Not tracked").
 * tone: 'brand' | 'success' | 'warning'.
 */
export default function Meter({ value, label, detail, tone = 'brand' }) {
  const known = value !== null && value !== undefined
  const pct = known ? Math.max(0, Math.min(100, Number(value))) : 0
  return (
    <div className="meter">
      {(label || detail) && (
        <div className="meter-label">
          {label && <span>{label}</span>}
          <strong className="num">{known ? `${pct}%` : 'Not tracked'}</strong>
        </div>
      )}
      <div className={`meter-track tone-${tone}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={known ? pct : undefined} aria-label={label}>
        <span style={{ width: `${pct}%` }} />
      </div>
      {detail && <small className="meter-detail">{detail}</small>}
    </div>
  )
}
