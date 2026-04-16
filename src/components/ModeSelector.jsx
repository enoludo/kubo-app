// ─── ModeSelector — écran de sélection du mode d'accès ───────────────────────
import { useState } from 'react'
import { signIn, setTeamSession } from '../services/authService'
import './ModeSelector.css'

const MANAGER_EMAIL = import.meta.env.VITE_MANAGER_EMAIL

export default function ModeSelector() {
  const [mode,     setMode]     = useState(null)
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  async function handleModeSelect(selected) {
    setMode(selected)
    setError(null)
    setPassword('')

    if (selected === 'team') {
      setLoading(true)
      try {
        const res = await fetch('/api/auth-team', { method: 'POST' })
        if (!res.ok) throw new Error('auth-team error')
        const { access_token, refresh_token } = await res.json()
        await setTeamSession(access_token, refresh_token)
      } catch {
        setError('Erreur de connexion. Contactez le gérant.')
        setMode(null)
      } finally {
        setLoading(false)
      }
    }
  }

  async function handleManagerAccess(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(MANAGER_EMAIL, password)
    } catch {
      setError('Mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mode-screen">
      <div className="mode-card">

        {/* Logo */}
        <div className="mode-logo">
          <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="48" height="48" viewBox="0 0 48 47.999" fill="currentColor">
            <defs><clipPath id="clip-mode"><rect width="48" height="48"/></clipPath></defs>
            <g transform="translate(0 0.004)">
              <path d="M320.276,279.849l1.649-1.648,4.237,5.562h2.589l-5.349-7.038,5.273-5.273h-1.155l-7.248,7.248v-7.248h-2.065v12.31h2.067Z" transform="translate(-306.901 -261.809)"/>
              <g transform="translate(0 -0.004)">
                <g clipPath="url(#clip-mode)">
                  <path d="M17.8,677.692h0a3.424,3.424,0,0,0,1.366-6.563,3.131,3.131,0,0,0-1.73-5.741H11.694v8.639L.566,662.9l-.566.56L23.883,687.34l.564-.561-9.086-9.087Zm-1.614-6.86H13.757v-4.626h2.429a2.313,2.313,0,0,1,0,4.626m-2.428.81h2.8a2.618,2.618,0,1,1,0,5.237H14.547l-.789-.789Z" transform="translate(0 -639.341)"/>
                  <path d="M663.43,0l-.563.563L674.1,11.793v4.986a3.617,3.617,0,0,1-6.977,1.343l0-.009a2.973,2.973,0,0,1-.265-1.223V9.643h-2.066v7.25a5.071,5.071,0,0,0,5.063,5h.059a5.064,5.064,0,0,0,5-5.006V12.607L686.75,24.441l.561-.564Z" transform="translate(-639.312 0.004)"/>
                  <path d="M692.54,732.86v-.005h-.232a6.183,6.183,0,1,0,.232.005m-4.312,6.824,0-.112v-1.057c0-2.668,1.837-4.842,4.087-4.845s4.085,2.179,4.089,4.845v.419a.342.342,0,0,0,0,.075v.679a5.269,5.269,0,0,1-1.256,3.318,3.632,3.632,0,0,1-5.655,0,5.27,5.27,0,0,1-1.256-3.322" transform="translate(-661.77 -706.812)"/>
                </g>
              </g>
            </g>
          </svg>
        </div>

        <h1 className="mode-title">Kubo Pâtisserie</h1>
        <p className="mode-subtitle">Espace de travail</p>

        {/* Boutons de sélection */}
        <div className="mode-choices">
          <button
            className={`mode-btn${mode === 'team' ? ' mode-btn--selected' : ''}`}
            onClick={() => handleModeSelect('team')}
            disabled={loading}
          >
            <span className="mode-btn-icon">👥</span>
            <span className="mode-btn-label">Team</span>
          </button>

          <button
            className={`mode-btn${mode === 'manager' ? ' mode-btn--selected' : ''}`}
            onClick={() => handleModeSelect('manager')}
            disabled={loading}
          >
            <span className="mode-btn-icon">🔑</span>
            <span className="mode-btn-label">Gérant</span>
          </button>
        </div>

        {/* Champ mot de passe gérant */}
        {mode === 'manager' && (
          <form className="mode-password-form" onSubmit={handleManagerAccess}>
            <input
              className="field-input"
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(null) }}
              autoFocus
              required
            />
            {error && <p className="mode-error">{error}</p>}
            <button className="btn--success mode-access-btn" type="submit" disabled={loading}>
              {loading ? 'Connexion…' : 'Accéder'}
            </button>
          </form>
        )}

        {/* Erreur team */}
        {mode !== 'manager' && error && <p className="mode-error">{error}</p>}

        {loading && mode === 'team' && (
          <p className="mode-loading">Connexion en cours…</p>
        )}

      </div>
    </div>
  )
}
