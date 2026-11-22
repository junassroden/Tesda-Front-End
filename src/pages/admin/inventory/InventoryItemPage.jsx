import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import EmptyState, { ErrorState } from '../../../components/EmptyState/EmptyState.jsx'
import Icon from '../../../components/Icon/Icon.jsx'
import Modal from '../../../components/Modal/Modal.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ROUTES } from '../../../constants/routes.js'
import { inventoryService } from '../../../services/inventoryService.js'
import { fullDateTime, listTime, peso } from '../../../utils/format.js'

const CATEGORY_LABELS = {
  supply: 'Supply',
  equipment: 'Equipment',
  tool: 'Tool',
  ppe: 'PPE',
  consumable: 'Consumable',
}
const MOVEMENT = {
  restock: { label: 'Restocked', icon: 'plus', tone: 'in' },
  return: { label: 'Returned', icon: 'arrowLeft', tone: 'in' },
  release: { label: 'Released', icon: 'truck', tone: 'out' },
  adjustment: { label: 'Adjusted', icon: 'edit', tone: 'neutral' },
}

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '—'

function stockState(qty, reorder) {
  if (qty <= 0) return { key: 'out', label: 'Out of stock' }
  if (qty <= reorder) return { key: 'low', label: 'Low stock' }
  return { key: 'ok', label: 'In stock' }
}

/**
 * Full details for one inventory item: stock level, open-request reservations, value and
 * stock history. The main office can edit or delete the item here.
 */
export default function InventoryItemPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const photoInput = useRef(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [details, setDetails] = useState(null) // { product, movements, reserved } | false (not found) | undefined (failed)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  // Set when the register form saved the item but its photo failed to upload.
  const [error, setError] = useState(() => (location.state?.photoError ? `The item was saved, but its photo was not: ${location.state.photoError}` : ''))
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    inventoryService
      .get(id)
      .then((data) => !cancelled && setDetails(data))
      .catch((err) => {
        if (cancelled) return
        if (err?.status === 404) return setDetails(false)
        setLoadError(err?.message || 'Something went wrong.')
        setDetails(undefined)
      })
    return () => {
      cancelled = true
    }
  }, [id, attempt])

  const p = details?.product ?? {}
  const qty = Number(p.quantity) || 0
  const reorder = Number(p.reorder_level) || 0
  const price = Number(p.price) || 0
  const state = stockState(qty, reorder)
  const reserved = details?.reserved
  const movements = details?.movements ?? []
  // Gauge fills against three times the reorder level, so "low" sits at the first third.
  const gaugeMax = Math.max(reorder * 3, qty, 1)

  const startEdit = () => {
    setForm({
      product_name: p.product_name ?? '',
      description: p.description ?? '',
      quantity: String(qty),
      price: String(price),
    })
    setError('')
    setEditing(true)
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const { product } = await inventoryService.update(id, form)
      setDetails((d) => ({ ...(d || {}), product }))
      setNotice('Changes saved.')
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setDeleting(true)
    try {
      await inventoryService.remove(id)
      setConfirmDelete(false)
      navigate(ROUTES.ADMIN.INVENTORY, { replace: true })
    } catch (err) {
      setConfirmDelete(false)
      setError(err.message)
      setDeleting(false)
    }
  }

  const changePhoto = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPhotoBusy(true)
    setError('')
    try {
      const { product } = await inventoryService.uploadImage(id, file)
      setDetails((d) => ({ ...d, product }))
      setNotice('Photo saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setPhotoBusy(false)
    }
  }

  const removePhoto = async () => {
    setPhotoBusy(true)
    setError('')
    try {
      const { product } = await inventoryService.removeImage(id)
      setDetails((d) => ({ ...d, product }))
      setNotice('Photo removed.')
    } catch (err) {
      setError(err.message)
    } finally {
      setPhotoBusy(false)
    }
  }

  const photo = inventoryService.imageUrl(p)

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
    disabled: saving,
  })

  const actions = details && !editing && (
    <>
      <Button variant="secondary" onClick={startEdit}>
        <Icon name="edit" size={16} />
        Edit
      </Button>
      <Button variant="secondary" className="inv-delete" onClick={() => setConfirmDelete(true)}>
        <Icon name="trash" size={16} />
        Delete
      </Button>
    </>
  )

  return (
    <>
      <PageHeader title="Inventory" subtitle="Supplies and equipment held by the main office." />
      <Workspace back={ROUTES.ADMIN.INVENTORY} backLabel="All items" actions={actions} flush>
        {details === null && (
          <div className="inv-hero is-loading" aria-hidden="true">
            <span className="skeleton" />
          </div>
        )}
        {details === undefined && loadError && (
          <ErrorState
            what="this item"
            message={loadError}
            onRetry={() => {
              setLoadError('')
              setDetails(null)
              setAttempt((n) => n + 1)
            }}
          />
        )}
        {details === false && <EmptyState icon="inventory" title="Item not found" text="It may have been deleted, or the link is incomplete." />}
        {details && (
          <>
            <header className={`inv-hero${photo ? ' has-photo' : ''}`}>
              {photo ? (
                <img className="inv-hero-img" src={photo} alt={`Photo of ${p.product_name}`} />
              ) : (
                <span className="inv-hero-mark" aria-hidden="true">
                  {initials(p.product_name)}
                </span>
              )}
              <div className="inv-hero-text">
                <span className="inv-hero-category">{CATEGORY_LABELS[p.category] ?? 'Item'}</span>
                <h2>{p.product_name}</h2>
                <p>
                  <span>Counted per {p.unit || 'piece'}</span>
                  <span className={`inv-state is-${state.key}`}>{state.label}</span>
                </p>
              </div>
              <div className="inv-hero-photo">
                <button type="button" className="inv-hero-btn" onClick={() => photoInput.current?.click()} disabled={photoBusy}>
                  <Icon name="image" size={15} />
                  {photoBusy ? 'Saving…' : photo ? 'Change photo' : 'Add photo'}
                </button>
                {photo && (
                  <button type="button" className="inv-hero-btn" onClick={removePhoto} disabled={photoBusy} aria-label="Remove photo" title="Remove photo">
                    <Icon name="trash" size={15} />
                  </button>
                )}
                <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={changePhoto} />
              </div>
            </header>

            {notice && !editing && (
              <p className="notice inset" role="status">
                {notice}
              </p>
            )}
            {error && (
              <p className="form-error inv-panel-error" role="alert">
                {error}
              </p>
            )}

            {editing ? (
              <form className="inv-edit" onSubmit={save}>
                <label className="field">
                  <span>Item name</span>
                  <input {...field('product_name')} maxLength={100} required />
                </label>
                <label className="field">
                  <span>Quantity on hand</span>
                  <input {...field('quantity')} type="number" min="0" step="1" inputMode="numeric" required />
                </label>
                <label className="field">
                  <span>Unit price (₱)</span>
                  <input {...field('price')} type="number" min="0" step="0.01" inputMode="decimal" />
                </label>
                <label className="field inv-edit-wide">
                  <span>Description</span>
                  <textarea {...field('description')} rows={2} maxLength={255} />
                </label>
                <div className="inv-edit-actions">
                  <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="inv-panel-body">
                <div className="inv-overview">
                  <div className="inv-stock">
                    <div className="inv-stock-figure">
                      <strong className="num">{qty.toLocaleString()}</strong>
                      <span>{p.unit || 'pc'} on hand</span>
                    </div>
                    <div className={`inv-gauge is-${state.key}`} role="meter" aria-valuenow={qty} aria-valuemin={0} aria-valuemax={gaugeMax} aria-label="Stock level">
                      <span
                        style={{
                          width: `${Math.min(100, (qty / gaugeMax) * 100)}%`,
                        }}
                      />
                      {reorder > 0 && <i style={{ left: `${(reorder / gaugeMax) * 100}%` }} title={`Reorder at ${reorder}`} />}
                    </div>
                    <small>{reorder > 0 ? `Reorder when it drops to ${reorder}.` : 'No reorder level set.'}</small>
                  </div>

                  <dl className="inv-facts">
                    <div>
                      <dt>Reserved</dt>
                      <dd className="num">
                        {reserved ? (
                          <>
                            {reserved.units} <small>{reserved.requests ? `in ${reserved.requests} open ${reserved.requests === 1 ? 'request' : 'requests'}` : 'no open requests'}</small>
                          </>
                        ) : (
                          <span className="skeleton skeleton-line short" />
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Available after requests</dt>
                      <dd className="num">{reserved ? Math.max(0, qty - reserved.units).toLocaleString() : <span className="skeleton skeleton-line short" />}</dd>
                    </div>
                    <div>
                      <dt>Unit price</dt>
                      <dd className="num">{peso(price)}</dd>
                    </div>
                    <div>
                      <dt>Stock value</dt>
                      <dd className="num">{peso(price * qty)}</dd>
                    </div>
                  </dl>

                  <div className="inv-desc">
                    <h4>Description</h4>
                    <p>{p.description || 'No description yet.'}</p>
                  </div>
                </div>

                <div className="inv-activity">
                  <h4>Recent activity</h4>
                  {!details ? (
                    <div className="skeleton-stack">
                      <span className="skeleton skeleton-line" />
                      <span className="skeleton skeleton-line" />
                      <span className="skeleton skeleton-line short" />
                    </div>
                  ) : movements.length ? (
                    <ol>
                      {movements.map((m) => {
                        const kind = MOVEMENT[m.movement_type] ?? MOVEMENT.adjustment
                        const change = Number(m.quantity_change)
                        return (
                          <li key={m.id}>
                            <span className={`inv-move-icon is-${kind.tone}`} aria-hidden="true">
                              <Icon name={kind.icon} size={14} />
                            </span>
                            <div>
                              <strong>
                                {kind.label}
                                {m.center_name ? ` to ${m.center_name}` : ''}
                              </strong>
                              <small>{[m.request_code, m.recorded_by_name].filter(Boolean).join(' · ') || m.remarks || '—'}</small>
                            </div>
                            <span className={`inv-move-qty num ${change > 0 ? 'is-in' : 'is-out'}`}>
                              {change > 0 ? '+' : '−'}
                              {Math.abs(change)}
                            </span>
                            <time dateTime={m.created_at} title={fullDateTime(m.created_at)}>
                              {listTime(m.created_at)}
                            </time>
                          </li>
                        )
                      })}
                    </ol>
                  ) : (
                    <p className="inv-empty">No stock movements yet. Releases and restocks will show up here.</p>
                  )}
                </div>
              </div>
            )}

            <Modal
              open={confirmDelete}
              title="Delete item?"
              onClose={() => !deleting && setConfirmDelete(false)}
              footer={
                <>
                  <Button variant="secondary" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={remove} disabled={deleting}>
                    {deleting ? 'Deleting…' : 'Delete'}
                  </Button>
                </>
              }
            >
              <p>
                <strong>{p.product_name}</strong> will be removed from the inventory. Items that are part of a supply request are kept for the record and cannot be deleted.
              </p>
            </Modal>
          </>
        )}
      </Workspace>
    </>
  )
}
