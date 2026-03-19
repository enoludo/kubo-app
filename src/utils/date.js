// ─── Utilitaires de dates et heures ──────────────────────────────────────────
// Source de vérité unique pour toutes les fonctions de calcul/formatage de dates.
// Importer depuis ce module — ne pas redéfinir localement.

// ── Conversions ──────────────────────────────────────────────────────────────

/** Date → "YYYY-MM-DD" en heure locale (évite les décalages UTC) */
export function dateToStr(d) {
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** "YYYY-MM-DD" → lundi de la semaine, retourné en "YYYY-MM-DD" */
export function mondayOf(dateStr) {
  const d = new Date(dateStr + 'T00:00:00'), day = d.getDay(), mon = new Date(d)
  mon.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return dateToStr(mon)
}

/** "YYYY-MM-DD" (lundi) → tableau de 7 objets Date (Lun → Dim) */
export function weekDatesFromMonday(mondayStr) {
  const mon = new Date(mondayStr + 'T00:00:00')
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d
  })
}

// ── Numéro de semaine ISO 8601 ────────────────────────────────────────────────

/** Date → numéro de semaine ISO 8601 */
export function isoWeek(date) {
  const d  = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const y1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - y1) / 86400000 + 1) / 7)
}

/** Tableau de 7 Date → nom de l'onglet Google Sheets ("Semaine W - JJ/MM/YYYY") */
export function weekSheetName(weekDates) {
  const mon = weekDates[0]
  return `Semaine ${isoWeek(mon)} - ${String(mon.getDate()).padStart(2, '0')}/${String(mon.getMonth() + 1).padStart(2, '0')}/${mon.getFullYear()}`
}

// ── Formatage des heures ──────────────────────────────────────────────────────

/** h (nombre) → "HH:30" / "HH:00" — séparateur `:` pour les <select> */
export function fmtH(h) {
  return `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 === 0.5 ? '30' : '00'}`
}

/** h (nombre) → "HHh30" / "HHh00" — séparateur `h` pour l'affichage */
export function fmtTime(h) {
  return `${String(Math.floor(h)).padStart(2, '0')}h${h % 1 === 0.5 ? '30' : '00'}`
}

/** Date → "JJ/MM" */
export function fmtDate(date) {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}`
}
