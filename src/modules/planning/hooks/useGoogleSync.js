// ─── Google OAuth token manager ───────────────────────────────────────────────
//
// Gère uniquement le token OAuth Google.
// Plus de lecture/écriture Sheets automatique.
// L'export vers Sheets est déclenché manuellement via useGoogleExport.
// Aucune connexion automatique au montage — popup uniquement sur action utilisateur.
//
// États : disconnected | connecting | connected | reconnecting | expired | error

import { useState, useEffect, useRef } from 'react'
import {
  loadGIS, initTokenClient, requestToken,
  refreshTokenSilent, isTokenExpiringSoon, revokeToken, getToken,
} from '../../../services/googleAuth'

const TOKEN_CHECK_MS       = 45 * 60 * 1_000
const TOKEN_EXPIRY_WARN_MS =  5 * 60 * 1_000

export function useGoogleSync() {
  const hasConfig = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_SHEET_ID)
  const [status, setStatus] = useState('disconnected')
  const [errMsg, setErrMsg] = useState(null)

  const tokenRef        = useRef(null)
  const tokenCheckRef   = useRef(null)
  const reconnectingRef = useRef(false)

  // Vérifie au montage si un token valide existe déjà (obtenu via ModeSelector)
  // → ne déclenche aucun popup, ne charge pas GIS
  useEffect(() => {
    if (!hasConfig) return
    const existing = getToken()
    if (existing) {
      tokenRef.current = existing
      setStatus('connected')
      startTokenCheck()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { clearInterval(tokenCheckRef.current) }, [])

  // ── Token management ────────────────────────────────────────────────────────

  async function attemptSilentRefresh() {
    try {
      const token = await new Promise((resolve, reject) => {
        refreshTokenSilent(resolve, reject)
      })
      tokenRef.current = token
      return true
    } catch { return false }
  }

  function handleTokenExpired() {
    tokenRef.current        = null
    reconnectingRef.current = false
    clearInterval(tokenCheckRef.current)
    setStatus('expired')
    setErrMsg('Session Google expirée — reconnectez')
  }

  async function ensureFreshToken() {
    if (!tokenRef.current || reconnectingRef.current) return
    if (!isTokenExpiringSoon(TOKEN_EXPIRY_WARN_MS)) return
    reconnectingRef.current = true
    setStatus('reconnecting')
    const ok = await attemptSilentRefresh()
    reconnectingRef.current = false
    if (!ok) { handleTokenExpired() } else { setStatus('connected') }
  }

  function startTokenCheck() {
    clearInterval(tokenCheckRef.current)
    tokenCheckRef.current = setInterval(ensureFreshToken, TOKEN_CHECK_MS)
  }

  // ── Connect manuel (popup OAuth) ────────────────────────────────────────────

  async function connect() {
    setErrMsg(null)
    setStatus('connecting')
    try {
      await loadGIS()
      const token = await new Promise((resolve, reject) => {
        initTokenClient(import.meta.env.VITE_GOOGLE_CLIENT_ID, resolve, reject)
        requestToken()
      })
      tokenRef.current = token
      setStatus('connected')
      startTokenCheck()
    } catch (err) {
      setStatus('error')
      setErrMsg(err.message ?? 'Erreur de connexion')
    }
  }

  function disconnect() {
    revokeToken()
    tokenRef.current        = null
    reconnectingRef.current = false
    clearInterval(tokenCheckRef.current)
    setStatus('disconnected')
    setErrMsg(null)
  }

  async function retry() {
    setErrMsg(null)
    await connect()
  }

  return { status, errMsg, connect, disconnect, retry, getToken: () => tokenRef.current }
}
