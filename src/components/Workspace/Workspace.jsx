import { Link } from 'react-router-dom'
import Icon from '../Icon/Icon.jsx'

/**
 * The main content panel under the page header.
 * title/description: heading inside the panel. back: path for the "Back" link (backLabel to name it).
 * actions: buttons on the right. sample: shows a "Sample data" tag. flush: lets tables run edge to edge.
 */
export default function Workspace({ title, description, back, backLabel = 'Back', actions, sample = false, flush = false, children }) {
  const hasHead = title || back || actions || sample || description
  return (
    <section className="workspace">
      {hasHead && (
        <div className="workspace-head">
          <div className="workspace-title">
            {back && (
              <Link to={back} className="back-link">
                <Icon name="arrowLeft" size={16} />
                {backLabel}
              </Link>
            )}
            {title && <h2>{title}</h2>}
            {description && <div className="workspace-desc">{description}</div>}
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
