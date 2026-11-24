import { useCallback, useEffect, useState } from 'react'
import Button from '../Button/Button.jsx'
import StatusBadge from '../DataTable/StatusBadge.jsx'
import Icon from '../Icon/Icon.jsx'
import Modal from '../Modal/Modal.jsx'
import Workspace from '../Workspace/Workspace.jsx'
import { anchorService } from '../../services/ledgerService.js'
import { fullDateTime, timeAgo } from '../../utils/format.js'
import { bitcoinBlockUrl, shortHash } from '../../utils/ledger.js'

/**
 * Public anchoring: the newest block's hash is timestamped in Bitcoin through
 * OpenTimestamps, which proves the whole chain up to it existed unchanged.
 * onChange() lets the page refresh its "anchored" markers.
 */
export default function AnchorsPanel({ onChange }) {
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState(null) // { ok, text }
  const [checking, setChecking] = useState(null) // anchor being verified

  const load = useCallback(
    () =>
      anchorService
        .list()
        .then(setData)
        .catch((err) => setMessage({ ok: false, text: err.message })),
    [],
  )
  useEffect(() => {
    load()
  }, [load])

  const run = async (kind, fn) => {
    setBusy(kind)
    setMessage(null)
    try {
      const d = await fn()
      setData(d)
      setMessage({ ok: true, text: d.message })
      onChange?.()
    } catch (err) {
      setMessage({ ok: false, text: err.message })
    } finally {
      setBusy('')
    }
  }

  const anchors = data?.anchors ?? []
  return (
    <Workspace
      title="Public anchors (Bitcoin)"
      description="The newest block's hash is timestamped in the Bitcoin blockchain through OpenTimestamps. Each block contains the hash of the block before it, so one anchor proves the whole chain up to that block existed unchanged at that time. Only that hash leaves the server."
      actions={
        <div className="button-row">
          <Button variant="secondary" onClick={() => run('check', anchorService.checkConfirmations)} disabled={Boolean(busy)}>
            <Icon name="refresh" size={16} />
            {busy === 'check' ? 'Checking…' : 'Check confirmations'}
          </Button>
          <Button onClick={() => run('anchor', anchorService.anchorNow)} disabled={Boolean(busy)}>
            <Icon name="share" size={16} />
            {busy === 'anchor' ? 'Sending…' : 'Anchor newest block'}
          </Button>
        </div>
      }
      flush
    >
      {message && (
        <p className={message.ok ? 'notice-bar inset-bar' : 'form-error inset'} role="status">
          {message.text}
        </p>
      )}
      {anchors.length === 0 ? (
        <p className="workspace-pad muted">{data ? 'Nothing is anchored yet. Anchor the newest block, or schedule php lava ledger:anchor to do it automatically.' : 'Loading…'}</p>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Covers blocks</th>
                <th>Anchored hash</th>
                <th>Sent</th>
                <th>Bitcoin</th>
                <th>Status</th>
                <th className="cell-end">
                  <span className="visually-hidden">Verify</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {anchors.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong className="num">#0 – #{a.block_index}</strong>
                  </td>
                  <td>
                    <code className="hash">{shortHash(a.block_hash)}</code>
                  </td>
                  <td>
                    <span className="cell-stack">
                      <span className="num" title={fullDateTime(a.submitted_at)}>
                        {timeAgo(a.submitted_at)}
                      </span>
                      <small>
                        {a.calendars} calendars · {a.submitted_by_name || 'Scheduled job'}
                      </small>
                    </span>
                  </td>
                  <td>
                    {a.bitcoin_height ? (
                      <span className="cell-stack">
                        <a href={bitcoinBlockUrl(a.bitcoin_block || a.bitcoin_height)} target="_blank" rel="noreferrer noopener" className="num">
                          Block {Number(a.bitcoin_height).toLocaleString()}
                        </a>
                        <small>Mined {a.bitcoin_time} UTC</small>
                      </span>
                    ) : (
                      <span className="cell-stack">
                        <span className="muted">Waiting</span>
                        {a.last_checked_at && <small>Checked {timeAgo(a.last_checked_at)}</small>}
                      </span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={a.status === 'confirmed' ? 'verified' : a.status === 'pending' ? 'pending' : 'rejected'} label={a.status === 'confirmed' ? 'Confirmed' : a.status === 'pending' ? 'Pending' : 'Failed'} />
                  </td>
                  <td className="cell-end">
                    <button type="button" className="link-btn" onClick={() => setChecking(a)}>
                      Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {checking && <AnchorCheck anchor={checking} onClose={() => setChecking(null)} />}
    </Workspace>
  )
}

function AnchorCheck({ anchor, onClose }) {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    anchorService
      .verify(anchor.id)
      .then(setResult)
      .catch((err) => setError(err.message))
  }, [anchor.id])
  return (
    <Modal open title={`Anchor of block #${anchor.block_index}`} onClose={onClose} footer={<Button onClick={onClose}>Close</Button>}>
      {error && <p className="form-error">{error}</p>}
      {!result && !error ? (
        <p className="muted">Checking the ledger, the proof and the Bitcoin block…</p>
      ) : (
        result && (
          <section className={`verify-result is-${result.valid === true ? 'verified' : result.valid === false ? 'tampered' : 'unverifiable'}`}>
            <h3>
              <StatusBadge status={result.valid === true ? 'verified' : result.valid === false ? 'rejected' : 'pending'} label={result.valid === true ? 'Proven in Bitcoin' : result.valid === false ? 'Does not match' : 'Waiting for Bitcoin'} />
              <span>Checked just now</span>
            </h3>
            <ul className="check-list">
              {result.checks.map((c, i) => (
                <li key={i} className={c.ok === true ? 'is-ok' : c.ok === false ? 'is-bad' : 'is-na'}>
                  <Icon name={c.ok === true ? 'check' : c.ok === false ? 'x' : 'clock'} size={14} />
                  <span>
                    <strong>{c.label}</strong>
                    <small>{c.detail}</small>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )
      )}
    </Modal>
  )
}
