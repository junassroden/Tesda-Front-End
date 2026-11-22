import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import regionalOffice from '../../assets/images/bg.png'
import mark from '../../assets/images/tesda-mark.png'
import Icon from '../../components/Icon/Icon.jsx'
import TextInput from '../../components/form/TextInput.jsx'
import { HOME_BY_ROLE, ROUTES } from '../../constants/routes.js'
import { useAuth } from '../../hooks/useAuth.js'

// Figma: Login page19
export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user && HOME_BY_ROLE[user.role]) return <Navigate to={HOME_BY_ROLE[user.role]} replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const signedIn = await login(email.trim(), password)
      navigate(location.state?.from || HOME_BY_ROLE[signedIn.role] || ROUTES.HOME, { replace: true })
    } catch (err) {
      setError(err.status === 401 || err.status === 422 ? 'That email and password don’t match an account.' : err.message)
      setBusy(false)
    }
  }

  return (
    <main id="main" className="signin">
      <div className="signin-card rise">
        <section className="signin-pane" aria-labelledby="signin-title">
          <Link className="signin-logo" to={ROUTES.HOME} aria-label="TESDA NEXUS home">
            <img src={mark} alt="" />
            TESDA NEXUS
          </Link>

          <form className="signin-form" onSubmit={handleSubmit}>
            <h1 id="signin-title">Log in to your portal</h1>
            <p className="signin-lede">Use the account your TESDA office or learning center gave you.</p>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <TextInput id="email" label="Email address" type="email" placeholder="name@tesda.gov.ph" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
            <div className="password-field">
              <TextInput
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button type="button" className="icon-btn password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>

            <button type="submit" className="signin-submit" disabled={busy}>
              {busy ? 'Logging in…' : 'Log in'}
            </button>

            <p className="signin-roles">One account opens the portal for your role: main office, learning center, or teacher.</p>
          </form>

          <div className="signin-foot">
            <span>No account? Ask your center administrator.</span>
            <Link to={ROUTES.HOME}>Back to website</Link>
          </div>
        </section>

        <figure className="signin-photo">
          <img src={regionalOffice} alt="The TESDA MIMAROPA regional office building" />

          <Link to={ROUTES.HOME} className="signin-close" aria-label="Back to website">
            <Icon name="x" size={18} />
          </Link>

          {/* Small product cards floating over the photo, the way the portal reports a request */}
          <div className="signin-float signin-float-top" aria-hidden="true">
            <span className="signin-float-icon">
              <Icon name="check" size={15} />
            </span>
            <div>
              <strong>Supply request approved</strong>
              <small>REQ-0003 · PTC Palawan</small>
            </div>
          </div>

          <div className="signin-float signin-float-bottom" aria-hidden="true">
            <div className="signin-float-head">
              <strong>Training allowance</strong>
              <em>Released</em>
            </div>
            <small>BPP Batch 2026-01 · 24 trainees</small>
            <div className="signin-float-bar">
              <span />
            </div>
          </div>

          <figcaption>
            <img src={mark} alt="" />
            TESDA MIMAROPA Regional Office
          </figcaption>
        </figure>
      </div>
    </main>
  )
}
