/** Tab row, e.g. Documents | Word | Pdf | Excel. tabs: [{ value, label, icon? }] (icon: true shows a placeholder icon) */
export default function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button key={tab.value} type="button" role="tab" aria-selected={tab.value === value} className={tab.value === value ? 'active' : undefined} onClick={() => onChange(tab.value)}>
          {tab.icon && <span className="ph ph-icon" aria-hidden="true" />}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
