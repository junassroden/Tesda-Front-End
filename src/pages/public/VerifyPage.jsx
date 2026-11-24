import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import mark from '../../assets/images/tesda-mark.png'
import Icon from '../../components/Icon/Icon.jsx'
import { ROUTES } from '../../constants/routes.js'
import { sealService } from '../../services/ledgerService.js'
import { fullDateTime } from '../../utils/format.js'
import { bitcoinBlockUrl, shortHash } from '../../utils/ledger.js'

const VERDICT = {
  authentic: {
    tone: 'ok',
    icon: 'shield',
    title: 'Authentic and current',
    text: 'This sheet was issued by TESDA NEXUS, and the records still match what was printed.',
  },
  changed: {
    tone: 'warn',
    icon: 'alert',
    title: 'Issued, but no longer current',
    text: 'This sheet was issued by TESDA NEXUS, but the records changed after it was printed. Ask the learning center for an up-to-date copy.',
  },
  revoked: { tone: 'bad', icon: 'x', title: 'Revoked', text: 'The learning center withdrew this sheet. It should not be relied on.' },
  tampered: {
    tone: 'bad',
    icon: 'alert',
    title: 'Cannot be trusted',
    text: 'The ledger entry of this sheet failed its integrity check. Contact the TESDA main office.',
  },
  unknown: {
    tone: 'bad',
    icon: 'x',
    title: 'Not found',
    text: 'No TESDA NEXUS document has this verification code. Check the code, or treat the sheet as not genuine.',
  },
}

/** Public check of a printed sheet's QR code: no login, no personal data beyond what matches the paper. */
export default function VerifyPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [code, setCode] = useState('')

  useEffect(() => {
    document.title = 'Verify a document · TESDA NEXUS'
    if (!token) return
    sealService
      .verify(token)
      .then((d) => {
        setError('')
        setData(d)
      })
      .catch((err) => setError(err.message))
  }, [token])

  const verdict = data ? VERDICT[data.status] ?? VERDICT.unknown : null
  const a = data?.anchor
  return (
    <main className="verify-page">
      <header className="verify-brand">
        <img src={mark} alt="" />
        <div>
          <strong>TESDA NEXUS</strong>
          <span>Document verification · TESDA Region IV-B</span>
        </div>
      </header>

      <section className="verify-card">
        <form
          className="verify-form"
          onSubmit={(e) => {
            e.preventDefault()
            const value = code.trim().toLowerCase()
            if (value) navigate(ROUTES.VERIFY.replace(':token', encodeURIComponent(value)))
          }}
        >
          <label htmlFor="verify-code">Verification code (printed under the QR code)</label>
          <div className="manual-row">
            <input id="verify-code" className="num" placeholder="24-character code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
            <button type="submit" className="btn btn-secondary">
              Verify
            </button>
          </div>
        </form>

        {!token ? (
          <p className="muted">Scan the QR code on a TESDA NEXUS sheet, or type the code printed under it.</p>
        ) : error ? (
          <p className="form-error">{error}</p>
        ) : !data ? (
          <p className="muted">Checking the records, the ledger and the Bitcoin anchor…</p>
        ) : (
          <>
            <div className={`verdict is-${verdict.tone}`} role="status">
              <Icon name={verdict.icon} size={26} />
              <div>
                <h1>{verdict.title}</h1>
                <p>{verdict.text}</p>
              </div>
            </div>

            {data.document && (
              <dl className="verify-facts">
                <div>
                  <dt>Document</dt>
                  <dd>{data.document.title}</dd>
                </div>
                <div>
                  <dt>Issued by</dt>
                  <dd>{data.document.center || 'TESDA NEXUS'}</dd>
                </div>
                <div>
                  <dt>Issued on</dt>
                  <dd>{fullDateTime(data.document.issued_at)}</dd>
                </div>
                {data.document.subject && (
                  <div>
                    <dt>For</dt>
                    <dd>
                      {data.document.subject.label}
                      <small>{data.document.subject.detail}</small>
                    </dd>
                  </div>
                )}
              </dl>
            )}

            {data.ledger && (
              <ul className="check-list verify-checks">
                <li className={data.status === 'authentic' ? 'is-ok' : data.status === 'changed' ? 'is-bad' : 'is-na'}>
                  <Icon name={data.status === 'authentic' ? 'check' : 'x'} size={14} />
                  <span>
                    <strong>Records match the paper</strong>
                    <small>
                      Fingerprint at printing <code className="hash">{shortHash(data.document.fingerprint)}</code>
                      {data.status === 'changed' ? ' no longer matches the records.' : ' still matches the records.'}
                    </small>
                  </span>
                </li>
                <li className={data.ledger.block_intact && data.ledger.chain_intact ? 'is-ok' : 'is-bad'}>
                  <Icon name={data.ledger.block_intact && data.ledger.chain_intact ? 'check' : 'x'} size={14} />
                  <span>
                    <strong>Recorded on the blockchain ledger</strong>
                    <small>
                      Block #{data.ledger.block_index} <code className="hash">{shortHash(data.ledger.block_hash)}</code>
                      {data.ledger.block_intact && data.ledger.chain_intact ? ' is intact, and so is every block before it.' : ' or a block before it failed the integrity check.'}
                    </small>
                  </span>
                </li>
                <li className={a?.status === 'confirmed' ? 'is-ok' : 'is-na'}>
                  <Icon name={a?.status === 'confirmed' ? 'check' : 'clock'} size={14} />
                  <span>
                    <strong>Anchored in Bitcoin</strong>
                    <small>
                      {a?.status === 'confirmed' ? (
                        <>
                          Proven to exist before{' '}
                          <a href={bitcoinBlockUrl(a.bitcoin_block || a.bitcoin_height)} target="_blank" rel="noreferrer noopener">
                            Bitcoin block {Number(a.bitcoin_height).toLocaleString()}
                          </a>{' '}
                          ({a.bitcoin_time} UTC), through OpenTimestamps.
                        </>
                      ) : a?.status === 'pending' ? (
                        `Sent for anchoring ${fullDateTime(a.submitted_at)}. Bitcoin confirmation usually takes a few hours.`
                      ) : (
                        'Not anchored yet. The main office anchors the ledger regularly.'
                      )}
                    </small>
                  </span>
                </li>
              </ul>
            )}
          </>
        )}
      </section>

      <footer className="verify-foot">
        Only the information needed to match the paper is shown here. <Link to={ROUTES.HOME}>TESDA NEXUS</Link>
      </footer>
    </main>
  )
}
