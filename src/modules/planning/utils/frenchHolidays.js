// ── Calcul des jours fériés français ─────────────────────────────────────────
// Algorithme de Pâques : méthode de Butcher/Meeus

function easterSunday(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1  // 0-indexed
  const day   = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function buildHolidaysForYear(year) {
  const easter = easterSunday(year)
  const holidays = {}

  // Fixes
  holidays[`${year}-01-01`] = 'Jour de l\'An'
  holidays[`${year}-05-01`] = 'Fête du Travail'
  holidays[`${year}-05-08`] = 'Victoire 1945'
  holidays[`${year}-07-14`] = 'Fête Nationale'
  holidays[`${year}-08-15`] = 'Assomption'
  holidays[`${year}-11-01`] = 'Toussaint'
  holidays[`${year}-11-11`] = 'Armistice'
  holidays[`${year}-12-25`] = 'Noël'

  // Mobiles (relatifs à Pâques)
  holidays[toKey(addDays(easter, 1))]   = 'Lundi de Pâques'
  holidays[toKey(addDays(easter, 39))]  = 'Ascension'
  holidays[toKey(addDays(easter, 49))]  = 'Dimanche de Pentecôte'
  holidays[toKey(addDays(easter, 50))]  = 'Lundi de Pentecôte'

  return holidays
}

// Cache des deux années courante + suivante
let _cache = null
let _cacheYear = null

function getHolidayMap() {
  const now = new Date().getFullYear()
  if (_cache && _cacheYear === now) return _cache
  _cache = {
    ...buildHolidaysForYear(now),
    ...buildHolidaysForYear(now + 1),
  }
  _cacheYear = now
  return _cache
}

/**
 * Retourne le nom du férié pour une date donnée, ou null.
 * @param {Date|string} date — objet Date ou string "YYYY-MM-DD"
 * @returns {string|null}
 */
export function getHolidayName(date) {
  const key = typeof date === 'string' ? date : toKey(date)
  return getHolidayMap()[key] ?? null
}

/**
 * Retourne true si la date est un jour férié.
 */
export function isHoliday(date) {
  return getHolidayName(date) !== null
}
