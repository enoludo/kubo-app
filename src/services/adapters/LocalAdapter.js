// ─── LocalAdapter ─────────────────────────────────────────────────────────────
//
// Implémente l'interface DataService en lisant depuis sessionStorage.
// Utilisé automatiquement quand Google Sheets n'est pas connecté (fallback).
//
// Lecture  : retourne les données sauvegardées par useSchedule + session.js.
// Écriture : no-op — useSchedule + session.js gèrent déjà la persistance locale.

import { sessionLoad } from '../../utils/session'
import { dateToStr, mondayOf } from '../../utils/date'

export class LocalAdapter {
  // ── Lecture ────────────────────────────────────────────────────────────────

  async getShifts(weekDates) {
    const allShifts = sessionLoad('shifts') ?? []
    if (!weekDates) return allShifts
    const strs = new Set(weekDates.map(dateToStr))
    return allShifts.filter(s => strs.has(s.date))
  }

  async getEmployees(existingTeam = []) {
    return sessionLoad('team') ?? existingTeam
  }

  async getWeeks() {
    const allShifts = sessionLoad('shifts') ?? []
    return [...new Set(allShifts.map(s => mondayOf(s.date)))]
  }

  // ── Écriture unitaire ──────────────────────────────────────────────────────
  // No-op : useSchedule + session.js gèrent la persistance locale.

  async saveShift()        {}
  async updateShift()      {}
  async deleteShift()      {}
  async saveEmployee()     {}
  async updateEmployee()   {}
  async deleteEmployee()   {}

  // ── Écriture bulk ──────────────────────────────────────────────────────────
  // No-op : useSchedule (debounce 500ms → sessionStorage) gère déjà ça.

  async saveWeekShifts()   {}
  async saveEmployees()    {}
}
