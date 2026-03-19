// ─── Migration des IDs entiers → UUIDs ────────────────────────────────────────
//
// Appelée une seule fois au démarrage (dans main.jsx, avant createRoot).
// Lit sessionStorage, détecte les IDs numériques, les remplace par des UUIDs,
// et met à jour sessionStorage avant que React initialise les états.
//
// Cas couverts :
//  1. Team + shifts en session avec IDs entiers (données DEMO ou utilisateur)
//  2. Shifts seuls (team absente) — seuls les shift IDs sont migrés

export function migrateSessionIds() {
  try {
    const rawTeam   = sessionStorage.getItem('kubo_team')
    const rawShifts = sessionStorage.getItem('kubo_shifts')
    if (!rawTeam && !rawShifts) return

    const team   = rawTeam   ? JSON.parse(rawTeam)   : null
    const shifts = rawShifts ? JSON.parse(rawShifts) : null

    const teamNeedsUpdate  = team   && team.some(e   => typeof e.id          === 'number')
    const shiftIdsNeedUpdate = shifts && shifts.some(s => typeof s.id          === 'number')
    const empIdsNeedUpdate = shifts && shifts.some(s => typeof s.employeeId  === 'number')

    if (!teamNeedsUpdate && !shiftIdsNeedUpdate && !empIdsNeedUpdate) return

    // ── Migration des IDs employés ─────────────────────────────────────────
    // Construit un mapping old_numeric_id → new_uuid pour corriger les références
    // dans les shifts après migration de l'équipe.
    const empIdMap = {}
    const migratedTeam = team ? team.map(e => {
      if (typeof e.id === 'number') {
        const newId = crypto.randomUUID()
        empIdMap[e.id] = newId
        return { ...e, id: newId }
      }
      return e
    }) : null

    // ── Migration des shifts ───────────────────────────────────────────────
    const migratedShifts = shifts ? shifts.map(s => ({
      ...s,
      id: typeof s.id === 'number'
        ? crypto.randomUUID()
        : s.id,
      employeeId: typeof s.employeeId === 'number' && empIdMap[s.employeeId]
        ? empIdMap[s.employeeId]
        : s.employeeId,
    })) : null

    if (migratedTeam)   sessionStorage.setItem('kubo_team',   JSON.stringify(migratedTeam))
    if (migratedShifts) sessionStorage.setItem('kubo_shifts', JSON.stringify(migratedShifts))
  } catch {
    // Echec silencieux — l'app se charge avec les données existantes
  }
}
