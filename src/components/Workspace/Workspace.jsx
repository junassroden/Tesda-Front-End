import { Link } from 'react-router-dom'

/**
 * The big gray rounded panel under the page header, as in every Figma screen.
 * title/description: heading inside the panel. back: path for the ← link.
 * actions: buttons on the right. sample: shows a "Sample data" tag.
 * flush: lets tables run edge to edge.
 */
export default function Workspace({ title, description, back, actions, sample = false, flush = false, children }) {
  const hasHead = title || back || actions || sample
  return (
    <section className="workspace">
      {hasHead && (
        <div className="workspace-head">
          <div className="workspace-title">
            {back && (
              <Link to={back} className="back-link" aria-label="Back">
                ←
              </Link>
            )}
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {(actions || sample) && (
            <div className="workspace-actions">
              {sample && <span className="sample-tag">Sample data</span>}
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={flush ? 'workspace-body flush' : 'workspace-body'}>{children}</div>
    </section>
  )
}
