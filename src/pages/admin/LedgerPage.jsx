import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import DataTable from '../../components/DataTable/DataTable.jsx'
import StatusBadge from '../../components/DataTable/StatusBadge.jsx'
import { ErrorState } from '../../components/EmptyState/EmptyState.jsx'
import Icon from '../../components/Icon/Icon.jsx'
import Modal from '../../components/Modal/Modal.jsx'
import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import Pagination from '../../components/Pagination/Pagination.jsx'
import StatStrip from '../../components/StatStrip/StatStrip.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import AnchorsPanel from '../../components/ledger/AnchorsPanel.jsx'
import { ROUTES, toPath } from '../../constants/routes.js'
import { ledgerService } from '../../services/ledgerService.js'
import { fullDateTime, timeAgo } from '../../utils/format.js'
import { BLOCK_STATUS, LEDGER_ACTION_LABEL, LEDGER_TYPE_LABEL, shortHash } from '../../utils/ledger.js'

/** Where a block's record lives in the main office portal (when it has a page there). */
function recordLink(b) {
  if (b.entity_type === 'inventory_request') return toPath(ROUTES.ADMIN.INVENTORY_REQUEST_DETAIL, { id: b.entity_id })
  if (b.entity_type === 'inventory_delivery' && b.entity_ref) return toPath(ROUTES.ADMIN.INVENTORY_REQUEST_DETAIL, { id: b.entity_ref })
  if (b.entity_type === 'allowance_request') return toPath(ROUTES.ADMIN.ALLOWANCE_CHECKLIST, { id: b.entity_id })
  if (b.entity_type === 'batch') return toPath(ROUTES.ADMIN.TRAINING_BATCH, { batchId: b.entity_id })
  if (b.entity_type === 'document') return toPath(ROUTES.ADMIN.DOCUMENT_DETAIL, { id: b.entity_id })
  return null
}

/** Blockchain ledger: every block, whole-chain verification, and per-block verification against the records. */
export default function LedgerPage() {
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [chain, setChain] = useState(null) // result of "Verify whole chain"
  const [checking, setChecking] = useState(false)
  const [openId, setOpenId] = useState(null)
  const page = Number(params.get('page')) || 1
  const type = params.get('entity_type') || ''
  const entityId = params.get('entity_id') || ''
  const [q, setQ] = useState(params.get('q') || '')

  const load = useCallback(
    () =>
      ledgerService
        .list({ page, entity_type: type, entity_id: entityId, q: params.get('q') || '' })
        .then((d) => {
          setError('')
          setData(d)
        })
        .catch((err) => setError(err.message)),
    [page, type, entityId, params],
  )
  useEffect(() => {
    load()
  }, [load])

  const setFilter = (next) => setParams(Object.fromEntries(Object.entries({ entity_type: type, entity_id: entityId, q: params.get('q') || '', ...next, page: next.page ?? '' }).filter(([, v]) => v)))

  const verifyChain = async () => {
    setChecking(true)
    try {
      setChain(await ledgerService.verifyChain())
    } catch (err) {
      setChain({ error: err.message })
    } finally {
      setChecking(false)
    }
  }

  const stats = data?.stats
  const columns = [
    {
      key: 'block_index',
      label: 'Block',
      className: 'cell-block',
      render: (b) => {
        const upto = data?.anchored ?? {}
        const state = upto.confirmed !== null && upto.confirmed !== undefined && b.block_index <= upto.confirmed ? 'confirmed' : upto.submitted !== null && upto.submitted !== undefined && b.block_index <= upto.submitted ? 'pending' : null
        return (
          <span className="cell-stack">
            <strong className="num">#{b.block_index}</strong>
            {state && <small className={`anchor-mark is-${state}`}>{state === 'confirmed' ? 'In Bitcoin' : 'Anchoring'}</small>}
          </span>
        )
      },
    },
    {
      key: 'event',
      label: 'Event',
      className: 'cell-wrap',
      render: (b) => (
        <span className="cell-stack">
          <strong>
            {LEDGER_TYPE_LABEL[b.entity_type] ?? b.entity_type} · {LEDGER_ACTION_LABEL[b.action] ?? b.action}
          </strong>
          <small>{b.entity_label}</small>
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Recorded',
      render: (b) => (
        <span className="cell-stack">
          <span className="num" title={fullDateTime(b.created_at)}>
            {timeAgo(b.created_at)}
          </span>
          <small>{b.created_by_name || 'System'}</small>
        </span>
      ),
    },
    { key: 'data_hash', label: 'Data fingerprint', render: (b) => <code className="hash">{shortHash(b.data_hash)}</code> },
    { key: 'block_hash', label: 'Block hash', render: (b) => <code className="hash">{shortHash(b.block_hash)}</code> },
    {
      key: 'last',
      label: 'Last check',
      render: (b) =>
        b.last_verified_at ? (
          <span className="cell-stack">
            <StatusBadge status={Number(b.last_valid) ? 'verified' : 'rejected'} label={Number(b.last_valid) ? 'Passed' : 'Failed'} />
            <small>{timeAgo(b.last_verified_at)}</small>
          </span>
        ) : (
          <span className="muted">Not checked</span>
        ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Blockchain ledger"
        subtitle="A tamper-evident chain of the system's most important events. Each block holds only fingerprints (SHA-256) of the records and of the block before it, never personal data."
        actions={
          <Button onClick={verifyChain} disabled={checking}>
            <Icon name="shield" size={16} />
            {checking ? 'Verifying…' : 'Verify whole chain'}
          </Button>
        }
      />

      {chain &&
        (chain.error ? (
          <p className="form-error">{chain.error}</p>
        ) : chain.valid ? (
          <div className="chain-result is-valid" role="status">
            <Icon name="shield" size={20} />
            <div>
              <strong>The chain is intact</strong>
              <p>
                All {chain.blocks_checked} blocks are in order, each still points to the block before it, and every block hash matches its contents. Latest block hash{' '}
                <code className="hash">{shortHash(chain.last_hash)}</code>.
              </p>
            </div>
          </div>
        ) : (
          <div className="chain-result is-broken" role="alert">
            <Icon name="alert" size={20} />
            <div>
              <strong>
                The chain is broken at block #{chain.first_broken.block_index} ({LEDGER_TYPE_LABEL[chain.first_broken.entity_type]} · {chain.first_broken.entity_label})
              </strong>
              <p>
                {chain.reason} Blocks before it ({chain.blocks_checked}) are intact; this block and the {chain.total - chain.blocks_checked - 1} after it can no longer be trusted.
              </p>
              <button type="button" className="link-btn" onClick={() => setOpenId(chain.first_broken.id)}>
                Inspect block #{chain.first_broken.block_index}
              </button>
            </div>
          </div>
        ))}

      <StatStrip
        id="ledger-stats"
        loading={!data && !error}
        error={error && !data ? error : ''}
        cells={[
          { label: 'Blocks', value: stats?.blocks ?? 0, detail: stats?.last_block_at ? `Latest ${timeAgo(stats.last_block_at)}` : 'No blocks yet' },
          { label: 'Inventory and deliveries', value: (stats?.by_type?.inventory_request ?? 0) + (stats?.by_type?.inventory_delivery ?? 0), detail: 'Requests, QR codes, releases, receipts' },
          { label: 'Documents and training', value: (stats?.by_type?.student_document ?? 0) + (stats?.by_type?.document ?? 0) + (stats?.by_type?.batch ?? 0), detail: 'Verified, archived, completed' },
          { label: 'Verifications run', value: stats?.verifications ?? 0, detail: stats?.last_verified_at ? `Last ${timeAgo(stats.last_verified_at)}` : 'None yet' },
        ]}
      />

      <AnchorsPanel onChange={load} />

      <Workspace
        title="Blocks"
        description={entityId ? `Showing the blocks of one ${LEDGER_TYPE_LABEL[type]?.toLowerCase() ?? 'record'}.` : 'Newest first. Open a block to check it against today’s records.'}
        actions={
          <div className="filter-row">
            <select aria-label="Record type" value={type} onChange={(e) => setFilter({ entity_type: e.target.value, entity_id: '' })}>
              <option value="">All records</option>
              {Object.entries(LEDGER_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setFilter({ q: q.trim() })
              }}
            >
              <input className="hash-search" aria-label="Find a hash" placeholder="Find a hash (first characters)" value={q} onChange={(e) => setQ(e.target.value)} />
            </form>
            {(type || entityId || params.get('q')) && (
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setQ('')
                  setParams({})
                }}
              >
                Clear
              </button>
            )}
          </div>
        }
        flush
      >
        {error && !data ? (
          <ErrorState what="the ledger" message={error} onRetry={load} />
        ) : (
          <>
            <DataTable columns={columns} rows={data?.blocks ?? []} loading={!data} onRowClick={(b) => setOpenId(b.id)} showArrow empty={{ icon: 'shield', title: 'No blocks', text: 'No block matches these filters.' }} />
            <Pagination page={page} pageCount={Math.max(1, Math.ceil((data?.total ?? 0) / (data?.per_page ?? 25)))} onChange={(p) => setFilter({ page: p > 1 ? String(p) : '' })} />
          </>
        )}
      </Workspace>

      {openId && <BlockModal id={openId} onClose={() => setOpenId(null)} onVerified={load} />}
    </>
  )
}

/** One block: its hashes, links, verification against the records, and past checks. */
function BlockModal({ id, onClose, onVerified }) {
  const [data, setData] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(
    () =>
      ledgerService
        .block(id)
        .then(setData)
        .catch((err) => setError(err.message)),
    [id],
  )
  useEffect(() => {
    load()
  }, [load])

  const verify = async () => {
    setBusy(true)
    setError('')
    try {
      setResult(await ledgerService.verifyBlock(id))
      load()
      onVerified()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const b = data?.block
  const link = b && recordLink(b)
  return (
    <Modal
      open
      title={b ? `Block #${b.block_index}` : 'Block'}
      onClose={onClose}
      footer={
        <>
          {link && (
            <Link to={link} className="btn btn-secondary push-left" onClick={onClose}>
              Open record
            </Link>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={verify} disabled={busy || !b}>
            <Icon name="shield" size={16} />
            {busy ? 'Verifying…' : 'Verify this block'}
          </Button>
        </>
      }
    >
      {error && <p className="form-error">{error}</p>}
      {!b ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="block-detail">
          <dl className="side-facts">
            <div>
              <dt>Event</dt>
              <dd>
                {LEDGER_TYPE_LABEL[b.entity_type]} · {LEDGER_ACTION_LABEL[b.action] ?? b.action}
                <small>{b.entity_label}</small>
              </dd>
            </div>
            <div>
              <dt>Recorded</dt>
              <dd>
                {fullDateTime(b.created_at)}
                <small>Payload format {b.payload_format}</small>
              </dd>
            </div>
          </dl>
          <dl className="hash-list">
            <div>
              <dt>Data fingerprint (SHA-256 of the event’s data)</dt>
              <dd>
                <code>{b.data_hash}</code>
              </dd>
            </div>
            <div>
              <dt>Previous block hash</dt>
              <dd>
                <code>{b.previous_hash}</code>
              </dd>
            </div>
            <div>
              <dt>Block hash = SHA-256(index | type | id | action | data fingerprint | previous hash)</dt>
              <dd>
                <code>{b.block_hash}</code>
              </dd>
            </div>
          </dl>

          {result && (
            <section className={`verify-result is-${result.status}`} aria-live="polite">
              <h3>
                <StatusBadge status={BLOCK_STATUS[result.status]?.tone} label={BLOCK_STATUS[result.status]?.label ?? result.status} />
                <span>Checked just now and saved</span>
              </h3>
              <ul className="check-list">
                {result.checks.map((c) => (
                  <li key={c.label} className={c.ok === true ? 'is-ok' : c.ok === false ? 'is-bad' : 'is-na'}>
                    <Icon name={c.ok === true ? 'check' : c.ok === false ? 'x' : 'minus'} size={14} />
                    <span>
                      <strong>{c.label}</strong>
                      <small>{c.detail}</small>
                    </span>
                  </li>
                ))}
              </ul>
              {result.recomputed_hash && (
                <p className="field-hint">
                  Recomputed fingerprint <code className="hash">{result.recomputed_hash}</code>
                </p>
              )}
              {result.payload && (
                <details className="payload">
                  <summary>Data rebuilt from today’s records</summary>
                  <pre>{typeof result.payload === 'string' ? result.payload : JSON.stringify(result.payload, null, 2)}</pre>
                </details>
              )}
            </section>
          )}

          <section>
            <h3 className="subhead">Past checks</h3>
            {data.verifications.length ? (
              <ul className="check-history">
                {data.verifications.map((v) => (
                  <li key={v.id}>
                    <StatusBadge status={Number(v.is_valid) ? 'verified' : 'rejected'} label={Number(v.is_valid) ? 'Passed' : 'Failed'} />
                    <span>
                      {fullDateTime(v.verified_at)} · {v.verified_by_name || '—'}
                      {v.remarks && <small>{v.remarks}</small>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">This block has not been checked yet.</p>
            )}
          </section>
        </div>
      )}
    </Modal>
  )
}
