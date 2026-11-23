import seal from '../../assets/images/tesda-mark.png'

// Shared parts of the print-ready sheets (pages/print).

/** Print button and hint, hidden when printing. */
export function PrintToolbar({ title, waitFor = 0 }) {
  return (
    <div className="print-toolbar no-print">
      <strong>{title}</strong>
      <span className="muted">{waitFor ? 'PDF copies are drawn below; wait until they appear before printing.' : 'Use your browser’s print dialog to print or save as PDF.'}</span>
      <button type="button" className="btn btn-primary" onClick={() => window.print()}>
        Print
      </button>
    </div>
  )
}

export function PrintHeader({ center, address, title }) {
  return (
    <header className="print-head">
      <img src={seal} alt="" />
      <div>
        <p>Technical Education and Skills Development Authority</p>
        <strong>{center || 'TESDA Learning Center'}</strong>
        {address && <span>{address}</span>}
      </div>
      <h1>{title}</h1>
    </header>
  )
}
