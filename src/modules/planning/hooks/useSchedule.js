import { useState, useRef, useEffect } from 'react'
import { sessionSave, sessionLoad } from '../../../utils/session'
import { dateToStr, mondayOf } from '../../../utils/date'
import {
  fetchShifts,
  upsertShift,
  upsertShifts,
  deleteShift,
  deleteShifts,
} from '../../../services/planningService'

export { dateToStr, fmtH } from '../../../utils/date'

// Convention collective : max heures/jour
export const MAX_HOURS_PER_DAY = 10

export const START_HOUR      = 4
export const END_HOUR        = 21
export const TOTAL_HOURS     = END_HOUR - START_HOUR   // 17
export const WEEKLY_CONTRACT = 35

// Durée effective d'un shift selon son type
// Seul 'work' contribue aux heures — tous les autres types sont des marqueurs visuels
export function shiftEffective(s) {
  if ((s.type ?? 'work') !== 'work') return 0
  return Math.max(0, (s.endHour - s.startHour) - (s.pause ?? 0))
}

// Début du planning — lundi il y a 4 semaines
export const PLANNING_START  = new Date('2026-02-16T00:00:00')

// Nombre de semaines écoulées depuis PLANNING_START (min 1)
export function weeksElapsed() {
  const ms = Date.now() - PLANNING_START.getTime()
  return Math.max(1, Math.ceil(ms / (7 * 24 * 60 * 60 * 1000)))
}

// Options de temps pour les selects (4:00 … 21:00 par quarts d'heure)
export const TIME_OPTIONS = []
for (let h = START_HOUR; h <= END_HOUR; h++) {
  TIME_OPTIONS.push(h)
  if (h < END_HOUR) TIME_OPTIONS.push(h + 0.25, h + 0.5, h + 0.75)
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useSchedule() {
  const [shifts, setShifts] = useState(() => sessionLoad('shifts') ?? [])

  const saveTimer = useRef(null)

  // Auto-save sessionStorage (debounce 500ms)
  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => sessionSave('shifts', shifts), 500)
    return () => clearTimeout(saveTimer.current)
  }, [shifts])

  // Chargement Supabase au montage — remplace les données locales si Supabase a des données
  useEffect(() => {
    fetchShifts()
      .then(supabaseShifts => {
        if (supabaseShifts.length > 0) {
          setShifts(supabaseShifts)
          console.log('[supabase] shifts chargés:', supabaseShifts.length)
        }
      })
      .catch(err => console.error('[supabase] fetchShifts:', err.message))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function addShift(employeeId, dateStr, startHour, endHour, pause = 0, type = 'work', extra = {}) {
    const shift = { id: crypto.randomUUID(), employeeId, date: dateStr, startHour, endHour, pause, type, ...extra }
    setShifts(prev => [...prev, shift])
    upsertShift(shift).catch(err => console.error('[supabase] addShift:', err.message))
  }

  function moveShift(shiftId, dateStr, startHour) {
    let updated
    setShifts(prev => prev.map(s => {
      if (s.id !== shiftId) return s
      const duration = s.endHour - s.startHour
      const endHour  = Math.min(startHour + duration, END_HOUR)
      const adjStart = endHour === END_HOUR ? END_HOUR - duration : startHour
      updated = { ...s, date: dateStr, startHour: adjStart, endHour }
      return updated
    }))
    if (updated) upsertShift(updated).catch(err => console.error('[supabase] moveShift:', err.message))
  }

  function removeShift(shiftId) {
    setShifts(prev => prev.filter(s => s.id !== shiftId))
    deleteShift(shiftId).catch(err => console.error('[supabase] removeShift:', err.message))
  }

  function removeEmployeeShifts(employeeId) {
    const ids = shifts.filter(s => s.employeeId === employeeId).map(s => s.id)
    setShifts(prev => prev.filter(s => s.employeeId !== employeeId))
    deleteShifts(ids).catch(err => console.error('[supabase] removeEmployeeShifts:', err.message))
  }

  function updateShift(shiftId, startHour, endHour, pause = 0, type = 'work', extra = {}) {
    let updated
    setShifts(prev => prev.map(s => {
      if (s.id !== shiftId) return s
      updated = { ...s, startHour, endHour, pause, type, ...extra }
      return updated
    }))
    if (updated) upsertShift(updated).catch(err => console.error('[supabase] updateShift:', err.message))
  }

  function toggleValidated(shiftId) {
    let updated
    setShifts(prev => prev.map(s => {
      if (s.id !== shiftId) return s
      updated = { ...s, validated: !s.validated }
      return updated
    }))
    if (updated) upsertShift(updated).catch(err => console.error('[supabase] toggleValidated:', err.message))
  }

  // Remplace tous les shifts d'une semaine (utilisé par le sync Sheets)
  function replaceWeekShifts(weekDates, newShifts) {
    const strs     = new Set(weekDates.map(dateToStr))
    const toDelete = shifts.filter(s => strs.has(s.date)).map(s => s.id)
    setShifts(prev => [...prev.filter(s => !strs.has(s.date)), ...newShifts])
    deleteShifts(toDelete).catch(err => console.error('[supabase] replaceWeekShifts delete:', err.message))
    upsertShifts(newShifts).catch(err => console.error('[supabase] replaceWeekShifts upsert:', err.message))
  }

  // Colle les shifts d'une semaine source vers un autre employé
  function pasteShifts(targetEmployeeId, sourceShifts, sourceWeekKey, targetWeekKey, mode) {
    console.log('[pasteShifts] in', { targetEmployeeId, sourceWeekKey, targetWeekKey, mode, sourceShifts })
    const sourceMonday = new Date(sourceWeekKey + 'T00:00:00')
    const targetMonday = new Date(targetWeekKey + 'T00:00:00')

    const toRemove = mode === 'replace'
      ? shifts.filter(s => s.employeeId === targetEmployeeId && mondayOf(s.date) === targetWeekKey && !s.validated)
      : []
    const removeIds = toRemove.map(s => s.id)

    const remaining    = shifts.filter(s => !removeIds.includes(s.id))
    const existingDays = new Set(
      remaining
        .filter(s => s.employeeId === targetEmployeeId && mondayOf(s.date) === targetWeekKey)
        .map(s => s.date)
    )

    const toAdd = sourceShifts.flatMap(s => {
      const dayOffset  = Math.round((new Date(s.date + 'T00:00:00') - sourceMonday) / 86400000)
      const td         = new Date(targetMonday)
      td.setDate(targetMonday.getDate() + dayOffset)
      const targetDate = dateToStr(td)
      if (mode === 'merge' && existingDays.has(targetDate)) return []
      const { id: _id, employeeId: _emp, date: _date, validated: _val, ...rest } = s
      return [{ ...rest, id: crypto.randomUUID(), employeeId: targetEmployeeId, date: targetDate, validated: false }]
    })

    console.log('[pasteShifts] out', { toAdd, existingDays: [...existingDays] })
    setShifts([...remaining, ...toAdd])

    if (removeIds.length) deleteShifts(removeIds).catch(err => console.error('[supabase] pasteShifts delete:', err.message))
    if (toAdd.length)     upsertShifts(toAdd).catch(err => console.error('[supabase] pasteShifts upsert:', err.message))
  }

  // Vide tous les shifts localement — ne touche PAS Supabase (opération destructive)
  function resetShifts() {
    setShifts([])
  }

  // Cumul total toutes semaines confondues
  function getTotalHours(employeeId) {
    return shifts
      .filter(s => s.employeeId === employeeId)
      .reduce((sum, s) => sum + shiftEffective(s), 0)
  }

  // Heures sur une semaine précise (tableau de 7 Date)
  function getWeekHours(employeeId, dates) {
    const strs = new Set(dates.map(dateToStr))
    return shifts
      .filter(s => s.employeeId === employeeId && strs.has(s.date))
      .reduce((sum, s) => sum + shiftEffective(s), 0)
  }

  // Nombre de semaines distinctes où l'employé a au moins un shift
  function getActiveWeeks(employeeId) {
    const keys = new Set(
      shifts.filter(s => s.employeeId === employeeId).map(s => mondayOf(s.date))
    )
    return keys.size
  }

  // Solde contractuel global : heures totales − (activeWeeks × contrat)
  function getBalance(employeeId, contract = WEEKLY_CONTRACT, startBalance = 0) {
    return getTotalHours(employeeId) - getActiveWeeks(employeeId) * contract + startBalance
  }

  // Solde semaine courante en tenant compte du report des semaines précédentes
  function getWeekBalance(employeeId, weekDates, contract = WEEKLY_CONTRACT, startBalance = 0) {
    const strs = new Set(weekDates.map(dateToStr))

    const prevShifts  = shifts.filter(s => s.employeeId === employeeId && !strs.has(s.date))
    const prevHours   = prevShifts.reduce((sum, s) => sum + shiftEffective(s), 0)
    const prevWeeks   = new Set(prevShifts.map(s => mondayOf(s.date))).size
    const prevBalance = prevHours - prevWeeks * contract + startBalance

    const weekObjective = contract - prevBalance
    const weekHrs       = getWeekHours(employeeId, weekDates)
    const weekBalance   = weekHrs - weekObjective

    return { prevBalance, weekObjective, weekBalance, weekHours: weekHrs, prevHours, prevWeeks }
  }

  return {
    shifts, addShift, moveShift, updateShift, removeShift, removeEmployeeShifts,
    toggleValidated, replaceWeekShifts, pasteShifts, resetShifts,
    getTotalHours, getWeekHours, getActiveWeeks, getBalance, getWeekBalance,
  }
}
