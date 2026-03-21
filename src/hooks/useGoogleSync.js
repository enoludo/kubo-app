// ─── Synchronisation Google Sheets — App comme source de vérité ──────────────
//
// Flux :
//  1. autoConnect() au montage → auth silencieuse → pull initial → statut 'synced'
//  2. connect() manuel → popup OAuth → push local → statut 'synced'
//  3. Chaque modification locale → debounce 1s → push semaines modifiées uniquement
//  4. Token check 45min → refresh silencieux proactif si <5min restantes
//  5. Erreur 401/403 → refresh silencieux → retry unique → ou 'expired'
//
// L'app est la seule source de vérité.
// Le Sheet est une vue en lecture. Pas de polling, pas de résolution de conflits.

import { useState, useEffect, useRef } from 'react'
import {
  loadGIS, initTokenClient, requestToken, requestTokenSilent,
  refreshTokenSilent, isTokenExpiringSoon, revokeToken,
} from '../services/googleAuth'
import {
  weekSheetName, mondayOf, weekDatesFromMonday, shiftsSig,
} from '../services/googleSheets'
import { dateToStr } from '../utils/date'
import { getDataService, setDataService, clearDataService } from '../services/DataService'
import { GoogleSheetsAdapter } from '../services/adapters/GoogleSheetsAdapter'

const DEBOUNCE_MS          = 1_000
const TOKEN_CHECK_MS       = 45 * 60 * 1_000  // vérification proactive toutes les 45min
const TOKEN_EXPIRY_WARN_MS =  5 * 60 * 1_000  // refresh si moins de 5min restantes

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
  // C6 : status initial conditionnel — pas de spinner si Sheets non configuré
  const hasConfig = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_SHEET_ID)
  const [status,  setStatus]  = useState(hasConfig ? 'connecting' : 'disconnected')
  const [errMsg,  setErrMsg]  = useState(null)
  const [loading, setLoading] = useState(hasConfig)

  // Refs — stables dans les closures asynchrones
  const tokenRef          = useRef(null)
  const shiftsRef         = useRef(shifts)
  const teamRef           = useRef(team)
  const weekDatesRef      = useRef(weekDates)
  // C1 : suppressRef consommé une seule fois après le pull initial (pattern consume-once)
  const suppressRef       = useRef(false)
  const debounceRef       = useRef(null)
  const tokenCheckRef     = useRef(null)
  const reconnectingRef   = useRef(false)
  // C2 : sigs par semaine — push uniquement si le contenu a changé
  const lastPushedRef     = useRef({})
  // C3 : sig équipe — évite de repousser l'équipe inchangée
  const lastTeamSigRef    = useRef(null)

  // Sync refs
  useEffect(() => { shiftsRef.current    = shifts    }, [shifts])
  useEffect(() => { teamRef.current      = team      }, [team])
  useEffect(() => { weekDatesRef.current = weekDates }, [weekDates])

  // Debounce push — déclenché à chaque modification locale
  useEffect(() => {
    if (!tokenRef.current) return
    // C1 : consume-once — premier fire après un pull : on absorbe sans pousser
    if (suppressRef.current) {
      suppressRef.current = false
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(push, DEBOUNCE_MS)
  }, [shifts, team]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-connect silencieux au montage
  useEffect(() => { autoConnect() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup au démontage
  useEffect(() => () => {
    clearTimeout(debounceRef.current)
    clearInterval(tokenCheckRef.current)
  }, [])

  // ── Token management ──────────────────────────────────────────────────────

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

  function handleTokenExpired() {
    tokenRef.current        = null
    reconnectingRef.current = false
    clearInterval(tokenCheckRef.current)
    clearDataService()
    setStatus('expired')
    setErrMsg('Session Google expirée — reconnectez pour reprendre la sync')
  }

  // C5 : refresh silencieux sans retry récursif — retourne true si réussi
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
    if (!tokenRef.current)              return
    if (!isTokenExpiringSoon(TOKEN_EXPIRY_WARN_MS)) return
    if (reconnectingRef.current)        return
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
    if (!hasConfig) return  // status déjà 'disconnected'
    try {
      await loadGIS()
      const token = await new Promise((resolve, reject) => {
        initTokenClient(import.meta.env.VITE_GOOGLE_CLIENT_ID, resolve, reject)
        requestTokenSilent()
      })
      tokenRef.current = token
      setDataService(new GoogleSheetsAdapter(tokenRef))
      await pullFromSheet()
      startTokenCheck()
    } catch {
      setStatus('disconnected')
      setLoading(false)
    }
  }

  // ── Pull initial : Sheets → App (une seule fois au connect) ──────────────

  async function pullFromSheet() {
    if (!tokenRef.current) { setLoading(false); return }
    try {
      const curWD = weekDatesRef.current
      const ds    = getDataService()
      const [remShifts, remTeam] = await Promise.all([
        ds.getShifts(curWD, teamRef.current),
        ds.getEmployees(teamRef.current),
      ])

      // Appliquer les données distantes et armer la suppression
      if (remShifts.length > 0 || remTeam.length > 0) {
        // C1 : suppress = true AVANT les mises à jour d'état pour bloquer le premier push
        suppressRef.current = true
        if (remShifts.length > 0) replaceWeekShifts(curWD, remShifts)
        if (remTeam.length > 0)   setTeam(() => remTeam)
      }

      // Initialiser les sigs pour éviter de repousser du contenu non modifié
      const name      = weekSheetName(curWD)
      const localStrs = new Set(curWD.map(d => dateToStr(d)))
      const wkShifts  = remShifts.length > 0
        ? remShifts
        : shiftsRef.current.filter(s => localStrs.has(s.date))
      lastPushedRef.current[name] = shiftsSig(wkShifts)
      lastTeamSigRef.current      = JSON.stringify(remTeam.length > 0 ? remTeam : teamRef.current)

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
      setDataService(new GoogleSheetsAdapter(tokenRef))
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
    clearDataService()
    setStatus('disconnected')
    setErrMsg(null)
  }

  // ── Push : App → Sheets ───────────────────────────────────────────────────

  async function push(isRetry = false) {
    if (!tokenRef.current) return

    await ensureFreshToken()
    if (!tokenRef.current) return

    setStatus('syncing')
    try {
      const curShifts = shiftsRef.current
      const curTeam   = teamRef.current
      const ds        = getDataService()

      // C3 : push équipe uniquement si elle a changé
      const teamSig = JSON.stringify(curTeam)
      if (teamSig !== lastTeamSigRef.current) {
        await ds.saveEmployees(curTeam)
        lastTeamSigRef.current = teamSig
      }

      // C2 : push uniquement les semaines dont le contenu a changé
      const mondays = [...new Set(curShifts.map(s => mondayOf(s.date)))]
      for (const mon of mondays) {
        const wd       = weekDatesFromMonday(mon)
        const name     = weekSheetName(wd)
        const strs     = new Set(wd.map(d => dateToStr(d)))  // C7 : dateToStr de utils
        const wkShifts = curShifts.filter(s => strs.has(s.date))
        const sig      = shiftsSig(wkShifts)
        if (sig === lastPushedRef.current[name]) continue  // inchangé, on saute
        await ds.saveWeekShifts(wd, curShifts, curTeam)
        lastPushedRef.current[name] = sig
      }

      setStatus('synced')
    } catch (err) {
      if (isAuthError(err) && !isRetry) {
        // C5 : refresh + retry unique, pas de récursion indéfinie
        const refreshed = await handleAuthError()
        if (refreshed) {
          try { await push(true) } catch (e2) { setErrMsg(e2.message); setStatus('error') }
        }
      } else if (err.isSyncFailure) {
        onToast?.('Sync échouée — données locales préservées', '#E05555')
        setStatus('synced')  // C8 : 'synced' pas 'session' (statut inexistant)
      } else {
        setErrMsg(err.message)
        setStatus('error')
      }
    }
  }

  // ── Retry ─────────────────────────────────────────────────────────────────

  async function retry() {
    setErrMsg(null)
    if (!tokenRef.current) { connect(); return }
    await push()
  }

  return { status, errMsg, loading, connect, disconnect, retry }
}
