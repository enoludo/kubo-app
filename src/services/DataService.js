// ─── DataService — Interface abstraite + Factory ──────────────────────────────
//
// Pattern Adapter : abstrait la source de données (Google Sheets, REST API…)
// L'adapter actif est un singleton module-level géré par setDataService / clearDataService.
//
// Interface DataService :
//
//   Lecture
//     getShifts(weekDates, team)                  → Promise<shift[]>
//     getEmployees(existingTeam)                  → Promise<employee[]>
//     getWeeks()                                  → Promise<string[]>
//
//   Écriture unitaire  (CRUD — prêt pour futur backend REST)
//     saveShift(shift)                            → Promise<void>
//     updateShift(shiftId, updates)               → Promise<void>
//     deleteShift(shiftId)                        → Promise<void>
//     saveEmployee(employee)                      → Promise<void>
//     updateEmployee(employeeId, updates)         → Promise<void>
//     deleteEmployee(employeeId)                  → Promise<void>
//
//   Écriture bulk  (sync Google Sheets — utilisée par useGoogleSync)
//     saveWeekShifts(weekDates, allShifts, team)  → Promise<void>
//     saveEmployees(team)                         → Promise<void>

import { LocalAdapter } from './adapters/LocalAdapter'

let _adapter = null

/**
 * Retourne l'adapter actif.
 * Fallback sur LocalAdapter si aucun adapter n'a été configuré (mode hors-ligne).
 * @returns {object}
 */
export function getDataService() {
  return _adapter ?? new LocalAdapter()
}

/**
 * Définit l'adapter actif.
 * Appelé par useGoogleSync après une connexion OAuth réussie.
 * @param {object} adapter
 */
export function setDataService(adapter) {
  _adapter = adapter
}

/**
 * Réinitialise l'adapter actif.
 * Appelé par useGoogleSync à la déconnexion ou à l'expiration du token.
 * Après cet appel, getDataService() retourne un nouveau LocalAdapter.
 */
export function clearDataService() {
  _adapter = null
}
