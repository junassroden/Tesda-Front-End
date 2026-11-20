import Icon from '../Icon/Icon.jsx'

/**
 * Label, big number, caption, and an optional mini bar chart.
 * bars: [{ label, value }] drawn as small vertical bars (hover shows the label).
 * split: [{ label, value, tone }] drawn as one segmented bar with a legend.
 */
export default function KpiCard({ label, value, hint, icon, loading = false, bars, split }) {
  const max = bars?.length ? Math.max(...bars.map((b) => Number(b.value) || 0), 1) : 1
  const total = split?.reduce((sum, s) => sum + s.value, 0) || 1

  return (
    <article className="kpi-card">
      <div className="kpi-top">
        <span className="kpi-label">
          {icon && <Icon name={icon} size={15} />}
          {label}
        </span>
      </div>

      <div className="kpi-body">
        {loading ? <span className="skeleton" style={{ width: 64, height: 30 }} /> : <strong>{value ?? '—'}</strong>}

        {bars?.length > 0 && (
          <div className="kpi-bars" aria-hidden="true">
            {bars.map((b) => (
              <span key={b.label} title={`${b.label}: ${b.value}`} style={{ height: `${Math.max(8, (Number(b.value) / max) * 100)}%` }} />
            ))}
          </div>
        )}
      </div>

      {split && (
        <>
          <div className="kpi-split" aria-hidden="true">
            {split.map((s) => (
              <span key={s.label} className={`tone-${s.tone}`} style={{ width: `${(s.value / total) * 100}%` }} />
            ))}
          </div>
          <div className="kpi-legend">
            {split.map((s) => (
              <span key={s.label}>
                <i className={`tone-${s.tone}`} />
                {s.value} {s.label}
              </span>
            ))}
          </div>
        </>
      )}

      {hint && <small>{hint}</small>}
    </article>
  )
}
