// ─── Google Sheets REST API v4 ────────────────────────────────────────────────
// Accès direct via fetch() + token OAuth. Pas de googleapis (Node.js only).
//
// Structure d'une feuille semaine :
//  Visible  — A (employé) | B-H (formules jour) | I (balance) | J (solde cumulé)
//  Caché    — Pour chaque jour d (0-6) :
//             col 10+d*5+0 : Type    (dropdown)
//             col 10+d*5+1 : Début   (dropdown 04h00→21h00 ½h)
//             col 10+d*5+2 : Fin     (dropdown)
//             col 10+d*5+3 : Pause   (dropdown)
//             col 10+d*5+4 : Validé  (checkbox BOOLEAN)
//  Colonnes K–AS masquées, groupées, éditables manuellement si besoin.

import { START_HOUR, END_HOUR } from '../modules/planning/hooks/useSchedule'
import { dateToStr, fmtTime, mondayOf, weekDatesFromMonday, weekSheetName } from '../utils/date'
import { getTypeColor } from '../utils/theme'

export { mondayOf, weekDatesFromMonday, weekSheetName } from '../utils/date'

const SHEET_ID    = import.meta.env.VITE_GOOGLE_SHEET_ID
const BASE        = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`
const DAYS_FR     = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const HIDDEN_START = 10   // colonne K
const COLS_PER_DAY = 5   // Type, Début, Fin, Pause, Validé
const HIDDEN_END   = HIDDEN_START + 7 * COLS_PER_DAY  // 45 (exclusive)
const DEFAULT_REST = new Set([0, 6])  // Lundi, Dimanche — repos par défaut dans le Sheet

// Dropdown options
const TYPE_OPTIONS  = ['Travaillé', 'Congés', 'Absent', 'Repos', 'Arrêt maladie', 'École']
const PAUSE_OPTIONS = ['Aucune', '15min', '30min', '45min', '1h', '1h30', '2h']
const TIME_OPTIONS  = (() => {
  const opts = []
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    opts.push(`${String(h).padStart(2, '0')}h00`)
    if (h < END_HOUR) opts.push(`${String(h).padStart(2, '0')}h30`)
  }
  return opts
})()

const TYPE_TO_LABEL = {
  work: 'Travaillé', leave: 'Congés', absent: 'Absent',
  rest: 'Repos', sick: 'Arrêt maladie', school: 'École',
}
const LABEL_TO_TYPE = Object.fromEntries(
  Object.entries(TYPE_TO_LABEL).map(([k, v]) => [v, k])
)

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function call(method, path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const e   = await res.json().catch(() => ({}))
    const msg = e?.error?.message ?? `HTTP ${res.status}`
    throw Object.assign(new Error(msg), { status: res.status })
  }
  return res.json()
}

// ─── Sheet management ────────────────────────────────────────────────────────

async function listSheetsMeta(token) {
  const data = await call('GET', '?fields=sheets.properties', token)
  return (data.sheets ?? []).map(s => ({
    title: s.properties.title, sheetId: s.properties.sheetId,
  }))
}

export async function listSheets(token) {
  return (await listSheetsMeta(token)).map(s => s.title)
}

export async function ensureSheet(token, title) {
  const meta     = await listSheetsMeta(token)
  const existing = meta.find(s => s.title === title)
  if (existing) return existing.sheetId
  const res = await call('POST', ':batchUpdate', token, {
    requests: [{ addSheet: { properties: { title } } }],
  })
  return res.replies[0].addSheet.properties.sheetId
}

export async function readValues(token, range) {
  const data = await call('GET',
    `/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE`, token)
  return data.values ?? []
}

// inputOption: 'RAW' (default) | 'USER_ENTERED' (pour formules et booleans)
export async function writeValues(token, range, values, inputOption = 'RAW') {
  await call('PUT',
    `/values/${encodeURIComponent(range)}?valueInputOption=${inputOption}`,
    token, { range, majorDimension: 'ROWS', values })
}

export async function clearRange(token, range) {
  await call('POST', `/values/${encodeURIComponent(range)}:clear`, token, {})
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  return {
    red:   parseInt(hex.slice(1, 3), 16) / 255,
    green: parseInt(hex.slice(3, 5), 16) / 255,
    blue:  parseInt(hex.slice(5, 7), 16) / 255,
  }
}

function blendOnWhite(hex, opacity) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return {
    red:   opacity * (r / 255) + (1 - opacity),
    green: opacity * (g / 255) + (1 - opacity),
    blue:  opacity * (b / 255) + (1 - opacity),
  }
}

function shiftBgColor(type, validated) {
  return blendOnWhite(getTypeColor(type), validated ? 0.2 : 0.4)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseH(s) {
  if (s == null || s === '') return 0
  const str = String(s)
  if (str.includes('h')) { const [h, m] = str.split('h').map(Number); return h + (m === 30 ? 0.5 : 0) }
  if (str.includes(':')) { const [h, m] = str.split(':').map(Number); return h + (m === 30 ? 0.5 : 0) }
  return Number(str) || 0
}

function parseBool(v) {
  return v === true || v === 'TRUE' || v === 'true' || v === 1
}

function fmtPause(hours) {
  if (!hours) return 'Aucune'
  const map = { 0.25: '15min', 0.5: '30min', 0.75: '45min', 1: '1h', 1.5: '1h30', 2: '2h' }
  return map[hours] ?? `${Math.round(hours * 60)}min`
}

function parsePause(str) {
  if (!str || str === 'Aucune') return 0
  const map = { '15min': 0.25, '30min': 0.5, '45min': 0.75, '1h': 1, '1h30': 1.5, '2h': 2 }
  if (map[str] !== undefined) return map[str]
  const m = str.match(/^(\d+)min$/);  if (m) return parseInt(m[1]) / 60
  const h = str.match(/^(\d+)h(\d*)$/); if (h) return parseInt(h[1]) + (h[2] ? parseInt(h[2]) / 60 : 0)
  return 0
}

// ─── Column letter helper ─────────────────────────────────────────────────────

function colLetter(index) {
  let result = '', n = index + 1
  while (n > 0) { n--; result = String.fromCharCode(65 + (n % 26)) + result; n = Math.floor(n / 26) }
  return result
}

// ─── Hidden columns data ──────────────────────────────────────────────────────

// shift → 5 values [Type, Début, Fin, Pause, Validé]
function shiftToHiddenCols(shift) {
  if (!shift) return ['', '', '', 'Aucune', false]
  const type  = shift.type ?? 'work'
  const label = TYPE_TO_LABEL[type] ?? 'Travaillé'
  if (type === 'work' || type === 'absent') {
    return [label, fmtTime(shift.startHour), fmtTime(shift.endHour), fmtPause(shift.pause), shift.validated ?? false]
  }
  return [label, '', '', 'Aucune', shift.validated ?? false]
}

// 5 hidden col values → shift object (returns null if empty)
function hiddenColsToShift(cols, employeeId, date, id) {
  const typeLabel = cols[0]
  if (!typeLabel || typeLabel === '') return null
  const type        = LABEL_TO_TYPE[String(typeLabel)] ?? 'work'
  const isValidated = parseBool(cols[4])
  if (type === 'work' || type === 'absent') {
    return {
      id, employeeId, date,
      startHour: parseH(String(cols[1] ?? '')),
      endHour:   parseH(String(cols[2] ?? '')),
      pause:     parsePause(String(cols[3] ?? '')),
      type, validated: isValidated,
    }
  }
  return { id, employeeId, date, startHour: 0, endHour: 0, pause: 0, type, validated: isValidated }
}

// Durée effective formatée (ex. 7h30)
function fmtDur(start, end, pause) {
  const dur = (end - start) - (pause ?? 0)
  if (dur <= 0) return null
  const h = Math.floor(dur)
  const m = Math.round((dur - h) * 60)
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

// Texte affiché dans une cellule jour — valeur directe (pas de formule)
function shiftCellText(shift) {
  const type      = shift.type ?? 'work'
  const validated = shift.validated ?? false
  let text

  if (type === 'work') {
    const parts = [`${fmtTime(shift.startHour)} → ${fmtTime(shift.endHour)}`]
    if (shift.pause) parts.push(`Pause ${fmtPause(shift.pause)}`)
    const dur = fmtDur(shift.startHour, shift.endHour, shift.pause)
    if (dur) parts.push(`${dur} eff.`)
    text = parts.join(' | ')
  } else if (type === 'leave') {
    text = '🌴 Congés — Journée entière'
  } else if (type === 'absent') {
    text = `⚠ Absent — ${fmtTime(shift.startHour)} → ${fmtTime(shift.endHour)}`
  } else if (type === 'school') {
    text = shift.schoolAbsenceDuration
      ? `📚 École — Absent ${shift.schoolAbsenceDuration}`
      : '📚 École'
  } else if (type === 'rest') {
    text = 'Repos'
  } else if (type === 'sick') {
    text = 'Arrêt maladie'
  } else {
    text = TYPE_TO_LABEL[type] ?? 'Travaillé'
  }

  return validated ? `✓ ${text}` : text
}

// 2D array for writing to K2:AS(n+1)
function buildHiddenColValues(activeTeam, weekDates, allShifts) {
  const strs     = new Set(weekDates.map(dateToStr))
  const wkShifts = allShifts.filter(s => strs.has(s.date))
  return activeTeam.map(emp => {
    const row = []
    weekDates.forEach((date, di) => {
      const shift = wkShifts.find(s => s.employeeId === emp.id && s.date === dateToStr(date))
      if (!shift && DEFAULT_REST.has(di)) {
        row.push('Repos', '', '', 'Aucune', false)
      } else {
        row.push(...shiftToHiddenCols(shift))
      }
    })
    return row
  })
}

// Parse hidden col rows back into shift objects
// Matching par position (index) : même ordre que buildHiddenColValues → activeTeam[ri-1]
// Robuste aux renommages d'employés (P2 : plus de find-by-name)
function parseHiddenRows(empRows, hiddenRows, team, weekDates) {
  if (!empRows || empRows.length < 2) return []
  const colDates   = weekDates.map(dateToStr)
  const activeTeam = team.filter(e => !e.archived)
  const shifts     = []

  for (let ri = 1; ri < empRows.length; ri++) {
    // Index-based : la ligne ri correspond à activeTeam[ri-1]
    // même ordre que buildHiddenColValues qui itère activeTeam.map(...)
    const emp = activeTeam[ri - 1]
    if (!emp) continue

    const hiddenRow = hiddenRows[ri] ?? []
    for (let di = 0; di < 7; di++) {
      const cols  = hiddenRow.slice(di * COLS_PER_DAY, di * COLS_PER_DAY + COLS_PER_DAY)
      if (!cols[0]) continue
      const shift = hiddenColsToShift(cols, emp.id, colDates[di], crypto.randomUUID())
      if (shift) shifts.push(shift)
    }
  }
  return shifts
}

// ─── Balance helpers ──────────────────────────────────────────────────────────

function computeWeeklyBalance(employee, weekDates, allShifts) {
  const strs   = new Set(weekDates.map(dateToStr))
  const worked = allShifts
    .filter(s => s.employeeId === employee.id && strs.has(s.date) && (s.type ?? 'work') === 'work')
    .reduce((sum, s) => sum + (s.endHour - s.startHour - (s.pause ?? 0)), 0)
  return worked - (employee.contract ?? 35)
}

function computeCumulativeBalance(employee, allShifts) {
  const mondays = [...new Set(
    allShifts.filter(s => s.employeeId === employee.id).map(s => mondayOf(s.date))
  )]
  return (employee.startBalance ?? 0) + mondays.reduce((sum, mon) =>
    sum + computeWeeklyBalance(employee, weekDatesFromMonday(mon), allShifts), 0)
}

function formatBalance(hours, zeroLabel = 'À jour') {
  if (hours === 0) return zeroLabel
  const sign = hours > 0 ? '+' : '−'
  const abs  = Math.abs(hours), h = Math.floor(abs), m = Math.round((abs - h) * 60)
  return `${sign}${h}h${m > 0 ? String(m).padStart(2, '0') : ''}`
}

function balanceColors(balance) {
  if (balance > 0) return { bg: blendOnWhite(getTypeColor('rest'), 0.3), fg: hexToRgb('#1A6B3A') }
  if (balance < 0) return { bg: blendOnWhite('#F39C12', 0.25), fg: hexToRgb('#B06A00') }
  return { bg: blendOnWhite(getTypeColor('rest'), 0.2), fg: hexToRgb('#1A6B3A') }
}

// ─── Signature ID-indépendante ────────────────────────────────────────────────

export function shiftsSig(shifts) {
  return JSON.stringify(
    [...shifts]
      .sort((a, b) => String(a.employeeId).localeCompare(String(b.employeeId)) || a.date.localeCompare(b.date))
      .map(s => ({
        employeeId: s.employeeId, date: s.date,
        startHour: s.startHour, endHour: s.endHour,
        pause: s.pause ?? 0, type: s.type ?? 'work',
        validated: !!s.validated,
        schoolAbsence: !!s.schoolAbsence, schoolAbsenceDuration: s.schoolAbsenceDuration ?? '',
      }))
  )
}

// ─── Team conversion ──────────────────────────────────────────────────────────

const TEAM_HDR = ['id', 'nom', 'poste', 'couleur', 'contrat', 'soldeInitial', 'archivé']

export function teamToRows(team) {
  return [TEAM_HDR, ...team.map(e => [
    e.id, e.name, e.role, e.color ?? '#A8D5B5', e.contract ?? 35, e.startBalance ?? 0,
    e.archived ? 'true' : 'false',
  ])]
}

export function rowsToTeam(rows, existingTeam = []) {
  if (!rows || rows.length < 2) return existingTeam
  return rows.slice(1).filter(r => r[0] != null && r[0] !== '').map(r => {
    const existing = existingTeam.find(e => e.id === String(r[0])) ?? {}
    return {
      ...existing,
      id: String(r[0]), name: String(r[1] ?? ''), role: String(r[2] ?? ''),
      color: String(r[3] ?? '#A8D5B5'), contract: Number(r[4] ?? 35),
      startBalance: Number(r[5] ?? 0), archived: parseBool(r[6]),
    }
  })
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function rangeFmt(sheetId, r0, r1, c0, c1, fmt) {
  return {
    repeatCell: {
      range:  { sheetId, startRowIndex: r0, endRowIndex: r1, startColumnIndex: c0, endColumnIndex: c1 },
      cell:   { userEnteredFormat: fmt },
      fields: `userEnteredFormat(${Object.keys(fmt).join(',')})`,
    },
  }
}

function cellFmt(sheetId, r, c, fmt) { return rangeFmt(sheetId, r, r + 1, c, c + 1, fmt) }

const BORDER_THIN = { style: 'SOLID', color: hexToRgb('#DDDDDD') }

function allBorders(sheetId, r0, r1, c0, c1) {
  return {
    updateBorders: {
      range: { sheetId, startRowIndex: r0, endRowIndex: r1, startColumnIndex: c0, endColumnIndex: c1 },
      top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN,
      innerHorizontal: BORDER_THIN, innerVertical: BORDER_THIN,
    },
  }
}

function dropdownValidation(sheetId, r0, r1, c0, c1, values) {
  return {
    setDataValidation: {
      range: { sheetId, startRowIndex: r0, endRowIndex: r1, startColumnIndex: c0, endColumnIndex: c1 },
      rule: {
        condition: { type: 'ONE_OF_LIST', values: values.map(v => ({ userEnteredValue: v })) },
        showCustomUi: true, strict: false,
      },
    },
  }
}

function checkboxValidation(sheetId, r0, r1, c0, c1) {
  return {
    setDataValidation: {
      range: { sheetId, startRowIndex: r0, endRowIndex: r1, startColumnIndex: c0, endColumnIndex: c1 },
      rule: { condition: { type: 'BOOLEAN' }, showCustomUi: true },
    },
  }
}

// ─── Week sheet formatting ────────────────────────────────────────────────────

async function formatWeekSheet(token, sheetId, team, weekDates, allShifts) {
  const activeTeam = team.filter(e => !e.archived)
  const strs       = new Set(weekDates.map(dateToStr))
  const wkShifts   = allShifts.filter(s => strs.has(s.date))
  const nRows      = activeTeam.length + 1

  const requests = []

  // En-tête (A-J visible + K-AS hidden)
  requests.push(rangeFmt(sheetId, 0, 1, 0, HIDDEN_END, {
    backgroundColor: hexToRgb('#18100A'),
    textFormat: { bold: true, foregroundColor: hexToRgb('#C9A84C'), fontSize: 10 },
    horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
  }))

  if (activeTeam.length > 0) {
    // Colonne A : employés
    requests.push(rangeFmt(sheetId, 1, nRows, 0, 1, {
      backgroundColor: hexToRgb('#F5F4F9'),
      textFormat: { bold: true, fontSize: 9 }, verticalAlignment: 'MIDDLE', wrapStrategy: 'WRAP',
    }))

    // Colonnes B-H : cellules jour (formules)
    requests.push(rangeFmt(sheetId, 1, nRows, 1, 8, {
      backgroundColor: { red: 1, green: 1, blue: 1 },
      horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
      wrapStrategy: 'WRAP', textFormat: { fontSize: 9 },
    }))

    // Couleur de fond par shift (+ Repos par défaut Lundi/Dimanche)
    activeTeam.forEach((emp, ri) => {
      weekDates.forEach((date, ci) => {
        const shift = wkShifts.find(s => s.employeeId === emp.id && s.date === dateToStr(date))
        const bg = shift
          ? shiftBgColor(shift.type, shift.validated)
          : DEFAULT_REST.has(ci) ? blendOnWhite(getTypeColor('rest'), 0.4) : null
        if (!bg) return
        requests.push(cellFmt(sheetId, ri + 1, ci + 1, {
          backgroundColor: bg,
          horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
          wrapStrategy: 'WRAP', textFormat: { fontSize: 9 },
        }))
      })
    })

    // Colonnes I-J : balances
    requests.push(rangeFmt(sheetId, 1, nRows, 8, 10, {
      backgroundColor: { red: 1, green: 1, blue: 1 },
      horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
      textFormat: { bold: true, fontSize: 9 }, wrapStrategy: 'WRAP',
    }))
    activeTeam.forEach((emp, ri) => {
      const wc = balanceColors(computeWeeklyBalance(emp, weekDates, allShifts))
      const cc = balanceColors(computeCumulativeBalance(emp, allShifts))
      requests.push(cellFmt(sheetId, ri + 1, 8, {
        backgroundColor: wc.bg,
        textFormat: { bold: true, fontSize: 9, foregroundColor: wc.fg },
        horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
      }))
      requests.push(cellFmt(sheetId, ri + 1, 9, {
        backgroundColor: cc.bg,
        textFormat: { bold: true, fontSize: 9, foregroundColor: cc.fg },
        horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
      }))
    })

    // Validation sur colonnes cachées
    for (let d = 0; d < 7; d++) {
      const b = HIDDEN_START + d * COLS_PER_DAY
      requests.push(dropdownValidation(sheetId, 1, nRows, b,     b + 1, TYPE_OPTIONS))
      requests.push(dropdownValidation(sheetId, 1, nRows, b + 1, b + 2, TIME_OPTIONS))
      requests.push(dropdownValidation(sheetId, 1, nRows, b + 2, b + 3, TIME_OPTIONS))
      requests.push(dropdownValidation(sheetId, 1, nRows, b + 3, b + 4, PAUSE_OPTIONS))
      requests.push(checkboxValidation(sheetId, 1, nRows, b + 4, b + 5))
    }

    // Masquer les colonnes cachées
    requests.push({
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: HIDDEN_START, endIndex: HIDDEN_END },
        properties: { hiddenByUser: true }, fields: 'hiddenByUser',
      },
    })
  }

  // Largeurs
  requests.push({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1  }, properties: { pixelSize: 210 }, fields: 'pixelSize' } })
  requests.push({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 8  }, properties: { pixelSize: 150 }, fields: 'pixelSize' } })
  requests.push({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 8, endIndex: 10 }, properties: { pixelSize: 130 }, fields: 'pixelSize' } })

  // Hauteurs (100px pour voir les 4 lignes dans les cellules jour)
  requests.push({ updateDimensionProperties: { range: { sheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 },      properties: { pixelSize: 32  }, fields: 'pixelSize' } })
  if (activeTeam.length > 0) {
    requests.push({ updateDimensionProperties: { range: { sheetId, dimension: 'ROWS', startIndex: 1, endIndex: nRows }, properties: { pixelSize: 100 }, fields: 'pixelSize' } })
  }

  // Figer ligne 1 + colonne A
  requests.push({
    updateSheetProperties: {
      properties: { sheetId, gridProperties: { frozenRowCount: 1, frozenColumnCount: 1 } },
      fields: 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount',
    },
  })

  // Bordures sur colonnes visibles uniquement (A-J)
  requests.push(allBorders(sheetId, 0, nRows, 0, 10))

  await call('POST', ':batchUpdate', token, { requests })
}

// ─── Team sheet formatting ─────────────────────────────────────────────────────

async function formatTeamSheet(token, sheetId, team) {
  const nRows = team.length + 1
  await call('POST', ':batchUpdate', token, { requests: [
    rangeFmt(sheetId, 0, 1, 0, 7, {
      backgroundColor: hexToRgb('#F5F4F9'),
      textFormat: { bold: true, fontSize: 10 }, horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
    }),
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 7 }, properties: { pixelSize: 130 }, fields: 'pixelSize' } },
    { updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
    allBorders(sheetId, 0, nRows, 0, 7),
  ]})
}

// ─── High-level operations ────────────────────────────────────────────────────

const SYNC_BUFFER_SHEET = 'SYNC_BUFFER'

// Écrit toutes les valeurs (sans formatting) vers un onglet nommé. Retourne le sheetId.
async function _writeWeekValues(token, weekDates, allShifts, team, sheetTitle) {
  const sheetId    = await ensureSheet(token, sheetTitle)
  const activeTeam = team.filter(e => !e.archived)
  const LAST_COL   = colLetter(HIDDEN_END - 1)   // "AS"
  const strs       = new Set(weekDates.map(dateToStr))

  await clearRange(token, `${sheetTitle}!A:${LAST_COL}`)

  const header = [
    '',
    ...weekDates.map((d, i) => `${DAYS_FR[i]} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`),
    'Balance semaine', 'Solde cumulé',
  ]
  await writeValues(token, `${sheetTitle}!A1`, [header])

  if (activeTeam.length > 0) {
    await writeValues(token, `${sheetTitle}!A2`,
      activeTeam.map(emp => [[emp.name, emp.role, emp.contract ? `${emp.contract}h` : null].filter(Boolean).join(' / ')]))

    const wkShiftsVisible = allShifts.filter(s => strs.has(s.date))
    await writeValues(token, `${sheetTitle}!B2`,
      activeTeam.map(emp => weekDates.map((date, di) => {
        const shift = wkShiftsVisible.find(s => s.employeeId === emp.id && s.date === dateToStr(date))
        if (shift) return shiftCellText(shift)
        return DEFAULT_REST.has(di) ? 'Repos' : ''
      })))

    await writeValues(token, `${sheetTitle}!I2`,
      activeTeam.map(emp => [
        formatBalance(computeWeeklyBalance(emp, weekDates, allShifts), 'Semaine équilibrée'),
        formatBalance(computeCumulativeBalance(emp, allShifts)),
      ]))

    const hiddenHeaders = []
    for (let d = 0; d < 7; d++) {
      hiddenHeaders.push(
        `${DAYS_FR[d]} - Type`, `${DAYS_FR[d]} - Début`, `${DAYS_FR[d]} - Fin`,
        `${DAYS_FR[d]} - Pause`, `${DAYS_FR[d]} - Validé`)
    }
    await writeValues(token, `${sheetTitle}!K1`, [hiddenHeaders])
    await writeValues(token, `${sheetTitle}!K2`,
      buildHiddenColValues(activeTeam, weekDates, allShifts), 'USER_ENTERED')
  }

  return sheetId
}

export async function writeWeekToSheet(token, weekDates, allShifts, team) {
  const name    = weekSheetName(weekDates)
  console.log('[googleSheets] writeWeekToSheet', name, allShifts.filter(s => new Set(weekDates.map(dateToStr)).has(s.date)).length, 'shifts')
  const sheetId = await _writeWeekValues(token, weekDates, allShifts, team, name)
  await formatWeekSheet(token, sheetId, team, weekDates, allShifts)
}

// Écriture atomique via feuille tampon SYNC_BUFFER :
//  1. Écrire dans SYNC_BUFFER (la cible reste intacte)
//  2. Copier SYNC_BUFFER → cible en un seul batchUpdate (atomique)
//  3. Nettoyer SYNC_BUFFER
// 3 tentatives, puis throw avec isSyncFailure = true
export async function writeWeekAtomically(token, weekDates, allShifts, team) {
  const targetName = weekSheetName(weekDates)
  console.log('[googleSheets] writeWeekAtomically', targetName, allShifts.filter(s => new Set(weekDates.map(dateToStr)).has(s.date)).length, 'shifts')
  const LAST_COL   = colLetter(HIDDEN_END - 1)
  const MAX_RETRIES = 3

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Étape 1 — écrire dans le buffer (cible non touchée)
      const bufId    = await _writeWeekValues(token, weekDates, allShifts, team, SYNC_BUFFER_SHEET)
      const targetId = await ensureSheet(token, targetName)

      // Étape 2 — remplacer la cible depuis le buffer en une seule opération
      await clearRange(token, `${targetName}!A:${LAST_COL}`)
      await call('POST', ':batchUpdate', token, {
        requests: [{
          copyPaste: {
            source:      { sheetId: bufId,    startRowIndex: 0, endRowIndex: 200, startColumnIndex: 0, endColumnIndex: HIDDEN_END },
            destination: { sheetId: targetId, startRowIndex: 0, endRowIndex: 200, startColumnIndex: 0, endColumnIndex: HIDDEN_END },
            pasteType: 'PASTE_VALUES',
            pasteOrientation: 'NORMAL',
          },
        }],
      })

      // Étape 3 — formatage cible + nettoyage buffer
      await formatWeekSheet(token, targetId, team, weekDates, allShifts)
      await clearRange(token, `${SYNC_BUFFER_SHEET}!A:${LAST_COL}`)
      return

    } catch (err) {
      try { await clearRange(token, `${SYNC_BUFFER_SHEET}!A:Z`) } catch {}
      if (attempt >= MAX_RETRIES - 1) {
        const e = new Error('Sync échouée — données locales préservées')
        e.isSyncFailure = true
        throw e
      }
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
}

export async function readWeekFromSheet(token, weekDates, team) {
  const name     = weekSheetName(weekDates)
  const LAST_COL = colLetter(HIDDEN_END - 1)
  try {
    // Lecture parallèle : col A (noms employés) + colonnes cachées K:AS
    const [empRows, hiddenRows] = await Promise.all([
      readValues(token, `${name}!A:A`),
      readValues(token, `${name}!K:${LAST_COL}`),
    ])
    return parseHiddenRows(empRows, hiddenRows, team, weekDates)
  } catch (e) {
    if (e.status === 400 || String(e.message).includes('Unable to parse range')) return []
    throw e
  }
}

export async function writeTeamToSheet(token, team) {
  const sheetId = await ensureSheet(token, 'Équipe')
  await clearRange(token, 'Équipe!A:G')
  await writeValues(token, 'Équipe!A1', teamToRows(team))
  await formatTeamSheet(token, sheetId, team)
}

export async function readTeamFromSheet(token, existingTeam = []) {
  try {
    const rows = await readValues(token, 'Équipe!A:G')
    return rowsToTeam(rows, existingTeam)
  } catch (e) {
    if (e.status === 400 || String(e.message).includes('Unable to parse range')) return existingTeam
    throw e
  }
}

// ─── Commandes boutique ───────────────────────────────────────────────────────
// Feuille "Commandes" — une ligne par commande boutique ou brunch boutique.
// Les commandes Webflow (webflowOrderId non null) ne sont pas dans cette feuille.

const ORDERS_SHEET = 'Commandes'
const ORDERS_HDR   = [
  'id', 'channel', 'brunchSource', 'customer_name', 'customer_phone',
  'customer_email', 'items', 'totalPrice', 'pickupDate', 'pickupTime',
  'paid', 'status', 'createdAt', 'updatedAt',
]

export function ordersToRows(orders) {
  return [
    ORDERS_HDR,
    ...orders.map(o => [
      o.id,
      o.channel,
      o.brunchSource  ?? '',
      o.customer?.name  ?? '',
      o.customer?.phone ?? '',
      o.customer?.email ?? '',
      JSON.stringify(o.items ?? []),
      o.totalPrice   ?? 0,
      o.pickupDate   ?? '',
      o.pickupTime   ?? '',
      o.paid ? 'true' : 'false',
      o.status       ?? 'new',
      o.createdAt    ?? '',
      o.updatedAt    ?? '',
    ]),
  ]
}

export function rowsToOrders(rows) {
  if (!rows || rows.length < 2) return []
  return rows.slice(1)
    .filter(r => r[0] != null && r[0] !== '')
    .map(r => {
      let items = []
      try { items = JSON.parse(r[6] ?? '[]') } catch {}
      return {
        id:             String(r[0]),
        channel:        String(r[1] ?? 'boutique'),
        brunchSource:   r[2] ? String(r[2]) : null,
        customer: {
          name:  String(r[3] ?? ''),
          phone: r[4] ? String(r[4]) : null,
          email: r[5] ? String(r[5]) : null,
        },
        items,
        totalPrice:     Number(r[7]  ?? 0),
        pickupDate:     String(r[8]  ?? ''),
        pickupTime:     r[9]  ? String(r[9])  : null,
        paid:           parseBool(r[10]),
        status:         String(r[11] ?? 'new'),
        createdAt:      String(r[12] ?? ''),
        updatedAt:      String(r[13] ?? ''),
        webflowOrderId: null,
      }
    })
}

export async function writeOrdersToSheet(token, orders) {
  await ensureSheet(token, ORDERS_SHEET)
  await clearRange(token, `${ORDERS_SHEET}!A:N`)
  if (orders.length > 0) {
    await writeValues(token, `${ORDERS_SHEET}!A1`, ordersToRows(orders))
  } else {
    // Garder l'en-tête même si aucune commande
    await writeValues(token, `${ORDERS_SHEET}!A1`, [ORDERS_HDR])
  }
  console.log('[googleSheets] writeOrdersToSheet', orders.length, 'commandes')
}

export async function readOrdersFromSheet(token) {
  console.log('[googleSheets] readOrdersFromSheet — lecture feuille "Commandes"')
  try {
    const rows = await readValues(token, `${ORDERS_SHEET}!A:N`)
    const orders = rowsToOrders(rows)
    console.log('[googleSheets] readOrdersFromSheet —', orders.length, 'commandes parsées')
    return orders
  } catch (e) {
    console.warn('[googleSheets] readOrdersFromSheet — erreur:', e.message)
    if (e.status === 400 || String(e.message).includes('Unable to parse range')) return []
    throw e
  }
}

// ─── Produits — 4 feuilles séparées ──────────────────────────────────────────
// Products | ProductSizes | ProductIngredients | RecipeSteps
// Relation : chaque sous-table référence product_id (colonne A).

const PRODUCTS_SHEET     = 'Products'
const SIZES_SHEET        = 'ProductSizes'
const INGREDIENTS_SHEET  = 'ProductIngredients'
const STEPS_SHEET        = 'RecipeSteps'

// ── En-têtes ──────────────────────────────────────────────────────────────────

const PRODUCTS_HDR = [
  'id', 'name', 'category', 'photoUrl', 'description',
  'active', 'seasonal', 'season',
  'totalProductionTimeMin', 'restTimeMin', 'advancePrepDays',
  'storageConditions', 'shelfLifeHours',
  'allergens', 'sanitaryNotes',
  'availableToOrder', 'minOrderDays', 'minQty', 'customizable',
  'difficulty', 'variants', 'internalNotes',
  'createdAt', 'updatedAt',
]

const SIZES_HDR = [
  'id', 'product_id', 'label', 'price', 'costPerUnit',
  'weightG', 'productionTimeMin', 'minOrderQty',
]

const INGREDIENTS_HDR = [
  'id', 'product_id', 'name', 'quantity', 'unit',
]

const STEPS_HDR = [
  'id', 'product_id', 'order', 'description',
  'temperatureC', 'durationMin', 'equipment',
]

// ── Sérialisation ─────────────────────────────────────────────────────────────

export function productsToRows(products) {
  const pRows  = [PRODUCTS_HDR]
  const sRows  = [SIZES_HDR]
  const iRows  = [INGREDIENTS_HDR]
  const rRows  = [STEPS_HDR]

  for (const p of products) {
    pRows.push([
      p.id, p.name, p.category ?? '', p.photoUrl ?? '', p.description ?? '',
      p.active ? 'true' : 'false',
      p.seasonal ? 'true' : 'false',
      p.season ?? '',
      p.totalProductionTimeMin ?? '', p.restTimeMin ?? '', p.advancePrepDays ?? 0,
      p.storageConditions ?? '', p.shelfLifeHours ?? '',
      JSON.stringify(p.allergens ?? []),
      p.sanitaryNotes ?? '',
      p.availableToOrder ? 'true' : 'false',
      p.minOrderDays ?? '', p.minQty ?? '',
      p.customizable ? 'true' : 'false',
      p.difficulty ?? 3,
      JSON.stringify(p.variants ?? []),
      p.internalNotes ?? '',
      p.createdAt ?? '', p.updatedAt ?? '',
    ])

    for (const s of (p.sizes ?? [])) {
      sRows.push([
        s.id, p.id, s.label, s.price ?? '', s.costPerUnit ?? '',
        s.weightG ?? '', s.productionTimeMin ?? '', s.minOrderQty ?? 1,
      ])
    }

    for (const ing of (p.ingredients ?? [])) {
      iRows.push([ing.id, p.id, ing.name, ing.quantity ?? '', ing.unit ?? 'g'])
    }

    for (const step of (p.recipeSteps ?? [])) {
      rRows.push([
        step.id, p.id, step.order, step.description ?? '',
        step.temperatureC ?? '', step.durationMin ?? '', step.equipment ?? '',
      ])
    }
  }

  return { pRows, sRows, iRows, rRows }
}

// ── Désérialisation ───────────────────────────────────────────────────────────

function parseJsonArr(val) {
  try { return JSON.parse(val ?? '[]') } catch { return [] }
}

export function rowsToProducts(pRows, sRows, iRows, rRows) {
  if (!pRows || pRows.length < 2) return []

  // Index sous-tables par product_id pour O(1) lookup
  const sizesById = {}
  for (const r of (sRows ?? []).slice(1)) {
    if (!r[1]) continue
    ;(sizesById[r[1]] ??= []).push({
      id: String(r[0]), label: String(r[2] ?? ''),
      price:             r[3] !== '' ? Number(r[3]) : null,
      costPerUnit:       r[4] !== '' ? Number(r[4]) : null,
      weightG:           r[5] !== '' ? Number(r[5]) : null,
      productionTimeMin: r[6] !== '' ? Number(r[6]) : null,
      minOrderQty:       r[7] !== '' ? Number(r[7]) : 1,
    })
  }

  const ingredientsById = {}
  for (const r of (iRows ?? []).slice(1)) {
    if (!r[1]) continue
    ;(ingredientsById[r[1]] ??= []).push({
      id: String(r[0]), name: String(r[2] ?? ''),
      quantity: r[3] !== '' ? Number(r[3]) : null,
      unit: String(r[4] ?? 'g'),
    })
  }

  const stepsById = {}
  for (const r of (rRows ?? []).slice(1)) {
    if (!r[1]) continue
    ;(stepsById[r[1]] ??= []).push({
      id: String(r[0]), order: Number(r[2] ?? 1),
      description:   String(r[3] ?? ''),
      temperatureC:  r[4] !== '' ? Number(r[4]) : null,
      durationMin:   r[5] !== '' ? Number(r[5]) : null,
      equipment:     r[6] ? String(r[6]) : null,
    })
  }

  return pRows.slice(1)
    .filter(r => r[0] != null && r[0] !== '')
    .map(r => {
      const id = String(r[0])
      return {
        id,
        name:                  String(r[1]  ?? ''),
        category:              String(r[2]  ?? ''),
        photoUrl:              r[3]  ? String(r[3])  : null,
        description:           r[4]  ? String(r[4])  : null,
        active:                parseBool(r[5]),
        seasonal:              parseBool(r[6]),
        season:                r[7]  ? String(r[7])  : null,
        totalProductionTimeMin:r[8]  !== '' ? Number(r[8])  : null,
        restTimeMin:           r[9]  !== '' ? Number(r[9])  : null,
        advancePrepDays:       r[10] !== '' ? Number(r[10]) : 0,
        storageConditions:     r[11] ? String(r[11]) : null,
        shelfLifeHours:        r[12] !== '' ? Number(r[12]) : null,
        allergens:             parseJsonArr(r[13]),
        sanitaryNotes:         r[14] ? String(r[14]) : null,
        availableToOrder:      parseBool(r[15]),
        minOrderDays:          r[16] !== '' ? Number(r[16]) : null,
        minQty:                r[17] !== '' ? Number(r[17]) : null,
        customizable:          parseBool(r[18]),
        difficulty:            r[19] !== '' ? Number(r[19]) : 3,
        variants:              parseJsonArr(r[20]),
        internalNotes:         r[21] ? String(r[21]) : null,
        createdAt:             String(r[22] ?? ''),
        updatedAt:             String(r[23] ?? ''),
        sizes:                 sizesById[id]       ?? [],
        ingredients:           ingredientsById[id] ?? [],
        recipeSteps:           (stepsById[id] ?? []).sort((a, b) => a.order - b.order),
      }
    })
}

// ── Lecture / écriture ────────────────────────────────────────────────────────

export async function writeProductsToSheet(token, products) {
  const { pRows, sRows, iRows, rRows } = productsToRows(products)

  await Promise.all([
    ensureSheet(token, PRODUCTS_SHEET),
    ensureSheet(token, SIZES_SHEET),
    ensureSheet(token, INGREDIENTS_SHEET),
    ensureSheet(token, STEPS_SHEET),
  ])

  await Promise.all([
    clearRange(token, `${PRODUCTS_SHEET}!A:Z`),
    clearRange(token, `${SIZES_SHEET}!A:H`),
    clearRange(token, `${INGREDIENTS_SHEET}!A:E`),
    clearRange(token, `${STEPS_SHEET}!A:G`),
  ])

  await Promise.all([
    writeValues(token, `${PRODUCTS_SHEET}!A1`,    pRows),
    writeValues(token, `${SIZES_SHEET}!A1`,        sRows),
    writeValues(token, `${INGREDIENTS_SHEET}!A1`,  iRows),
    writeValues(token, `${STEPS_SHEET}!A1`,        rRows),
  ])

  console.log('[googleSheets] writeProductsToSheet', products.length, 'produits')
}

export async function readProductsFromSheet(token) {
  console.log('[googleSheets] readProductsFromSheet — lecture 4 feuilles')
  try {
    const [pRows, sRows, iRows, rRows] = await Promise.all([
      readValues(token, `${PRODUCTS_SHEET}!A:X`),
      readValues(token, `${SIZES_SHEET}!A:H`),
      readValues(token, `${INGREDIENTS_SHEET}!A:E`),
      readValues(token, `${STEPS_SHEET}!A:G`),
    ])
    const products = rowsToProducts(pRows, sRows, iRows, rRows)
    console.log('[googleSheets] readProductsFromSheet —', products.length, 'produits parsés')
    return products
  } catch (e) {
    console.warn('[googleSheets] readProductsFromSheet — erreur:', e.message)
    if (e.status === 400 || String(e.message).includes('Unable to parse range')) return null
    throw e
  }
}
