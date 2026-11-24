import StatusBadge from '../DataTable/StatusBadge.jsx'
import LedgerBadge from '../ledger/LedgerBadge.jsx'
import Icon from '../Icon/Icon.jsx'
import LetterDocument from './LetterDocument.jsx'
import LetterFilePreview from './LetterFilePreview.jsx'
import PhotoGallery from './PhotoGallery.jsx'
import RequestProgress from './RequestProgress.jsx'
import { requestService } from '../../services/requestService.js'
import { fullDateTime, shortDate } from '../../utils/format.js'
import { REQUEST_STATUS_LABEL } from '../../utils/requestStatus.js'

/**
 * Everything about one inventory request, shared by the learning center, the
 * approvals page and inventory processing. `actions` renders in the side column
 * above the facts; showStock adds stock and availability columns to the items.
 */
export default function RequestOverview({ data, actions, showStock = false, showReceived = false }) {
  const { request: r, items, files, delivery, activity } = data
  const letterFile = files.find((f) => f.kind === 'letter')
  const photos = files
    .filter((f) => f.kind === 'attachment')
    .map((f) => ({ key: f.id, src: requestService.fileUrl(f.id), name: f.original_name, downloadUrl: requestService.fileDownloadUrl(f.id) }))
  const received = showReceived || items.some((i) => i.quantity_received !== null)

  return (
    <div className="req-layout">
      <div className="req-main">
        <RequestProgress request={r} delivery={delivery} />

        {r.status === 'rejected' && r.admin_remarks && <Remark tone="danger" title="Reason for disapproval" text={r.admin_remarks} by={r.reviewed_by_name} at={r.reviewed_at} />}
        {r.status !== 'rejected' && r.admin_remarks && <Remark title="Approval remarks" text={r.admin_remarks} by={r.reviewed_by_name} at={r.reviewed_at} />}
        {r.receipt_notes && <Remark tone={r.status === 'discrepancy' ? 'danger' : undefined} title={r.status === 'discrepancy' || r.resolution_notes ? 'Discrepancy reported' : 'Receipt notes'} text={r.receipt_notes} by={r.received_by_name} at={r.received_at} />}
        {r.resolution_notes && <Remark title="Discrepancy resolution" text={r.resolution_notes} by={r.resolved_by_name} at={r.resolved_at} />}

        <section className="req-section">
          <h3>Requested items</h3>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="cell-end">Requested</th>
                  {r.status !== 'pending' && r.status !== 'draft' && r.status !== 'rejected' && <th className="cell-end">Approved</th>}
                  {received && <th className="cell-end">Received</th>}
                  {showStock && <th className="cell-end">In stock</th>}
                  {showStock && <th className="cell-end">Available</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((i) => {
                  const need = i.quantity_approved ?? i.quantity_requested
                  const short = i.quantity_received !== null && i.quantity_received !== undefined && Number(i.quantity_received) !== Number(need)
                  return (
                    <tr key={i.id}>
                      <td className="cell-wrap">
                        <span className="cell-stack">
                          <strong>{i.product_name}</strong>
                          {i.justification && <small>{i.justification}</small>}
                        </span>
                      </td>
                      <td className="cell-end num">
                        {i.quantity_requested} {i.unit}
                      </td>
                      {r.status !== 'pending' && r.status !== 'draft' && r.status !== 'rejected' && <td className="cell-end num">{i.quantity_approved ?? '—'}</td>}
                      {received && <td className={short ? 'cell-end num text-danger' : 'cell-end num'}>{i.quantity_received ?? '—'}</td>}
                      {showStock && <td className="cell-end num">{i.stock}</td>}
                      {showStock && (
                        <td className="cell-end">
                          <span className={i.enough ? 'num' : 'num low-stock'} title={i.committed ? `${i.committed} held for other prepared deliveries` : undefined}>
                            {i.available}
                          </span>
                          {!i.enough && (
                            <small className="stock-short">
                              Short by {need - i.available}
                              {i.committed ? ` · ${i.committed} held` : ''}
                            </small>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="req-section">
          <h3>Request letter</h3>
          {r.letter_mode === 'uploaded' ? (
            letterFile ? (
              <LetterFilePreview file={letterFile} url={requestService.fileUrl(letterFile.id)} downloadUrl={requestService.fileDownloadUrl(letterFile.id)} />
            ) : (
              <p className="muted">No letter was uploaded yet.</p>
            )
          ) : (
            <LetterDocument letter={r} centerName={r.center_name} centerAddress={r.center_address} />
          )}
        </section>

        <section className="req-section">
          <h3>Supporting photos</h3>
          <PhotoGallery photos={photos} />
        </section>

        <section className="req-section">
          <h3>History</h3>
          {activity.length ? (
            <ol className="timeline flat">
              {activity.map((a) => (
                <li key={a.id}>
                  <span className={`timeline-dot action-${a.action}`} aria-hidden="true" />
                  <div>
                    <p>{a.description}</p>
                    <small>
                      {fullDateTime(a.created_at)} · {a.user_name || 'System'}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">Nothing recorded yet.</p>
          )}
        </section>
      </div>

      <aside className="req-side">
        {actions}
        <section className="side-box">
          <div className="side-box-head">
            <h3>Request</h3>
            <LedgerBadge ledger={data.ledger} entity={{ type: 'inventory_request', id: r.id }} />
          </div>
          <dl className="side-facts">
            <div>
              <dt>Reference</dt>
              <dd className="num">{r.status === 'draft' ? 'Assigned on submission' : r.request_code}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={r.status} label={REQUEST_STATUS_LABEL[r.status]} />
              </dd>
            </div>
            <div>
              <dt>Learning center</dt>
              <dd>{r.center_name}</dd>
            </div>
            <div>
              <dt>Requested by</dt>
              <dd>{r.requested_by_name || '—'}</dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{r.submitted_at ? fullDateTime(r.submitted_at) : 'Not yet'}</dd>
            </div>
            {r.reviewed_at && (
              <div>
                <dt>{r.status === 'rejected' ? 'Disapproved' : 'Approved'}</dt>
                <dd>
                  {fullDateTime(r.reviewed_at)}
                  <small>{r.reviewed_by_name}</small>
                </dd>
              </div>
            )}
            {r.processing_by_name && (
              <div>
                <dt>Prepared by</dt>
                <dd>{r.processing_by_name}</dd>
              </div>
            )}
          </dl>
        </section>
        {delivery && (
          <section className="side-box">
            <h3>Delivery</h3>
            <dl className="side-facts">
              <div>
                <dt>Delivery reference</dt>
                <dd className="num">{delivery.delivery_code}</dd>
              </div>
              <div>
                <dt>Delivery status</dt>
                <dd>
                  <StatusBadge status={delivery.status} label={delivery.status === 'ready' ? 'Awaiting release' : undefined} />
                </dd>
              </div>
              <div>
                <dt>QR code</dt>
                <dd>
                  <StatusBadge status={delivery.qr_status === 'active' ? 'active' : delivery.qr_status} label={delivery.qr_status === 'used' ? 'Used' : delivery.qr_status === 'active' ? 'Active' : 'Cancelled'} />
                </dd>
              </div>
              <div>
                <dt>Prepared</dt>
                <dd>
                  {shortDate(delivery.prepared_at)}
                  <small>{delivery.prepared_by_name}</small>
                </dd>
              </div>
              {delivery.released_at && (
                <div>
                  <dt>Released for delivery</dt>
                  <dd>
                    {fullDateTime(delivery.released_at)}
                    <small>{delivery.released_by_name}</small>
                  </dd>
                </div>
              )}
              {delivery.delivered_at && (
                <div>
                  <dt>Delivered</dt>
                  <dd>
                    {fullDateTime(delivery.delivered_at)}
                    <small>{delivery.delivered_by_name}</small>
                  </dd>
                </div>
              )}
              <div>
                <dt>{delivery.released_at ? 'Released quantities' : 'Prepared quantities'}</dt>
                <dd>{delivery.items_summary}</dd>
              </div>
            </dl>
          </section>
        )}
      </aside>
    </div>
  )
}

function Remark({ title, text, by, at, tone }) {
  return (
    <div className={tone === 'danger' ? 'req-remark is-danger' : 'req-remark'}>
      <Icon name={tone === 'danger' ? 'alert' : 'check'} size={16} />
      <div>
        <strong>{title}</strong>
        <p className="pre-line">{text}</p>
        {(by || at) && (
          <small>
            {by}
            {by && at ? ' · ' : ''}
            {at ? fullDateTime(at) : ''}
          </small>
        )}
      </div>
    </div>
  )
}
