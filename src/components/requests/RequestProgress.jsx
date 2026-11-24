import Icon from '../Icon/Icon.jsx'
import { REQUEST_STATUS_LABEL, REQUEST_STEPS } from '../../utils/requestStatus.js'
import { shortDate } from '../../utils/format.js'

/** Where a request is on its way from submission to completion. */
export default function RequestProgress({ request, delivery }) {
  const status = request.status
  if (status === 'draft') return null
  if (status === 'rejected' || status === 'cancelled') {
    return (
      <div className="req-ended" role="status">
        <Icon name="x" size={16} />
        <span>
          <strong>{REQUEST_STATUS_LABEL[status]}</strong>
          {request.reviewed_at ? ` on ${shortDate(request.reviewed_at)}` : ''}
          {request.reviewed_by_name ? ` by ${request.reviewed_by_name}` : ''}. The request and its documents are kept on record.
        </span>
      </div>
    )
  }
  // A discrepancy sits between delivery and completion.
  const current = status === 'discrepancy' ? REQUEST_STEPS.indexOf('delivered') : REQUEST_STEPS.indexOf(status)
  const dates = {
    pending: request.submitted_at,
    approved: request.reviewed_at,
    processing: request.processing_at,
    ready_for_delivery: delivery?.prepared_at,
    in_transit: request.released_at,
    delivered: delivery?.delivered_at,
    completed: request.resolved_at || request.received_at,
  }
  return (
    <ol className="req-steps" aria-label="Request progress">
      {REQUEST_STEPS.map((step, i) => {
        const state = i < current || (i === current && status === 'completed') ? 'done' : i === current ? 'current' : 'todo'
        return (
          <li key={step} className={`req-step is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="req-dot" aria-hidden="true">
              {state === 'done' ? <Icon name="check" size={12} /> : null}
            </span>
            <span className="req-step-label">{step === 'pending' ? 'Submitted' : REQUEST_STATUS_LABEL[step]}</span>
            <small className="num">{state !== 'todo' && dates[step] ? shortDate(dates[step]) : ''}</small>
          </li>
        )
      })}
      {status === 'discrepancy' && (
        <li className="req-step is-alert">
          <span className="req-dot" aria-hidden="true">
            !
          </span>
          <span className="req-step-label">Discrepancy reported</span>
          <small className="num">{shortDate(request.received_at)}</small>
        </li>
      )}
    </ol>
  )
}
