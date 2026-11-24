import { Link } from 'react-router-dom'
import Icon from '../Icon/Icon.jsx'
import { ROUTES } from '../../constants/routes.js'
import { useAuth } from '../../hooks/useAuth.js'
import { fullDateTime } from '../../utils/format.js'
import { LEDGER_ACTION_LABEL } from '../../utils/ledger.js'

/**
 * "Verified on ledger" badge for a record.
 * ledger: { state: 'verified' | 'mismatch' | 'none', blocks: [{ action, created_at, status }] } from the API.
 * entity: { type, id } links main office administrators to the record's blocks.
 * showNone: also say so when the record has no blocks yet.
 */
export default function LedgerBadge({ ledger, entity, showNone = false }) {
  const { user } = useAuth()
  if (!ledger || (ledger.state === 'none' && !showNone)) return null
  const steps = (ledger.blocks ?? []).map((b) => `${LEDGER_ACTION_LABEL[b.action] ?? b.action} · ${fullDateTime(b.created_at)}`).join('\n')
  const mismatch = ledger.state === 'mismatch'
  const label = ledger.state === 'none' ? 'Not on ledger' : mismatch ? 'Ledger mismatch' : 'Verified on ledger'
  const title =
    ledger.state === 'none'
      ? 'Nothing about this record is on the blockchain ledger yet.'
      : mismatch
        ? `The records no longer match what the blockchain ledger recorded.\n${steps}`
        : `${ledger.blocks.length} ${ledger.blocks.length === 1 ? 'event matches' : 'events match'} the blockchain ledger:\n${steps}`
  const badge = (
    <span className={`ledger-badge is-${ledger.state}`} title={title}>
      <Icon name={mismatch ? 'alert' : 'shield'} size={13} />
      {label}
    </span>
  )
  if (user?.role === 'admin' && entity && ledger.state !== 'none') {
    return (
      <Link to={`${ROUTES.ADMIN.LEDGER}?entity_type=${entity.type}&entity_id=${entity.id}`} className="ledger-badge-link">
        {badge}
      </Link>
    )
  }
  return badge
}
