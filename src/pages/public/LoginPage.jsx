import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
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
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <main className="login">
      <div className="login-card">
        <div className="ph" role="img" aria-label="Image placeholder" />
        <form className="login-form" onSubmit={handleSubmit}>
          <h1>TESDA NEXUS</h1>
          <p>Sign in to access student services, allowance tracking, and secure documents.</p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <TextInput id="email" label="Email address" className="compact" type="email" placeholder="name@tesda.gov.ph" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          <div className="password-field">
            <TextInput
              id="password"
              label="Password"
              className="compact"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              👁
            </button>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? 'Logging in…' : 'Login'}
          </Button>
          <Button to={ROUTES.HOME}>Back</Button>
        </form>
      </div>
    </main>
  )
}
