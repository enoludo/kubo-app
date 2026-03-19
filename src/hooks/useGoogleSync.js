// ─── Synchronisation bidirectionnelle avec Google Sheets ─────────────────────
//
// Flux :
//  1. autoConnect() au montage → auth silencieuse → pull Sheets → polling
//  2. connect() manuel → popup OAuth → push local → polling
//  3. Chaque modification locale → debounce 1s → push semaines affectées
//  4. Polling 30s → compare Sheets vs dernier push → applique ou conflit
//  5. Token check 45min → refresh silencieux proactif si <5min restantes
//  6. Erreur 401/403 → refresh silencieux → retry → ou 'expired'
//
// Anti-boucle   : suppressRef bloque le push après un pull entrant
// Anti-doublon  : reconnectingRef empêche des refreshs concurrents

import { useState, useEffect, useRef } from 'react'
import {
  loadGIS, initTokenClient, requestToken, requestTokenSilent,
  refreshTokenSilent, isTokenExpiringSoon, revokeToken,
} from '../services/googleAuth'
import {
  weekSheetName, mondayOf, weekDatesFromMonday, shiftsSig,
} from '../services/googleSheets'
import { getDataService, setDataService, clearDataService } from '../services/DataService'
import { GoogleSheetsAdapter } from '../services/adapters/GoogleSheetsAdapter'

const DEBOUNCE_MS          = 1_000
const POLL_MS              = 30_000
const TOKEN_CHECK_MS       = 45 * 60 * 1_000  // vérification proactive toutes les 45min
const TOKEN_EXPIRY_WARN_MS =  5 * 60 * 1_000  // refresh si moins de 5min restantes

function dateToStr(d) {
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function isAuthError(err) {
  return err?.status === 401 || err?.status === 403
}

export function useGoogleSync({
  shifts,
  team,
  weekDates,
  setTeam,
  replaceWeekShifts,
  onToast,
}) {
  const [status,   setStatus]   = useState('connecting')
  const [errMsg,   setErrMsg]   = useState(null)
  const [conflict, setConflict] = useState(null)
  const [loading,  setLoading]  = useState(true)

  // Refs — stables dans les closures asynchrones
  const tokenRef        = useRef(null)
  const shiftsRef       = useRef(shifts)
  const teamRef         = useRef(team)
  const weekDatesRef    = useRef(weekDates)
  const suppressRef     = useRef(false)
  const dirtyRef        = useRef(false)
  const debounceRef     = useRef(null)
  const pollRef         = useRef(null)
  const tokenCheckRef   = useRef(null)
  const reconnectingRef = useRef(false)  // empêche les refreshs concurrents
  const lastPushedRef   = useRef({})

  // Synchroniser les refs avec les props
  useEffect(() => { shiftsRef.current    = shifts    }, [shifts])
  useEffect(() => { teamRef.current      = team      }, [team])
  useEffect(() => { weekDatesRef.current = weekDates }, [weekDates])

  // Déclencheur debounce — push outbound après chaque modification locale
  useEffect(() => {
    if (!tokenRef.current) return
    if (suppressRef.current) return
    dirtyRef.current = true
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(pushAll, DEBOUNCE_MS)
  }, [shifts, team]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-connect silencieux au montage
  useEffect(() => { autoConnect() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup au démontage
  useEffect(() => () => {
    clearTimeout(debounceRef.current)
    clearInterval(pollRef.current)
    clearInterval(tokenCheckRef.current)
  }, [])

  // ── Refresh silencieux du token ───────────────────────────────────────────

  async function attemptSilentRefresh() {
    try {
      const token = await new Promise((resolve, reject) => {
        refreshTokenSilent(resolve, reject)
      })
      tokenRef.current = token
      return true
    } catch {
      return false
    }
  }

  // Token expiré définitivement — stoppe tout, passe en 'expired'
  function handleTokenExpired() {
    tokenRef.current        = null
    reconnectingRef.current = false
    clearInterval(pollRef.current)
    clearInterval(tokenCheckRef.current)
    clearDataService()
    setStatus('expired')
    setErrMsg('Session Google expirée — reconnectez pour reprendre la sync')
  }

  // Appelé quand une API retourne 401 / 403 — tente le refresh puis retry
  async function handleAuthError(retryFn) {
    if (reconnectingRef.current) return
    reconnectingRef.current = true
    setStatus('reconnecting')

    const ok = await attemptSilentRefresh()
    reconnectingRef.current = false

    if (!ok) {
      handleTokenExpired()
      return
    }

    setStatus('synced')
    // Rejouer l'opération qui a échoué avec le nouveau token
    if (retryFn) {
      try { await retryFn() } catch { handleTokenExpired() }
    }
  }

  // Vérification proactive : refresh si le token expire dans moins de WARN ms
  async function ensureFreshToken() {
    if (!tokenRef.current)              return
    if (!isTokenExpiringSoon(TOKEN_EXPIRY_WARN_MS)) return
    if (reconnectingRef.current)        return

    reconnectingRef.current = true
    setStatus('reconnecting')
    const ok = await attemptSilentRefresh()
    reconnectingRef.current = false

    if (!ok) { handleTokenExpired() } else { setStatus('synced') }
  }

  // Timer toutes les 45 min — refresh proactif avant expiration
  function startTokenCheck() {
    clearInterval(tokenCheckRef.current)
    tokenCheckRef.current = setInterval(ensureFreshToken, TOKEN_CHECK_MS)
  }

  // ── Auth silencieux au montage ────────────────────────────────────────────

  async function autoConnect() {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID || !import.meta.env.VITE_GOOGLE_SHEET_ID) {
      setStatus('disconnected')
      setLoading(false)
      return
    }
    try {
      await loadGIS()
      const token = await new Promise((resolve, reject) => {
        initTokenClient(import.meta.env.VITE_GOOGLE_CLIENT_ID, resolve, reject)
        requestTokenSilent()
      })
      tokenRef.current = token
      setDataService(new GoogleSheetsAdapter(tokenRef))
      await pullFromSheet()
      startPolling()
      startTokenCheck()
    } catch {
      setStatus('disconnected')
      setLoading(false)
    }
  }

  // ── Pull initial : Sheets → App ───────────────────────────────────────────

  async function pullFromSheet() {
    const token = tokenRef.current
    if (!token) { setLoading(false); return }
    try {
      suppressRef.current = true
      const curWD = weekDatesRef.current
      const name  = weekSheetName(curWD)
      const ds    = getDataService()
      const [remShifts, remTeam] = await Promise.all([
        ds.getShifts(curWD, teamRef.current),
        ds.getEmployees(teamRef.current),
      ])
      if (remShifts.length > 0) {
        replaceWeekShifts(curWD, remShifts)
        lastPushedRef.current[name] = shiftsSig(remShifts)
      } else {
        const localStrs = new Set(curWD.map(d => dateToStr(d)))
        const localWk   = shiftsRef.current.filter(s => localStrs.has(s.date))
        lastPushedRef.current[name] = shiftsSig(localWk)
      }
      if (remTeam.length > 0) setTeam(prev => remTeam.length > 0 ? remTeam : prev)
      setTimeout(() => { suppressRef.current = false }, 100)
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

  // ── Auth manuel (popup) ───────────────────────────────────────────────────

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
      setDataService(new GoogleSheetsAdapter(tokenRef))
      await pushAll()
      startPolling()
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
    clearInterval(pollRef.current)
    clearInterval(tokenCheckRef.current)
    clearTimeout(debounceRef.current)
    dirtyRef.current = false
    clearDataService()
    setStatus('disconnected')
    setErrMsg(null)
    setConflict(null)
  }

  // ── Push : App → Sheets ───────────────────────────────────────────────────

  async function pushAll() {
    if (!tokenRef.current) return

    // Refresh proactif si token proche de l'expiration
    await ensureFreshToken()
    if (!tokenRef.current) return  // expire pendant le refresh

    setStatus('syncing')
    try {
      const curShifts = shiftsRef.current
      const curTeam   = teamRef.current
      const ds        = getDataService()

      await ds.saveEmployees(curTeam)

      const mondays = [...new Set(curShifts.map(s => mondayOf(s.date)))]
      for (const mon of mondays) {
        const wd   = weekDatesFromMonday(mon)
        const name = weekSheetName(wd)
        const strs = new Set(wd.map(d => {
          const y  = d.getFullYear()
          const m  = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          return `${y}-${m}-${dd}`
        }))
        const wkShifts = curShifts.filter(s => strs.has(s.date))
        await ds.saveWeekShifts(wd, curShifts, curTeam)
        lastPushedRef.current[name] = shiftsSig(wkShifts)
      }

      dirtyRef.current = false
      setStatus('synced')
    } catch (err) {
      if (isAuthError(err)) {
        await handleAuthError(pushAll)  // retry après refresh
      } else {
        setErrMsg(err.message)
        setStatus('error')
      }
    }
  }

  // ── Poll : Sheets → App ───────────────────────────────────────────────────

  async function pollCurrentWeek() {
    if (!tokenRef.current) return

    await ensureFreshToken()
    if (!tokenRef.current) return

    const curWD = weekDatesRef.current
    const name  = weekSheetName(curWD)
    const ds    = getDataService()
    try {
      const remShifts = await ds.getShifts(curWD, teamRef.current)
      const remSig    = shiftsSig(remShifts)
      const lastSig   = lastPushedRef.current[name]

      if (lastSig !== undefined && remSig === lastSig) return

      if (dirtyRef.current) {
        const remTeam = await ds.getEmployees(teamRef.current)
        setConflict({ remoteShifts: remShifts, remoteTeam: remTeam })
      } else {
        suppressRef.current = true
        const remTeam = await ds.getEmployees(teamRef.current)
        setTeam(prev => remTeam.length > 0 ? remTeam : prev)
        replaceWeekShifts(curWD, remShifts)
        lastPushedRef.current[name] = shiftsSig(remShifts)
        setTimeout(() => { suppressRef.current = false }, 100)
        onToast?.('Planning mis à jour depuis Google Sheets', '#4CAF50')
      }
    } catch (err) {
      if (isAuthError(err)) {
        await handleAuthError(pollCurrentWeek)
      }
      // Autres erreurs : silencieux, retry au prochain poll
    }
  }

  function startPolling() {
    clearInterval(pollRef.current)
    pollRef.current = setInterval(pollCurrentWeek, POLL_MS)
  }

  // ── Résolution de conflit ─────────────────────────────────────────────────

  function resolveConflict(choice) {
    if (!conflict) return
    if (choice === 'remote') {
      suppressRef.current = true
      const curWD = weekDatesRef.current
      const name  = weekSheetName(curWD)
      if (conflict.remoteTeam?.length > 0) setTeam(conflict.remoteTeam)
      replaceWeekShifts(curWD, conflict.remoteShifts)
      lastPushedRef.current[name] = shiftsSig(conflict.remoteShifts)
      setTimeout(() => { suppressRef.current = false }, 100)
    } else {
      pushAll()
    }
    setConflict(null)
  }

  // ── Retry / Reconnexion ───────────────────────────────────────────────────

  async function retry() {
    setErrMsg(null)
    // Pas de token (expired ou jamais connecté) → popup OAuth
    if (!tokenRef.current) { connect(); return }
    await pushAll()
    if (tokenRef.current) startPolling()
  }

  return { status, errMsg, conflict, loading, connect, disconnect, resolveConflict, retry }
}
