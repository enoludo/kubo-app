import { useState, useRef, useEffect } from 'react'
import { sessionSave, sessionLoad } from '../utils/session'

// Convention collective : max heures/jour
export const MAX_HOURS_PER_DAY = 10

export const START_HOUR      = 7
export const END_HOUR        = 20
export const TOTAL_HOURS     = END_HOUR - START_HOUR   // 13
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

// ─── Données de démonstration sur 4 semaines ───────────────────────────────
// Semaine 0 : 2026-02-16 (Lun) → 2026-02-22 (Dim)
// Semaine 1 : 2026-02-23 (Lun) → 2026-03-01 (Dim)
// Semaine 2 : 2026-03-02 (Lun) → 2026-03-08 (Dim)
// Semaine 3 : 2026-03-09 (Lun) → 2026-03-15 (Dim)  ← semaine courante
//
// Soldes cumulés (semaines 0+1+2, hors semaine courante) :
//   Emp 1 : 36.5 + 36 + 36.5 = 109h → +4h00  (en avance)
//   Emp 2 : 33   + 33.5 + 34  = 100.5h → −4h30  (en retard)
//   Emp 3 : 35   + 35.5 + 35.5 = 106h → +1h00  (proche équilibre)
//   Emp 4 : 37   + 37   + 37   = 111h → +6h00  (en avance)
//   Emp 5 : 34   + 33.5 + 34.5 = 102h → −3h00  (en retard)

const DEMO = [
  // ── Semaine 0 : 16/02 – 22/02, Mar–Sam ──────────────────────────────────
  // Emp 1 — 36.5h
  { id:  1, employeeId: 1, date: '2026-02-17', startHour:  7,   endHour: 14.5 },
  { id:  2, employeeId: 1, date: '2026-02-18', startHour:  7,   endHour: 14   },
  { id:  3, employeeId: 1, date: '2026-02-19', startHour:  8,   endHour: 15.5 },
  { id:  4, employeeId: 1, date: '2026-02-20', startHour:  8,   endHour: 15   },
  { id:  5, employeeId: 1, date: '2026-02-21', startHour:  8,   endHour: 15.5 },
  // Emp 2 — 33h
  { id:  6, employeeId: 2, date: '2026-02-17', startHour:  7,   endHour: 12   },
  { id:  7, employeeId: 2, date: '2026-02-18', startHour:  8,   endHour: 15   },
  { id:  8, employeeId: 2, date: '2026-02-19', startHour:  9,   endHour: 16   },
  { id:  9, employeeId: 2, date: '2026-02-20', startHour:  8,   endHour: 14   },
  { id: 10, employeeId: 2, date: '2026-02-21', startHour:  8,   endHour: 16   },
  // Emp 3 — 35h
  { id: 11, employeeId: 3, date: '2026-02-17', startHour:  9,   endHour: 16   },
  { id: 12, employeeId: 3, date: '2026-02-18', startHour: 10,   endHour: 17   },
  { id: 13, employeeId: 3, date: '2026-02-19', startHour:  9,   endHour: 16   },
  { id: 14, employeeId: 3, date: '2026-02-20', startHour: 10,   endHour: 17   },
  { id: 15, employeeId: 3, date: '2026-02-21', startHour:  9,   endHour: 16   },
  // Emp 4 — 37h
  { id: 16, employeeId: 4, date: '2026-02-17', startHour:  7,   endHour: 15   },
  { id: 17, employeeId: 4, date: '2026-02-18', startHour:  7,   endHour: 14.5 },
  { id: 18, employeeId: 4, date: '2026-02-19', startHour:  7,   endHour: 14.5 },
  { id: 19, employeeId: 4, date: '2026-02-20', startHour:  7,   endHour: 14   },
  { id: 20, employeeId: 4, date: '2026-02-21', startHour:  7,   endHour: 14   },
  // Emp 5 — 34h
  { id: 21, employeeId: 5, date: '2026-02-17', startHour: 12,   endHour: 19   },
  { id: 22, employeeId: 5, date: '2026-02-18', startHour: 12,   endHour: 18   },
  { id: 23, employeeId: 5, date: '2026-02-19', startHour: 13,   endHour: 20   },
  { id: 24, employeeId: 5, date: '2026-02-20', startHour: 12,   endHour: 19   },
  { id: 25, employeeId: 5, date: '2026-02-21', startHour: 13,   endHour: 20   },

  // ── Semaine 1 : 23/02 – 01/03, Mar–Sam ──────────────────────────────────
  // Emp 1 — 36h
  { id: 26, employeeId: 1, date: '2026-02-24', startHour:  7.5, endHour: 14.5 },
  { id: 27, employeeId: 1, date: '2026-02-25', startHour:  7,   endHour: 14   },
  { id: 28, employeeId: 1, date: '2026-02-26', startHour:  8,   endHour: 16   },
  { id: 29, employeeId: 1, date: '2026-02-27', startHour:  7,   endHour: 14   },
  { id: 30, employeeId: 1, date: '2026-02-28', startHour:  8,   endHour: 15   },
  // Emp 2 — 33.5h
  { id: 31, employeeId: 2, date: '2026-02-24', startHour:  7,   endHour: 12   },
  { id: 32, employeeId: 2, date: '2026-02-25', startHour:  8,   endHour: 15   },
  { id: 33, employeeId: 2, date: '2026-02-26', startHour:  8.5, endHour: 15   },
  { id: 34, employeeId: 2, date: '2026-02-27', startHour:  8,   endHour: 15   },
  { id: 35, employeeId: 2, date: '2026-02-28', startHour:  8,   endHour: 16   },
  // Emp 3 — 35.5h
  { id: 36, employeeId: 3, date: '2026-02-24', startHour:  9,   endHour: 16.5 },
  { id: 37, employeeId: 3, date: '2026-02-25', startHour: 10,   endHour: 17   },
  { id: 38, employeeId: 3, date: '2026-02-26', startHour:  9,   endHour: 16   },
  { id: 39, employeeId: 3, date: '2026-02-27', startHour:  9.5, endHour: 16.5 },
  { id: 40, employeeId: 3, date: '2026-02-28', startHour:  9,   endHour: 16   },
  // Emp 4 — 37h
  { id: 41, employeeId: 4, date: '2026-02-24', startHour:  7,   endHour: 15   },
  { id: 42, employeeId: 4, date: '2026-02-25', startHour:  7,   endHour: 15   },
  { id: 43, employeeId: 4, date: '2026-02-26', startHour:  7,   endHour: 14   },
  { id: 44, employeeId: 4, date: '2026-02-27', startHour:  7,   endHour: 14   },
  { id: 45, employeeId: 4, date: '2026-02-28', startHour:  7,   endHour: 14   },
  // Emp 5 — 33.5h
  { id: 46, employeeId: 5, date: '2026-02-24', startHour: 12,   endHour: 18.5 },
  { id: 47, employeeId: 5, date: '2026-02-25', startHour: 13,   endHour: 20   },
  { id: 48, employeeId: 5, date: '2026-02-26', startHour: 12,   endHour: 19   },
  { id: 49, employeeId: 5, date: '2026-02-27', startHour: 13,   endHour: 20   },
  { id: 50, employeeId: 5, date: '2026-02-28', startHour: 13,   endHour: 19   },

  // ── Semaine 2 : 02/03 – 08/03, Mar–Sam ──────────────────────────────────
  // Emp 1 — 36.5h
  { id: 51, employeeId: 1, date: '2026-03-03', startHour:  7,   endHour: 14.5 },
  { id: 52, employeeId: 1, date: '2026-03-04', startHour:  7.5, endHour: 15   },
  { id: 53, employeeId: 1, date: '2026-03-05', startHour:  7,   endHour: 14   },
  { id: 54, employeeId: 1, date: '2026-03-06', startHour:  8,   endHour: 15   },
  { id: 55, employeeId: 1, date: '2026-03-07', startHour:  8.5, endHour: 16   },
  // Emp 2 — 34h
  { id: 56, employeeId: 2, date: '2026-03-03', startHour:  7,   endHour: 12   },
  { id: 57, employeeId: 2, date: '2026-03-04', startHour:  8,   endHour: 15   },
  { id: 58, employeeId: 2, date: '2026-03-05', startHour:  8,   endHour: 15   },
  { id: 59, employeeId: 2, date: '2026-03-06', startHour:  8,   endHour: 15   },
  { id: 60, employeeId: 2, date: '2026-03-07', startHour:  8,   endHour: 16   },
  // Emp 3 — 35.5h
  { id: 61, employeeId: 3, date: '2026-03-03', startHour:  9,   endHour: 16   },
  { id: 62, employeeId: 3, date: '2026-03-04', startHour: 10,   endHour: 17.5 },
  { id: 63, employeeId: 3, date: '2026-03-05', startHour:  9,   endHour: 16   },
  { id: 64, employeeId: 3, date: '2026-03-06', startHour: 10,   endHour: 17   },
  { id: 65, employeeId: 3, date: '2026-03-07', startHour:  9,   endHour: 16   },
  // Emp 4 — 37h
  { id: 66, employeeId: 4, date: '2026-03-03', startHour:  7,   endHour: 15   },
  { id: 67, employeeId: 4, date: '2026-03-04', startHour:  7,   endHour: 14.5 },
  { id: 68, employeeId: 4, date: '2026-03-05', startHour:  7,   endHour: 14   },
  { id: 69, employeeId: 4, date: '2026-03-06', startHour:  7,   endHour: 14   },
  { id: 70, employeeId: 4, date: '2026-03-07', startHour:  7.5, endHour: 15   },
  // Emp 5 — 34.5h
  { id: 71, employeeId: 5, date: '2026-03-03', startHour: 12,   endHour: 19   },
  { id: 72, employeeId: 5, date: '2026-03-04', startHour: 12,   endHour: 19.5 },
  { id: 73, employeeId: 5, date: '2026-03-05', startHour: 13,   endHour: 20   },
  { id: 74, employeeId: 5, date: '2026-03-06', startHour: 12,   endHour: 19   },
  { id: 75, employeeId: 5, date: '2026-03-07', startHour: 13,   endHour: 19   },

  // ── Semaine 3 (courante) : 09/03 – 15/03, Mar–Sam ───────────────────────
  // Emp 1 — 35h
  { id: 76, employeeId: 1, date: '2026-03-10', startHour:  7,   endHour: 14   },
  { id: 77, employeeId: 1, date: '2026-03-11', startHour:  7.5, endHour: 14.5 },
  { id: 78, employeeId: 1, date: '2026-03-12', startHour:  8,   endHour: 15   },
  { id: 79, employeeId: 1, date: '2026-03-13', startHour:  7,   endHour: 14   },
  { id: 80, employeeId: 1, date: '2026-03-14', startHour:  8,   endHour: 15   },
  // Emp 2 — 34h
  { id: 81, employeeId: 2, date: '2026-03-10', startHour:  7,   endHour: 12   },
  { id: 82, employeeId: 2, date: '2026-03-11', startHour:  8,   endHour: 15   },
  { id: 83, employeeId: 2, date: '2026-03-12', startHour:  9,   endHour: 16   },
  { id: 84, employeeId: 2, date: '2026-03-13', startHour:  8,   endHour: 15   },
  { id: 85, employeeId: 2, date: '2026-03-14', startHour:  8,   endHour: 16   },
  // Emp 3 — 35h
  { id: 86, employeeId: 3, date: '2026-03-10', startHour:  9,   endHour: 16   },
  { id: 87, employeeId: 3, date: '2026-03-11', startHour: 10,   endHour: 17   },
  { id: 88, employeeId: 3, date: '2026-03-12', startHour:  9.5, endHour: 16.5 },
  { id: 89, employeeId: 3, date: '2026-03-13', startHour: 10,   endHour: 17   },
  { id: 90, employeeId: 3, date: '2026-03-14', startHour:  9,   endHour: 16   },
  // Emp 4 — 36h
  { id: 91, employeeId: 4, date: '2026-03-10', startHour:  7,   endHour: 15   },
  { id: 92, employeeId: 4, date: '2026-03-11', startHour:  7,   endHour: 14   },
  { id: 93, employeeId: 4, date: '2026-03-12', startHour:  7,   endHour: 14   },
  { id: 94, employeeId: 4, date: '2026-03-13', startHour:  7,   endHour: 14   },
  { id: 95, employeeId: 4, date: '2026-03-14', startHour:  7.5, endHour: 14.5 },
  // Emp 5 — 35h
  { id: 96, employeeId: 5, date: '2026-03-10', startHour: 12,   endHour: 19   },
  { id: 97, employeeId: 5, date: '2026-03-11', startHour: 13,   endHour: 20   },
  { id: 98, employeeId: 5, date: '2026-03-12', startHour: 12,   endHour: 19   },
  { id: 99, employeeId: 5, date: '2026-03-13', startHour: 12,   endHour: 19   },
  { id: 100, employeeId: 5, date: '2026-03-14', startHour: 13,  endHour: 20   },
]

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useSchedule() {
  // Priorité : sessionStorage → données démo
  const [shifts, setShifts] = useState(() => sessionLoad('shifts') ?? DEMO)

  // Compteur d'ID unique — évite les collisions quand plusieurs shifts
  // sont ajoutés dans le même tick (ex : coller un planning entier)
  const nextId    = useRef(null)
  const saveTimer = useRef(null)

  // Initialise nextId d'après les shifts courants (session ou démo)
  if (nextId.current === null) {
    const cur = shifts.length ? Math.max(...shifts.map(s => s.id)) : 0
    nextId.current = cur + 1
  }

  // Auto-save : debounce 500ms après chaque modification
  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => sessionSave('shifts', shifts), 500)
    return () => clearTimeout(saveTimer.current)
  }, [shifts])

  function addShift(employeeId, dateStr, startHour, endHour, pause = 0, type = 'work', extra = {}) {
    const id = nextId.current++
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
    nextId.current = Math.max(...DEMO.map(s => s.id)) + 1
    setShifts(DEMO)
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
