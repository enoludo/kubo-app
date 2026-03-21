// ─── Sync Google Sheets — Commandes boutique ──────────────────────────────────
//
// Pattern identique à useGoogleSync (planning) :
//  1. autoConnect() au montage → auth silencieuse → pull initial → 'synced'
//  2. connect() manuel → popup OAuth → push local → 'synced'
//  3. Chaque modification des commandes locales → debounce 1s → push
//  4. Token check 45min → refresh silencieux proactif
//  5. Erreur 401/403 → refresh silencieux → retry unique
//
// Seules les commandes boutique et brunch boutique sont synced.
// Les commandes Webflow ne passent pas par cette feuille.

import { useState, useEffect, useRef } from 'react'
import {
  loadGIS, initTokenClient, requestToken, requestTokenSilent,
  refreshTokenSilent, isTokenExpiringSoon, revokeToken, getToken,
} from '../services/googleAuth'
import { readOrdersFromSheet, writeOrdersToSheet } from '../services/googleSheets'

const DEBOUNCE_MS      = 1_000
const TOKEN_CHECK_MS   = 45 * 60 * 1_000
const TOKEN_EXPIRY_MS  =  5 * 60 * 1_000

function isAuthError(err) {
  return err?.status === 401 || err?.status === 403
}

export function useOrdersGoogleSync({ localOrders, onPullOrders, onToast }) {
  const hasConfig = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_SHEET_ID)
  console.log('[ordersSync] hook monté')
  console.log('[ordersSync] hasConfig:', hasConfig)
  const [status,  setStatus]  = useState(hasConfig ? 'connecting' : 'disconnected')
  const [errMsg,  setErrMsg]  = useState(null)
  const [loading, setLoading] = useState(hasConfig)

  const tokenRef          = useRef(null)
  const localOrdersRef    = useRef(localOrders)
  const suppressRef       = useRef(false)
  const debounceRef       = useRef(null)
  const tokenCheckRef     = useRef(null)
  const reconnectingRef   = useRef(false)
  const lastSigRef        = useRef(null)
  const onToastRef        = useRef(onToast)

  useEffect(() => { localOrdersRef.current = localOrders }, [localOrders])
  useEffect(() => { onToastRef.current     = onToast     }, [onToast])

  // Debounce push après chaque changement des commandes locales
  useEffect(() => {
    if (!tokenRef.current) return
    if (suppressRef.current) { suppressRef.current = false; return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(push, DEBOUNCE_MS)
  }, [localOrders]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { autoConnect() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    clearTimeout(debounceRef.current)
    clearInterval(tokenCheckRef.current)
  }, [])

  // ── Token management ───────────────────────────────────────────────────────

  async function attemptSilentRefresh() {
    try {
      const token = await new Promise((resolve, reject) => { refreshTokenSilent(resolve, reject) })
      tokenRef.current = token
      return true
    } catch { return false }
  }

  function handleTokenExpired() {
    tokenRef.current        = null
    reconnectingRef.current = false
    clearInterval(tokenCheckRef.current)
    setStatus('expired')
    setErrMsg('Session Google expirée — reconnectez pour reprendre la sync')
  }

  async function handleAuthError() {
    if (reconnectingRef.current) return false
    reconnectingRef.current = true
    setStatus('reconnecting')
    const ok = await attemptSilentRefresh()
    reconnectingRef.current = false
    if (!ok) { handleTokenExpired(); return false }
    setStatus('synced')
    return true
  }

  async function ensureFreshToken() {
    if (!tokenRef.current || reconnectingRef.current) return
    if (!isTokenExpiringSoon(TOKEN_EXPIRY_MS)) return
    reconnectingRef.current = true
    setStatus('reconnecting')
    const ok = await attemptSilentRefresh()
    reconnectingRef.current = false
    if (!ok) { handleTokenExpired() } else { setStatus('synced') }
  }

  function startTokenCheck() {
    clearInterval(tokenCheckRef.current)
    tokenCheckRef.current = setInterval(ensureFreshToken, TOKEN_CHECK_MS)
  }

  // ── Auto-connect silencieux au montage ────────────────────────────────────

  async function autoConnect() {
    if (!hasConfig) { console.log('[ordersSync] pas de config Google — sync désactivée'); return }
    console.log('[ordersSync] autoConnect() — tentative silencieuse')

    // Si Planning est déjà connecté, le token est déjà en mémoire dans googleAuth.js
    const sharedToken = getToken()
    if (sharedToken) {
      console.log('[ordersSync] autoConnect() — token partagé depuis Planning ✓')
      tokenRef.current = sharedToken
      await pullFromSheet()
      startTokenCheck()
      return
    }

    try {
      await loadGIS()
      const token = await new Promise((resolve, reject) => {
        initTokenClient(import.meta.env.VITE_GOOGLE_CLIENT_ID, resolve, reject)
        requestTokenSilent()
      })
      tokenRef.current = token
      console.log('[ordersSync] autoConnect() — token obtenu ✓')
      await pullFromSheet()
      startTokenCheck()
    } catch (err) {
      console.log('[ordersSync] autoConnect() — échec silencieux:', err?.message ?? err)
      setStatus('disconnected')
      setLoading(false)
    }
  }

  // ── Pull : Sheet → App (une seule fois au connect) ────────────────────────

  async function pullFromSheet() {
    if (!tokenRef.current) { setLoading(false); return }
    console.log('[ordersSync] readOrdersFromSheet — lecture en cours…')
    try {
      const remOrders = await readOrdersFromSheet(tokenRef.current)
      console.log('[ordersSync] readOrdersFromSheet —', remOrders.length, 'commandes lues')
      if (remOrders.length > 0) {
        suppressRef.current = true
        onPullOrders(remOrders)
      }
      // Initialise la sig pour éviter un push immédiat après pull
      lastSigRef.current = JSON.stringify(localOrdersRef.current)
      setStatus('synced')
    } catch (err) {
      if (isAuthError(err)) {
        setStatus('error')
        setErrMsg('Session expirée — reconnectez Google Sheets')
      } else {
        setStatus('synced')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Connect manuel (popup OAuth) ──────────────────────────────────────────

  async function connect() {
    setStatus('syncing')
    setErrMsg(null)
    try {
      await loadGIS()
      const token = await new Promise((resolve, reject) => {
        initTokenClient(import.meta.env.VITE_GOOGLE_CLIENT_ID, resolve, reject)
        requestToken()
      })
      tokenRef.current = token
      await push()
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
    clearTimeout(debounceRef.current)
    setStatus('disconnected')
    setErrMsg(null)
  }

  // ── Push : App → Sheet ────────────────────────────────────────────────────

  async function push(isRetry = false) {
    if (!tokenRef.current) return

    await ensureFreshToken()
    if (!tokenRef.current) return

    // Sig check — évite de pousser si rien n'a changé
    const sig = JSON.stringify(localOrdersRef.current)
    if (sig === lastSigRef.current) { setStatus('synced'); return }

    setStatus('syncing')
    console.log('[ordersSync] writeOrdersToSheet — push', localOrdersRef.current.length, 'commandes')
    try {
      await writeOrdersToSheet(tokenRef.current, localOrdersRef.current)
      lastSigRef.current = sig
      console.log('[ordersSync] writeOrdersToSheet — succès ✓')
      setStatus('synced')
    } catch (err) {
      if (isAuthError(err) && !isRetry) {
        const refreshed = await handleAuthError()
        if (refreshed) {
          try { await push(true) } catch (e2) { setErrMsg(e2.message); setStatus('error') }
        }
      } else {
        onToastRef.current?.('Sync commandes échouée — données locales préservées', '#E05555')
        setErrMsg(err.message)
        setStatus('error')
      }
    }
  }

  async function retry() {
    setErrMsg(null)
    if (!tokenRef.current) { connect(); return }
    await push()
  }

  // Connexion via token déjà obtenu par un autre hook (ex. Planning)
  async function connectFromSharedToken() {
    const shared = getToken()
    if (!shared || tokenRef.current) return
    tokenRef.current = shared
    setErrMsg(null)
    await pullFromSheet()
    startTokenCheck()
  }

  return { status, errMsg, loading, connect, disconnect, retry, connectFromSharedToken }
}
