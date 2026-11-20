import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import provincialOffice from '../../assets/images/provincial-office.jpg'
import mark from '../../assets/images/tesda-mark.png'
import Button from '../../components/Button/Button.jsx'
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
    <main id="main" className="login">
      <div className="login-panel">
        <form className="login-form rise" onSubmit={handleSubmit}>
          <Link className="brand" to={ROUTES.HOME}>
            <img src={mark} alt="" />
            <span className="brand-text">
              <strong>TESDA NEXUS</strong>
              <span>Region IV-B</span>
            </span>
          </Link>
          <h1>Log in</h1>
          <p className="lede">Use the account your TESDA office or learning center gave you.</p>
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button type="button" className="icon-btn password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
            </button>
          </div>
          <Button type="submit" className="btn-lg" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </Button>
          <Link to={ROUTES.HOME} className="login-back">
            Back to home
          </Link>
        </form>
      </div>

      <figure className="login-visual">
        <img src={provincialOffice} alt="A TESDA provincial office building" />
        <figcaption>
          <img src={mark} alt="" />
          <span>
            <strong>Technical Education and Skills Development Authority</strong>
            Region IV-B · Mindoro, Marinduque, Romblon, Palawan
          </span>
        </figcaption>
      </figure>
    </main>
  )
}
