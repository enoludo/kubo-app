import { useState, useRef, useEffect } from 'react'
import { sessionSave, sessionLoad } from '../utils/session'
import demoShifts from '../data/demoShifts'

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

// "YYYY-MM-DD" en heure locale (évite les décalages UTC)
export function dateToStr(d) {
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// Nombre de semaines écoulées depuis PLANNING_START (min 1)
export function weeksElapsed() {
  const ms = Date.now() - PLANNING_START.getTime()
  return Math.max(1, Math.ceil(ms / (7 * 24 * 60 * 60 * 1000)))
}

// Options de temps pour les selects (7:00 … 20:00 par demi-heures)
export const TIME_OPTIONS = []
for (let h = START_HOUR; h <= END_HOUR; h++) {
  TIME_OPTIONS.push(h)
  if (h < END_HOUR) TIME_OPTIONS.push(h + 0.5)
}

// Lundi de la semaine d'une date ISO "YYYY-MM-DD"
function weekKeyOf(dateStr) {
  const d   = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const mon = new Date(d)
  mon.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return dateToStr(mon)
}

export function fmtH(h) {
  return `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 === 0.5 ? '30' : '00'}`
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useSchedule() {
  // Priorité : sessionStorage → données démo
  const [shifts, setShifts] = useState(() => sessionLoad('shifts') ?? demoShifts)

  const saveTimer = useRef(null)

  // Auto-save : debounce 500ms après chaque modification
  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => sessionSave('shifts', shifts), 500)
    return () => clearTimeout(saveTimer.current)
  }, [shifts])

  function addShift(employeeId, dateStr, startHour, endHour, pause = 0, type = 'work', extra = {}) {
    const id = crypto.randomUUID()
    setShifts(prev => [
      ...prev,
      { id, employeeId, date: dateStr, startHour, endHour, pause, type, ...extra },
    ])
  }

  function moveShift(shiftId, dateStr, startHour) {
    setShifts(prev => prev.map(s => {
      if (s.id !== shiftId) return s
      const duration = s.endHour - s.startHour
      const endHour  = Math.min(startHour + duration, END_HOUR)
      const adjStart = endHour === END_HOUR ? END_HOUR - duration : startHour
      return { ...s, date: dateStr, startHour: adjStart, endHour }
    }))
  }

  function removeShift(shiftId) {
    setShifts(prev => prev.filter(s => s.id !== shiftId))
  }

  function removeEmployeeShifts(employeeId) {
    setShifts(prev => prev.filter(s => s.employeeId !== employeeId))
  }

  function updateShift(shiftId, startHour, endHour, pause = 0, type = 'work', extra = {}) {
    setShifts(prev => prev.map(s =>
      s.id === shiftId ? { ...s, startHour, endHour, pause, type, ...extra } : s
    ))
  }

  function toggleValidated(shiftId) {
    setShifts(prev => prev.map(s =>
      s.id === shiftId ? { ...s, validated: !s.validated } : s
    ))
  }

  // Remplace tous les shifts d'une semaine par de nouveaux (utilisé par le sync Sheets)
  function replaceWeekShifts(weekDates, newShifts) {
    const strs = new Set(weekDates.map(dateToStr))
    setShifts(prev => [
      ...prev.filter(s => !strs.has(s.date)),
      ...newShifts,
    ])
  }

  // Réinitialise aux données de démonstration (après confirmation utilisateur)
  function resetShifts() {
    setShifts(demoShifts)
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
      shifts.filter(s => s.employeeId === employeeId).map(s => weekKeyOf(s.date))
    )
    return keys.size
  }

  // Solde contractuel global : heures totales − (activeWeeks × contrat)
  function getBalance(employeeId, contract = WEEKLY_CONTRACT, startBalance = 0) {
    return getTotalHours(employeeId) - getActiveWeeks(employeeId) * contract + startBalance
  }

  // Solde semaine courante en tenant compte du report des semaines précédentes
  // Retourne { prevBalance, weekObjective, weekBalance, weekHours, prevHours, prevWeeks }
  function getWeekBalance(employeeId, weekDates, contract = WEEKLY_CONTRACT, startBalance = 0) {
    const strs = new Set(weekDates.map(dateToStr))

    // Shifts hors de la semaine visible
    const prevShifts  = shifts.filter(s => s.employeeId === employeeId && !strs.has(s.date))
    const prevHours   = prevShifts.reduce((sum, s) => sum + shiftEffective(s), 0)
    const prevWeeks   = new Set(prevShifts.map(s => weekKeyOf(s.date))).size
    const prevBalance = prevHours - prevWeeks * contract + startBalance

    // Objectif de la semaine ajusté du report
    const weekObjective = contract - prevBalance
    const weekHrs       = getWeekHours(employeeId, weekDates)
    const weekBalance   = weekHrs - weekObjective

    return { prevBalance, weekObjective, weekBalance, weekHours: weekHrs, prevHours, prevWeeks }
  }

  return {
    shifts, addShift, moveShift, updateShift, removeShift, removeEmployeeShifts,
    toggleValidated, replaceWeekShifts, resetShifts,
    getTotalHours, getWeekHours, getActiveWeeks, getBalance, getWeekBalance,
  }
}
