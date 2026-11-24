import { useEffect, useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import DataTable from '../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import { ErrorState } from '../../components/EmptyState/EmptyState.jsx'
import Icon from '../../components/Icon/Icon.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../components/Pagination/Pagination.jsx'
import StatStrip from '../../components/StatStrip/StatStrip.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import { ROUTES, toPath } from '../../constants/routes.js'
import { usePagination } from '../../hooks/usePagination.js'
import { deliveryService } from '../../services/requestService.js'
import { exportReport } from '../../utils/exportReport.js'
import { fullDateTime, shortDate } from '../../utils/format.js'
import { DELIVERY_STATUS_LABEL, QR_STATUS_LABEL } from '../../utils/requestStatus.js'


const COLUMNS = [
  {
    key: 'delivery_code',
    label: 'Delivery',
    render: (d) => (
      <span className="cell-stack">
        <strong className="num">{d.delivery_code}</strong>
        <small className="num">{d.request_code}</small>
      </span>
    ),
  },
  { key: 'center_name', label: 'Destination', className: 'cell-wrap', render: (d) => <span>{d.center_name}</span> },
  { key: 'items', label: 'Items and quantities', className: 'cell-wrap', render: (d) => <span className="muted">{d.items_summary}</span> },
  { key: 'qr', label: 'QR code', render: (d) => <StatusBadge status={d.qr_status === 'active' ? 'active' : d.qr_status} label={QR_STATUS_LABEL[d.qr_status]} /> },
  { key: 'status', label: 'Delivery', render: (d) => <StatusBadge status={d.status} label={DELIVERY_STATUS_LABEL[d.status]} /> },
  {
    key: 'date',
    label: 'Prepared',
    render: (d) => (
      <span className="cell-stack">
        <span className="num">{shortDate(d.prepared_at)}</span>
        {d.released_at && <small>Released {fullDateTime(d.released_at)}</small>}
      </span>
    ),
  },
]

/** Delivery Management dashboard (active deliveries), or Delivery history when history = true. */
export default function DeliveriesPage({ history = false }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    deliveryService
      .list(history ? ['delivered', 'cancelled'] : ['ready', 'in_transit'])
      .then(setData)
      .catch((err) => setError(err.message))
  }, [history])

  const list = (data?.deliveries ?? []).filter((d) => `${d.delivery_code} ${d.request_code} ${d.center_name} ${d.items_summary}`.toLowerCase().includes(search.toLowerCase()))
  const { rows, page, pageCount, setPage } = usePagination(list, 15)
  const counts = data?.counts ?? {}

  return (
    <>
      <PageHeader
        title={history ? 'Delivery history' : 'Delivery management'}
        subtitle={history ? 'Deliveries that reached their learning center.' : 'Prepared deliveries waiting for release, and deliveries on the road. Scan a delivery’s QR code to release it.'}
        search={search}
        onSearch={(v) => {
          setSearch(v)
          setPage(1)
        }}
        searchPlaceholder="Search delivery, request or center"
        onExport={(format) =>
          exportReport(format, {
            title: history ? 'Delivery history' : 'Deliveries',
            columns: [
              { key: 'delivery_code', label: 'Delivery' },
              { key: 'request_code', label: 'Request' },
              { key: 'center_name', label: 'Destination' },
              { key: 'items_summary', label: 'Items' },
              { key: 'status_label', label: 'Status' },
              { key: 'released', label: 'Released' },
              { key: 'released_by_name', label: 'Released by' },
            ],
            rows: list.map((d) => ({ ...d, status_label: DELIVERY_STATUS_LABEL[d.status], released: d.released_at ? fullDateTime(d.released_at) : '' })),
          })
        }
        actions={
          !history && (
            <Button to={ROUTES.DELIVERY.SCAN}>
              <Icon name="camera" size={16} />
              Scan QR code
            </Button>
          )
        }
      />
      {!history && (
        <StatStrip
          id="delivery-queue"
          loading={!data && !error}
          error={error && !data ? error : ''}
          cells={[
            { label: 'Awaiting release', value: counts.ready ?? 0, detail: 'QR code active; stock not yet deducted', attention: true },
            { label: 'In transit', value: counts.in_transit ?? 0, detail: 'Mark delivered on hand-over', attention: true },
            { label: 'Delivered', value: counts.delivered ?? 0, detail: 'In delivery history', to: ROUTES.DELIVERY.HISTORY },
          ]}
        />
      )}
      <Workspace title={history ? 'Completed deliveries' : 'Active deliveries'} flush>
        {error && !data ? (
          <ErrorState what="deliveries" message={error} />
        ) : (
          <>
            <DataTable
              columns={COLUMNS}
              rows={rows}
              loading={!data}
              empty={search ? { icon: 'search', title: 'No matches', text: `No delivery matches “${search}”.` } : { icon: 'truck', title: history ? 'No deliveries yet' : 'No active deliveries', text: history ? 'Delivered items are listed here.' : 'Deliveries appear here when inventory personnel generate their QR codes.' }}
              rowHref={(d) => toPath(ROUTES.DELIVERY.DETAIL, { id: d.id })}
              showArrow
            />
            <Pagination page={page} pageCount={pageCount} onChange={setPage} />
          </>
        )}
      </Workspace>
    </>
  )
}
