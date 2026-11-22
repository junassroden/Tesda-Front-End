import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import EmptyState, { ErrorState } from '../../../components/EmptyState/EmptyState.jsx'
import NumberInput from '../../../components/form/NumberInput.jsx'
import TextArea from '../../../components/form/TextArea.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES } from '../../../constants/routes.js'
import { toList } from '../../../services/api.js'
import { inventoryService } from '../../../services/inventoryService.js'

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

// Figma: Request Inventory 02
export default function RequestItemPage() {
  const { itemId } = useParams()
  const [item, setItem] = useState(null) // object | false (not found) | undefined (failed)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [personnel, setPersonnel] = useState([])
  const [quantity, setQuantity] = useState('')
  const [deliveryId, setDeliveryId] = useState('')
  const [purpose, setPurpose] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // { ok, text }

  // GET /products/:id is admin-only in the backend, so find the item in the list instead.
  useEffect(() => {
    inventoryService
      .list()
      .then((data) => setItem(toList(data).find((p) => String(p.id) === itemId) ?? false))
      .catch((err) => {
        setLoadError(err?.message || 'Something went wrong.')
        setItem(undefined)
      })
    inventoryService
      .deliveryPersonnel()
      .then((data) => setPersonnel((data.personnel ?? []).filter((p) => Number(p.is_active))))
      .catch(() => setPersonnel([]))
  }, [itemId, attempt])

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setResult(null)
    try {
      const res = await inventoryService.createRequest({
        items: [{ product_id: Number(itemId), quantity: Number(quantity) || 0 }],
        delivery_personnel_id: deliveryId ? Number(deliveryId) : null,
        purpose: purpose.trim(),
      })
      setResult({ ok: true, text: res.message })
      setQuantity('')
      setPurpose('')
    } catch (err) {
      setResult({ ok: false, text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Request supplies" subtitle="Tell the main office how many you need and why." />
      <Workspace back={ROUTES.CENTER.AVAILABLE_INVENTORY} backLabel="Available items" flush>
        {item === undefined ? (
          <ErrorState
            what="this item"
            message={loadError}
            onRetry={() => {
              setLoadError('')
              setItem(null)
              setAttempt((n) => n + 1)
            }}
          />
        ) : item === false ? (
          <EmptyState icon="inventory" title="Item not found" text="It may have been removed from the main office stock." />
        ) : (
          <>
            <div className="detail-head">
              <div>
                <h2>{item ? item.product_name : 'Loading…'}</h2>
                <p>{item?.description || (item ? 'No description yet.' : '')}</p>
              </div>
              <div className="detail-qty">
                <span>Available</span>
                <strong>{item ? Number(item.quantity ?? 0) : '—'}</strong>
              </div>
            </div>

            <div className="detail-layout">
              <div className="detail-media is-empty" aria-hidden="true">
                <span className="item-initials">{initials(item?.product_name)}</span>
              </div>

              <form className="side-panel" onSubmit={submit}>
                <h3>Your request</h3>
                <NumberInput id="quantity" label="Quantity needed" value={quantity} onChange={setQuantity} min={1} max={item ? Number(item.quantity) || undefined : undefined} />
                <label className="field" htmlFor="personnel">
                  <span>Delivery personnel</span>
                  <select id="personnel" value={deliveryId} onChange={(e) => setDeliveryId(e.target.value)}>
                    <option value="">{personnel.length ? 'Choose who will pick it up' : 'No delivery personnel yet'}</option>
                    {personnel.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                        {p.vehicle ? ` · ${p.vehicle}` : ''}
                      </option>
                    ))}
                  </select>
                  {!personnel.length && (
                    <small>
                      Add people under <Link to={ROUTES.CENTER.DELIVERY_PERSONNEL}>Delivery personnel</Link>.
                    </small>
                  )}
                </label>
                <TextArea id="purpose" label="Purpose" rows={3} placeholder="e.g. For the new SMAW batch starting in December" value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
                <Button type="submit" disabled={busy || !item}>
                  <Icon name="request" size={17} />
                  {busy ? 'Sending…' : 'Send request'}
                </Button>
                {result && (
                  <p className={result.ok ? 'notice' : 'notice is-error'} role="status">
                    {result.text}
                    {result.ok && (
                      <>
                        {' '}
                        <Link to={ROUTES.CENTER.DASHBOARD}>Track it on your dashboard</Link>
                      </>
                    )}
                  </p>
                )}
              </form>
            </div>
          </>
        )}
      </Workspace>
    </>
  )
}
