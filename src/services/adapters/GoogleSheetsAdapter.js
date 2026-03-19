// ─── GoogleSheetsAdapter ──────────────────────────────────────────────────────
//
// Implémente l'interface DataService en déléguant à googleSheets.js.
// googleSheets.js reste intact et n'est appelé que depuis cet adapter.
//
// Le token OAuth est reçu via un useRef (React.MutableRefObject) afin d'éviter
// les stale closures dans les callbacks asynchrones de useGoogleSync.

import {
  writeWeekToSheet, readWeekFromSheet,
  writeTeamToSheet, readTeamFromSheet,
  listSheets,
} from '../googleSheets'

export class GoogleSheetsAdapter {
  /**
   * @param {React.MutableRefObject<string|null>} tokenRef
   */
  constructor(tokenRef) {
    this.tokenRef = tokenRef
  }

  get token() {
    return this.tokenRef.current
  }

  // ── Lecture ────────────────────────────────────────────────────────────────

  async getShifts(weekDates, team) {
    return readWeekFromSheet(this.token, weekDates, team)
  }

  async getEmployees(existingTeam = []) {
    return readTeamFromSheet(this.token, existingTeam)
  }

  async getWeeks() {
    return listSheets(this.token)
  }

  // ── Écriture bulk (utilisée par useGoogleSync) ─────────────────────────────

  async saveWeekShifts(weekDates, allShifts, team) {
    return writeWeekToSheet(this.token, weekDates, allShifts, team)
  }

  async saveEmployees(team) {
    return writeTeamToSheet(this.token, team)
  }

  // ── Écriture unitaire (CRUD — prêt pour futur backend REST) ────────────────
  //
  // Avec Sheets, un shift ne peut pas être modifié isolément :
  // l'API requiert une réécriture complète de la semaine.
  // Ces méthodes sont réservées à un usage futur (backend REST ou hook dédié)
  // et lèvent une erreur explicite si appelées dans le contexte actuel.

  async saveShift() {
    throw new Error(
      'GoogleSheetsAdapter: saveShift requiert un contexte de semaine — utilisez saveWeekShifts'
    )
  }

  async updateShift() {
    throw new Error(
      'GoogleSheetsAdapter: updateShift requiert un contexte de semaine — utilisez saveWeekShifts'
    )
  }

  async deleteShift() {
    throw new Error(
      'GoogleSheetsAdapter: deleteShift requiert un contexte de semaine — utilisez saveWeekShifts'
    )
  }

  async saveEmployee() {
    throw new Error(
      'GoogleSheetsAdapter: saveEmployee requiert la liste complète — utilisez saveEmployees'
    )
  }

  async updateEmployee() {
    throw new Error(
      'GoogleSheetsAdapter: updateEmployee requiert la liste complète — utilisez saveEmployees'
    )
  }

  async deleteEmployee() {
    throw new Error(
      'GoogleSheetsAdapter: deleteEmployee requiert la liste complète — utilisez saveEmployees'
    )
  }
}
