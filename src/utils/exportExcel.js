import XLSX from 'xlsx-js-style'
import { dateToStr, WEEKLY_CONTRACT } from '../hooks/useSchedule'

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

// Hex colors without # — ARGB for xlsx-js-style
const C_HEADER_BG = 'FF18100A'
const C_HEADER_FG = 'FFFFFFFF'
const C_DATE_BG   = 'FFF5F4F9'
const C_ODD_BG    = 'FFFAFAFA'
const C_EVEN_BG   = 'FFFFFFFF'
const C_LABEL_BG  = 'FFEDE8F5'  // subtle purple for employee name col
const C_TEXT      = 'FF1A1A2E'

// Light fill for validated cells per type
const TYPE_VALID_BG = {
  work:   'FFD6EFFF',
  leave:  'FFEDE5FF',
  sick:   'FFFFE5E5',
  school: 'FFFFF3CC',
  rest:   'FFD9F5E5',
  absent: 'FFFFF0E0',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTime(h) {
  return `${String(Math.floor(h)).padStart(2, '0')}h${h % 1 === 0.5 ? '30' : '00'}`
}

function fmtDur(h) {
  const totalMin = Math.round(Math.abs(h) * 60)
  const hours    = Math.floor(totalMin / 60)
  const mins     = totalMin % 60
  return mins === 0 ? `${hours}h` : `${hours}h${String(mins).padStart(2, '0')}`
}

function fmtPause(v) {
  if (!v) return null
  if (v < 1) return `${v * 60}min`
  if (v === 1) return '1h'
  return `1h${(v - 1) * 60}min`
}

function fmtDate(date) {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}`
}

function weekMondayOf(dateStr) {
  const d   = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const mon = new Date(d)
  mon.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return dateToStr(mon)
}

function weekNumber(mondayStr) {
  const d    = new Date(mondayStr + 'T00:00:00')
  const jan1 = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
}

function effectiveH(s) {
  if ((s.type ?? 'work') !== 'work') return 0
  return Math.max(0, (s.endHour - s.startHour) - (s.pause ?? 0))
}

function shiftContent(shift) {
  const type = shift.type ?? 'work'
  if (type === 'leave')  return 'Congés'
  if (type === 'sick')   return 'Arrêt maladie'
  if (type === 'school') return 'École'
  if (type === 'rest')   return 'Repos'
  if (type === 'absent') return 'Absent'
  // work
  const parts = [`${fmtTime(shift.startHour)} − ${fmtTime(shift.endHour)}`]
  const pause = fmtPause(shift.pause)
  if (pause) parts.push(`Pause ${pause}`)
  parts.push(`${fmtDur(effectiveH(shift))} eff.`)
  return parts.join('\n')
}

function fmtSolde(v) {
  const sign = v > 0 ? '+' : v < 0 ? '−' : ''
  return `${sign}${fmtDur(Math.abs(v))}${v === 0 ? ' ✓' : ''}`
}

// ─── Cell builder ─────────────────────────────────────────────────────────────

function setCell(ws, r, c, value, style) {
  const addr = XLSX.utils.encode_cell({ r, c })
  ws[addr] = { v: value, t: typeof value === 'number' ? 'n' : 's', s: style }
}

function makeStyle({ bgColor, fontBold = false, fontColor = C_TEXT, hAlign = 'center', wrapText = true } = {}) {
  const s = {
    alignment: { horizontal: hAlign, vertical: 'center', wrapText },
    font: { name: 'Helvetica Neue', sz: 10, bold: fontBold, color: { rgb: fontColor } },
  }
  if (bgColor) {
    s.fill = { patternType: 'solid', fgColor: { rgb: bgColor } }
  }
  return s
}

// ─── Per-week sheet ───────────────────────────────────────────────────────────

function buildWeekSheet(mondayStr, shifts, team) {
  const ws       = {}
  const monday   = new Date(mondayStr + 'T00:00:00')
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  const activeTeam = team.filter(e => !e.archived)
  let row = 0

  // ── Row 0: column headers (day names) ───────────────────────────────────
  const hdrStyle = makeStyle({ bgColor: C_HEADER_BG, fontBold: true, fontColor: C_HEADER_FG })
  setCell(ws, row, 0, '', hdrStyle)
  DAY_NAMES.forEach((name, i) => setCell(ws, row, i + 1, name, hdrStyle))
  row++

  // ── Row 1: dates ─────────────────────────────────────────────────────────
  const dateStyle = makeStyle({ bgColor: C_DATE_BG, fontBold: true, hAlign: 'center' })
  setCell(ws, row, 0, '', makeStyle({ bgColor: C_DATE_BG }))
  weekDates.forEach((date, i) => {
    setCell(ws, row, i + 1, `${DAY_NAMES[i]} ${fmtDate(date)}`, dateStyle)
  })
  row++

  // ── Employee rows ────────────────────────────────────────────────────────
  activeTeam.forEach((emp, ei) => {
    const bgColor = ei % 2 === 0 ? C_EVEN_BG : C_ODD_BG

    // Employee name + role
    const empLabel = emp.role ? `${emp.name}\n${emp.role}` : emp.name
    setCell(ws, row, 0, empLabel, makeStyle({ bgColor: C_LABEL_BG, hAlign: 'left', fontBold: false }))

    // Shift per day
    weekDates.forEach((date, i) => {
      const dateStr = dateToStr(date)
      const shift   = shifts.find(s => s.employeeId === emp.id && s.date === dateStr)
      let cellBg    = bgColor
      let content   = ''

      if (shift) {
        content = shiftContent(shift)
        if (shift.validated) {
          cellBg = TYPE_VALID_BG[shift.type ?? 'work'] ?? bgColor
        }
      }
      setCell(ws, row, i + 1, content, makeStyle({ bgColor: cellBg, hAlign: 'center' }))
    })
    row++
  })

  // ── Sheet ref & dimensions ───────────────────────────────────────────────
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: row - 1, c: 7 } })
  ws['!cols'] = [{ wch: 22 }, ...Array(7).fill({ wch: 20 })]
  ws['!rows'] = [
    { hpt: 24 },   // header
    { hpt: 22 },   // dates
    ...Array(activeTeam.length).fill({ hpt: 52 }),
  ]

  return ws
}

// ─── Summary sheet ────────────────────────────────────────────────────────────

function buildSummarySheet(shifts, team) {
  const ws = {}
  let row  = 0

  // Header
  const headers = ['Employé', 'Rôle', 'Semaine', 'Début de semaine', 'Heures effectuées', 'Contrat', 'Solde semaine', 'Solde cumulé']
  const hdrStyle = makeStyle({ bgColor: C_HEADER_BG, fontBold: true, fontColor: C_HEADER_FG })
  headers.forEach((h, c) => setCell(ws, row, c, h, hdrStyle))
  row++

  // Group shifts by employee + week
  const grouped = {}
  for (const s of shifts) {
    const mon = weekMondayOf(s.date)
    const key = `${s.employeeId}|${mon}`
    if (!grouped[key]) grouped[key] = { employeeId: s.employeeId, mon, shifts: [] }
    grouped[key].shifts.push(s)
  }

  const entries = Object.values(grouped).sort((a, b) => {
    if (a.employeeId !== b.employeeId) return String(a.employeeId).localeCompare(String(b.employeeId))
    return a.mon.localeCompare(b.mon)
  })

  const cumulByEmp  = {}
  let   prevEmpId   = null

  entries.forEach((entry, ei) => {
    const emp = team.find(e => e.id === entry.employeeId)
    if (!emp) return

    const weekH     = entry.shifts.reduce((sum, s) => sum + effectiveH(s), 0)
    const contract  = emp.contract ?? WEEKLY_CONTRACT
    const solde     = weekH - contract
    cumulByEmp[emp.id] = (cumulByEmp[emp.id] ?? 0) + solde
    const cumul     = cumulByEmp[emp.id]

    // Alternate bg per employee block
    const isNewEmp  = emp.id !== prevEmpId
    if (isNewEmp) prevEmpId = emp.id
    const bgColor   = ei % 2 === 0 ? C_EVEN_BG : C_ODD_BG

    const soldeColor = solde > 0 ? 'FFE05555' : solde < 0 ? 'FFF5A623' : 'FF4CAF50'
    const cumulColor = cumul > 0 ? 'FFE05555' : cumul < 0 ? 'FFF5A623' : 'FF4CAF50'

    const monDate = new Date(entry.mon + 'T00:00:00')

    const vals = [
      emp.name,
      emp.role ?? '',
      `Sem. ${weekNumber(entry.mon)}`,
      fmtDate(monDate) + '/' + monDate.getFullYear(),
      fmtDur(weekH),
      `${contract}h`,
      fmtSolde(solde),
      fmtSolde(cumul),
    ]

    vals.forEach((v, c) => {
      const extraStyle = c === 6 ? { fontColor: soldeColor } : c === 7 ? { fontColor: cumulColor } : {}
      setCell(ws, row, c, v, makeStyle({ bgColor, hAlign: c === 0 || c === 1 ? 'left' : 'center', ...extraStyle }))
    })
    row++
  })

  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: row - 1, c: 7 } })
  ws['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 8 }, { wch: 14 }, { wch: 14 }]
  ws['!rows'] = [{ hpt: 24 }, ...Array(row - 1).fill({ hpt: 18 })]

  return ws
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function exportToExcel(shifts, team) {
  console.log('export excel déclenché', { shifts: shifts.length, team: team.length })
  try {
  const wb = XLSX.utils.book_new()

  // Summary sheet first
  const summaryWs = buildSummarySheet(shifts, team)
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Récapitulatif')

  // One sheet per week, sorted chronologically (oldest first)
  const mondays = [...new Set(shifts.map(s => weekMondayOf(s.date)))]
    .sort((a, b) => a.localeCompare(b))

  for (const mon of mondays) {
    const wn    = weekNumber(mon)
    const monDate = new Date(mon + 'T00:00:00')
    const label = `Semaine ${wn} - ${fmtDate(monDate).replace('/', '.')}`
    const ws    = buildWeekSheet(mon, shifts, team)
    XLSX.utils.book_append_sheet(wb, ws, label)
  }

  // File name
  const today    = new Date()
  const stamp    = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const filename = `Kubo-Planning-${stamp}.xlsx`

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href       = url
  a.download   = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Erreur export Excel:', err)
  }
}
