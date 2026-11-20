/** Underlined tab row. tabs: [{ value, label, count? }] */
export default function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button key={tab.value} type="button" role="tab" aria-selected={tab.value === value} className={tab.value === value ? 'active' : undefined} onClick={() => onChange(tab.value)}>
          {tab.label}
          {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
        </button>
      ))}
    </div>
  )
}
