// ─── LoginScreen — écran de connexion ────────────────────────────────────────
import { useState } from 'react'
import { signIn }   from '../services/authService'
import './LoginScreen.css'

export default function LoginScreen() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      // onAuthStateChange dans useAuth prend le relais
    } catch (err) {
      setError('Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">🥐</div>
        <h1 className="login-title">Kubo Pâtisserie</h1>
        <p className="login-subtitle">Connexion à l'espace de travail</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="login-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              className="login-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            className="login-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
