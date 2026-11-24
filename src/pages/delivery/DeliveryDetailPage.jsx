import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import { ErrorState } from '../../components/EmptyState/EmptyState.jsx'
import Icon from '../../components/Icon/Icon.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import ConfirmDialog from '../../components/training/ConfirmDialog.jsx'
import LedgerBadge from '../../components/ledger/LedgerBadge.jsx'
import { ROUTES } from '../../constants/routes.js'
import { deliveryService } from '../../services/requestService.js'
import { fullDateTime } from '../../utils/format.js'
import { DELIVERY_STATUS_LABEL, QR_STATUS_LABEL } from '../../utils/requestStatus.js'

/** Delivery Details: what is in it, where it goes, and its release and hand-over. */
export default function DeliveryDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState(null) // 'release' | 'delivered'

  const load = useCallback(
    () =>
      deliveryService
        .get(id)
        .then((d) => {
          setError('')
          setData(d)
        })
        .catch((err) => setError(err.message)),
    [id],
  )
  useEffect(() => {
    load()
  }, [load])

  if (error && !data) {
    return (
      <>
        <PageHeader title="Delivery" />
        <Workspace back={ROUTES.DELIVERY.DASHBOARD} backLabel="Delivery management">
          <ErrorState what="this delivery" message={error} onRetry={load} />
        </Workspace>
      </>
    )
  }
  const d = data?.delivery
  return (
    <>
      <PageHeader title={d ? d.delivery_code : 'Delivery'} subtitle={d ? `${d.request_code} to ${d.center_name}` : 'Loading…'} />
      {notice && (
        <p className="notice-bar" role="status">
          <Icon name="check" size={16} />
          {notice}
        </p>
      )}
      <Workspace back={d && d.status === 'delivered' ? ROUTES.DELIVERY.HISTORY : ROUTES.DELIVERY.DASHBOARD} backLabel={d && d.status === 'delivered' ? 'Delivery history' : 'Delivery management'} flush>
        {!d ? (
          <div className="workspace-pad muted">Loading…</div>
        ) : (
          <div className="req-layout">
            <div className="req-main">
              <section className="req-section">
                <h3>Items</h3>
                <table className="release-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="cell-end">Quantity</th>
                      {d.status === 'ready' && <th className="cell-end">In stock now</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {d.items.map((i) => (
                      <tr key={i.product_id}>
                        <td>{i.product_name}</td>
                        <td className="cell-end num">
                          {i.quantity} {i.unit}
                        </td>
                        {d.status === 'ready' && <td className={i.stock < i.quantity ? 'cell-end num low-stock' : 'cell-end num muted'}>{i.stock}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
              {data.problems?.length > 0 && (
                <div className="req-remark is-danger">
                  <Icon name="alert" size={16} />
                  <div>
                    <strong>Cannot be released</strong>
                    {data.problems.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <aside className="req-side">
              {d.status === 'ready' && (
                <section className="side-box action-box">
                  <h3>Release</h3>
                  <p className="field-hint">Scan the QR label on the items to release them. If the camera does not work, confirm with the reference number printed under the QR code.</p>
                  <Button to={ROUTES.DELIVERY.SCAN} className="btn-block">
                    <Icon name="camera" size={16} />
                    Scan QR code
                  </Button>
                  <Button variant="secondary" className="btn-block" onClick={() => setDialog('release')} disabled={data.problems?.length > 0}>
                    Release with reference number
                  </Button>
                </section>
              )}
              {d.status === 'in_transit' && (
                <section className="side-box action-box">
                  <h3>Hand-over</h3>
                  <p className="field-hint">When the items are with the learning center, mark the delivery as delivered. The center then confirms receipt.</p>
                  <Button className="btn-block" onClick={() => setDialog('delivered')}>
                    <Icon name="check" size={16} />
                    Mark as delivered
                  </Button>
                </section>
              )}
              <section className="side-box">
                <div className="side-box-head">
                  <h3>Delivery</h3>
                  <LedgerBadge ledger={data.ledger} />
                </div>
                <dl className="side-facts">
                  <div>
                    <dt>Status</dt>
                    <dd>
                      <StatusBadge status={d.status} label={DELIVERY_STATUS_LABEL[d.status]} />
                    </dd>
                  </div>
                  <div>
                    <dt>QR code</dt>
                    <dd>
                      <StatusBadge status={d.qr_status === 'active' ? 'active' : d.qr_status} label={QR_STATUS_LABEL[d.qr_status]} />
                    </dd>
                  </div>
                  <div>
                    <dt>Request</dt>
                    <dd className="num">{d.request_code}</dd>
                  </div>
                  <div>
                    <dt>Destination</dt>
                    <dd>
                      {d.center_name}
                      {d.center_address && <small>{d.center_address}</small>}
                    </dd>
                  </div>
                  <div>
                    <dt>Prepared</dt>
                    <dd>
                      {fullDateTime(d.prepared_at)}
                      <small>{d.prepared_by_name}</small>
                    </dd>
                  </div>
                  {d.released_at && (
                    <div>
                      <dt>Released</dt>
                      <dd>
                        {fullDateTime(d.released_at)}
                        <small>{d.released_by_name}</small>
                      </dd>
                    </div>
                  )}
                  {d.delivered_at && (
                    <div>
                      <dt>Delivered</dt>
                      <dd>
                        {fullDateTime(d.delivered_at)}
                        <small>{d.delivered_by_name}</small>
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            </aside>
          </div>
        )}
      </Workspace>

      {dialog === 'release' && d && (
        <ConfirmDialog
          open
          title={`Release ${d.delivery_code}?`}
          message={`Type the reference number printed under the QR code to confirm. These items leave the main office now and are deducted from stock: ${d.items_summary}.`}
          confirmLabel="Confirm release"
          reason={{ label: 'Reference number', required: true, placeholder: d.delivery_code }}
          onClose={() => setDialog(null)}
          onConfirm={async ({ reason }) => {
            const res = await deliveryService.release(d.id, reason.toUpperCase())
            setDialog(null)
            setNotice(res.message)
            load()
          }}
        />
      )}
      {dialog === 'delivered' && d && (
        <ConfirmDialog
          open
          title={`Mark ${d.delivery_code} as delivered?`}
          message={`Confirm that the items were handed over at ${d.center_name}. The learning center will be asked to confirm receipt.`}
          confirmLabel="Mark delivered"
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            const res = await deliveryService.delivered(d.id)
            setDialog(null)
            setNotice(res.message)
            load()
          }}
        />
      )}
    </>
  )
}
