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

import { START_HOUR, END_HOUR } from '../hooks/useSchedule'

const SHEET_ID    = import.meta.env.VITE_GOOGLE_SHEET_ID
const BASE        = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`
const DAYS_FR     = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const HIDDEN_START = 10   // colonne K
const COLS_PER_DAY = 5   // Type, Début, Fin, Pause, Validé
const HIDDEN_END   = HIDDEN_START + 7 * COLS_PER_DAY  // 45 (exclusive)

// Dropdown options
const TYPE_OPTIONS  = ['Travaillé', 'Congés', 'Repos', 'Arrêt maladie', 'École']
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
  work: 'Travaillé', vacation: 'Congés', rest: 'Repos',
  sick: 'Arrêt maladie', school: 'École',
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

const TYPE_HEX = {
  work: '#7AC5FF', vacation: '#C8AFFF', rest: '#66DA9B',
  sick: '#FF9594', school: '#FFD866',
}

function shiftBgColor(type, validated) {
  return blendOnWhite(TYPE_HEX[type] ?? TYPE_HEX.work, validated ? 0.2 : 0.4)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtH(h) {
  if (h == null) return ''
  return `${String(Math.floor(h)).padStart(2, '0')}h${h % 1 === 0.5 ? '30' : '00'}`
}

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

// ─── Date helpers ─────────────────────────────────────────────────────────────

function dateToStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const y1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - y1) / 86400000 + 1) / 7)
}

export function mondayOf(dateStr) {
  const d = new Date(dateStr + 'T00:00:00'), day = d.getDay(), mon = new Date(d)
  mon.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return dateToStr(mon)
}

export function weekDatesFromMonday(mondayStr) {
  const mon = new Date(mondayStr + 'T00:00:00')
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d })
}

export function weekSheetName(weekDates) {
  const mon = weekDates[0]
  return `Semaine ${isoWeek(mon)} - ${String(mon.getDate()).padStart(2,'0')}/${String(mon.getMonth()+1).padStart(2,'0')}/${mon.getFullYear()}`
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
  const label = TYPE_TO_LABEL[shift.type ?? 'work'] ?? 'Travaillé'
  if ((shift.type ?? 'work') === 'work') {
    return [label, fmtH(shift.startHour), fmtH(shift.endHour), fmtPause(shift.pause), shift.validated ?? false]
  }
  return [label, '', '', 'Aucune', shift.validated ?? false]
}

// 5 hidden col values → shift object (returns null if empty)
function hiddenColsToShift(cols, employeeId, date, id) {
  const typeLabel = cols[0]
  if (!typeLabel || typeLabel === '') return null
  const type        = LABEL_TO_TYPE[String(typeLabel)] ?? 'work'
  const isValidated = parseBool(cols[4])
  if (type !== 'work') {
    return { id, employeeId, date, startHour: 0, endHour: 0, pause: 0, type, validated: isValidated }
  }
  return {
    id, employeeId, date,
    startHour: parseH(String(cols[1] ?? '')),
    endHour:   parseH(String(cols[2] ?? '')),
    pause:     parsePause(String(cols[3] ?? '')),
    type: 'work', validated: isValidated,
  }
}

// Texte affiché dans une cellule jour — valeur directe (pas de formule)
function shiftCellText(shift) {
  const type  = shift.type ?? 'work'
  const label = TYPE_TO_LABEL[type] ?? 'Travaillé'
  const lines = []
  if (type === 'work') {
    lines.push(label)
    lines.push(`${fmtH(shift.startHour)} − ${fmtH(shift.endHour)}`)
    if (shift.pause) lines.push(`Pause ${fmtPause(shift.pause)}`)
  } else if (type === 'vacation') {
    lines.push('Congés — Journée entière')
  } else {
    lines.push(label)
  }
  if (shift.validated) lines.push('✓ Validé')
  return lines.join('\n')
}

// 2D array for writing to K2:AS(n+1)
function buildHiddenColValues(activeTeam, weekDates, allShifts) {
  const strs     = new Set(weekDates.map(dateToStr))
  const wkShifts = allShifts.filter(s => strs.has(s.date))
  return activeTeam.map(emp => {
    const row = []
    weekDates.forEach(date => {
      const shift = wkShifts.find(s => s.employeeId === emp.id && s.date === dateToStr(date))
      row.push(...shiftToHiddenCols(shift))
    })
    return row
  })
}

// Parse hidden col rows back into shift objects
function parseHiddenRows(empRows, hiddenRows, team, weekDates) {
  if (!empRows || empRows.length < 2) return []
  const colDates = weekDates.map(dateToStr)
  const shifts   = []

  for (let ri = 1; ri < empRows.length; ri++) {
    const empCell = empRows[ri]?.[0]
    if (!empCell) continue
    const empName = String(empCell).split(' / ')[0].trim()
    const emp     = team.find(e => e.name === empName)
    if (!emp) continue

    const hiddenRow = hiddenRows[ri] ?? []   // row 0 = hidden header, ri aligns
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
  if (balance > 0) return { bg: blendOnWhite('#66DA9B', 0.3), fg: hexToRgb('#1A6B3A') }
  if (balance < 0) return { bg: blendOnWhite('#F39C12', 0.25), fg: hexToRgb('#B06A00') }
  return { bg: blendOnWhite('#66DA9B', 0.2), fg: hexToRgb('#1A6B3A') }
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

    // Couleur de fond par shift
    activeTeam.forEach((emp, ri) => {
      weekDates.forEach((date, ci) => {
        const shift = wkShifts.find(s => s.employeeId === emp.id && s.date === dateToStr(date))
        if (!shift) return
        requests.push(cellFmt(sheetId, ri + 1, ci + 1, {
          backgroundColor: shiftBgColor(shift.type, shift.validated),
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

export async function writeWeekToSheet(token, weekDates, allShifts, team) {
  const name       = weekSheetName(weekDates)
  const sheetId    = await ensureSheet(token, name)
  const activeTeam = team.filter(e => !e.archived)
  const LAST_COL   = colLetter(HIDDEN_END - 1)   // "AS"
  const strs       = new Set(weekDates.map(dateToStr))

  await clearRange(token, `${name}!A:${LAST_COL}`)

  // Ligne 1 : en-têtes visibles (A-J)
  const header = [
    '',
    ...weekDates.map((d, i) => `${DAYS_FR[i]} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`),
    'Balance semaine', 'Solde cumulé',
  ]
  await writeValues(token, `${name}!A1`, [header])

  if (activeTeam.length > 0) {
    // Colonne A : info employés
    await writeValues(token, `${name}!A2`,
      activeTeam.map(emp => [[emp.name, emp.role, emp.contract ? `${emp.contract}h` : null].filter(Boolean).join(' / ')]))

    // Colonnes B-H : texte formaté écrit directement (pas de formule)
    const wkShiftsVisible = allShifts.filter(s => strs.has(s.date))
    await writeValues(token, `${name}!B2`,
      activeTeam.map(emp => weekDates.map(date => {
        const shift = wkShiftsVisible.find(s => s.employeeId === emp.id && s.date === dateToStr(date))
        return shift ? shiftCellText(shift) : ''
      })))

    // Colonnes I-J : balances
    await writeValues(token, `${name}!I2`,
      activeTeam.map(emp => [
        formatBalance(computeWeeklyBalance(emp, weekDates, allShifts), 'Semaine équilibrée'),
        formatBalance(computeCumulativeBalance(emp, allShifts)),
      ]))

    // En-têtes colonnes cachées (ligne 1, K1)
    const hiddenHeaders = []
    for (let d = 0; d < 7; d++) {
      hiddenHeaders.push(
        `${DAYS_FR[d]} - Type`, `${DAYS_FR[d]} - Début`, `${DAYS_FR[d]} - Fin`,
        `${DAYS_FR[d]} - Pause`, `${DAYS_FR[d]} - Validé`)
    }
    await writeValues(token, `${name}!K1`, [hiddenHeaders])

    // Colonnes K+ : données cachées (USER_ENTERED pour les booleans checkbox)
    await writeValues(token, `${name}!K2`,
      buildHiddenColValues(activeTeam, weekDates, allShifts), 'USER_ENTERED')
  }

  await formatWeekSheet(token, sheetId, team, weekDates, allShifts)
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
