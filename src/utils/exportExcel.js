import * as XLSX from 'xlsx'
import { dateToStr, WEEKLY_CONTRACT } from '../hooks/useSchedule'

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDur(h) {
  const totalMin = Math.round(Math.abs(h) * 60)
  const hours    = Math.floor(totalMin / 60)
  const mins     = totalMin % 60
  return mins === 0 ? `${hours}h` : `${hours}h${String(mins).padStart(2, '0')}`
}

function fmtPause(v) {
  if (!v) return '—'
  if (v < 1) return `${v * 60} min`
  if (v === 1) return '1h'
  return `1h${(v - 1) * 60}`
}

function fmtTime(h) {
  return `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 === 0.5 ? '30' : '00'}`
}

function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function dayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'long' })
}

// Monday of the week for a given date string
function weekMondayOf(dateStr) {
  const d   = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const mon = new Date(d)
  mon.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return dateToStr(mon)
}

// Week number (ISO-ish, good enough for display)
function weekNumber(mondayStr) {
  const d    = new Date(mondayStr + 'T00:00:00')
  const jan1 = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
}

// Effective duration in hours for a shift
function effectiveH(s) {
  return Math.max(0, (s.endHour - s.startHour) - (s.pause ?? 0))
}

// ─── Cell style helpers ───────────────────────────────────────────────────

function makeCell(v, type = 's') {
  return { v, t: type }
}

function setColWidths(ws, widths) {
  ws['!cols'] = widths.map(w => ({ wch: w }))
}

// ─── Build per-week sheet ────────────────────────────────────────────────

function buildWeekSheet(mondayStr, shifts, team) {
  const weekShifts = shifts
    .filter(s => weekMondayOf(s.date) === mondayStr)
    .sort((a, b) => {
      if (a.employeeId !== b.employeeId) return a.employeeId - b.employeeId
      return a.date.localeCompare(b.date) || a.startHour - b.startHour
    })

  // Compute cumul & solde per employee on this week
  const empWeekHours = {}
  for (const s of weekShifts) {
    empWeekHours[s.employeeId] = (empWeekHours[s.employeeId] ?? 0) + effectiveH(s)
  }

  // Build AOA (array of arrays)
  const headers = [
    'Employé', 'Rôle', 'Jour', 'Date', 'Début', 'Fin',
    'Pause', 'Durée effective', 'Cumul semaine', 'Solde semaine',
  ]

  const rows = [headers]

  // Running cumul per employee as we iterate
  const runningCumul = {}

  for (const s of weekShifts) {
    const emp = team.find(e => e.id === s.employeeId)
    if (!emp) continue
    const eff = effectiveH(s)
    runningCumul[s.employeeId] = (runningCumul[s.employeeId] ?? 0) + eff
    const cumul  = runningCumul[s.employeeId]
    rows.push([
      emp.name,
      emp.role,
      dayLabel(s.date),
      fmtDate(s.date),
      fmtTime(s.startHour),
      fmtTime(s.endHour),
      fmtPause(s.pause),
      fmtDur(eff),
      fmtDur(cumul),
      '', // filled below once per employee
    ])
  }

  // Fill solde column (last column, index 9) per employee
  const soldeByEmp = {}
  for (const [empId, weekH] of Object.entries(empWeekHours)) {
    soldeByEmp[empId] = weekH - WEEKLY_CONTRACT
  }

  const lastRowIdx = {}
  for (let i = 1; i < rows.length; i++) {
    const s = weekShifts[i - 1]
    if (s) lastRowIdx[s.employeeId] = i
  }
  for (const [empId, rowIdx] of Object.entries(lastRowIdx)) {
    const solde = soldeByEmp[empId]
    const sign  = solde > 0 ? '+' : ''
    rows[rowIdx][9] = `${sign}${fmtDur(Math.abs(solde))}${solde > 0 ? ' (excès)' : solde < 0 ? ' (retard)' : ' ✓'}`
  }

  // Rebuild rows with totals inserted after each employee group
  const finalRows = [headers]
  let i = 1
  while (i < rows.length) {
    const empId      = weekShifts[i - 1].employeeId
    const groupStart = i
    while (i < rows.length && weekShifts[i - 1].employeeId === empId) i++
    const groupRows = rows.slice(groupStart, i)
    finalRows.push(...groupRows)
    const totalH = empWeekHours[empId] ?? 0
    const solde  = soldeByEmp[empId] ?? 0
    const sign   = solde > 0 ? '+' : ''
    finalRows.push([
      '', '', '', '', '', '',
      'TOTAL',
      fmtDur(totalH),
      '',
      `${sign}${fmtDur(Math.abs(solde))}`,
    ])
  }

  const ws = XLSX.utils.aoa_to_sheet(finalRows)
  setColWidths(ws, [18, 14, 12, 10, 7, 7, 8, 14, 14, 16])
  return ws
}

// ─── Build summary sheet ────────────────────────────────────────────────

function buildSummarySheet(shifts, team) {
  const headers = [
    'Employé', 'Rôle', 'Semaine', 'Début de semaine',
    'Heures effectuées', 'Objectif (35h)', 'Solde semaine', 'Solde cumulé',
  ]

  const grouped = {}
  for (const s of shifts) {
    const mon = weekMondayOf(s.date)
    const key = `${s.employeeId}|${mon}`
    if (!grouped[key]) grouped[key] = { employeeId: s.employeeId, mon, shifts: [] }
    grouped[key].shifts.push(s)
  }

  const entries = Object.values(grouped).sort((a, b) => {
    if (a.employeeId !== b.employeeId) return a.employeeId - b.employeeId
    return b.mon.localeCompare(a.mon)
  })

  const rows = [headers]
  const cumulByEmp = {}

  for (const entry of entries) {
    const emp   = team.find(e => e.id === entry.employeeId)
    if (!emp) continue
    const weekH = entry.shifts.reduce((s, sh) => s + effectiveH(sh), 0)
    const solde = weekH - WEEKLY_CONTRACT
    if (cumulByEmp[emp.id] === undefined) cumulByEmp[emp.id] = 0
    cumulByEmp[emp.id] += solde
    const cumulSolde = cumulByEmp[emp.id]

    const fmtSolde = v => `${v > 0 ? '+' : ''}${fmtDur(Math.abs(v))}${v === 0 ? ' ✓' : ''}`

    rows.push([
      emp.name,
      emp.role,
      `Sem. ${weekNumber(entry.mon)}`,
      fmtDate(entry.mon),
      fmtDur(weekH),
      fmtDur(WEEKLY_CONTRACT),
      fmtSolde(solde),
      fmtSolde(cumulSolde),
    ])
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)
  setColWidths(ws, [18, 14, 10, 16, 17, 14, 13, 13])
  return ws
}

// ─── Main export function ────────────────────────────────────────────────

export function exportToExcel(shifts, team) {
  const wb = XLSX.utils.book_new()

  const summaryWs = buildSummarySheet(shifts, team)
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Récapitulatif')

  const mondays = [...new Set(shifts.map(s => weekMondayOf(s.date)))]
    .sort((a, b) => b.localeCompare(a))

  for (const mon of mondays) {
    const wn    = weekNumber(mon)
    const label = `Sem. ${wn} - ${fmtDate(mon).slice(0, 5).replace('/', '.')}`
    const ws    = buildWeekSheet(mon, shifts, team)
    XLSX.utils.book_append_sheet(wb, ws, label)
  }

  const today    = new Date()
  const stamp    = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const filename = `Kubo-Planning-export-${stamp}.xlsx`
  const buffer   = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob     = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url      = URL.createObjectURL(blob)
  const a        = document.createElement('a')
  a.href         = url
  a.download     = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
