// ─── Export Planning → Google Sheets ──────────────────────────────────────────
//
// Onglet 1 — "Semaine en cours" : tableau employé × 7 jours
// Onglet 2 — "Historique"       : tous les shifts du mois en cours

import { writeSheet, COLORS, cellColorRequest, type CellValue } from '../sheetsApi.ts'
import { ensureSheet, clearRange, writeValues, batchFormat,
         headerFormatRequest, alternatingRowsRequest,
         autoResizeRequest, freezeFirstRowRequest } from '../sheetsApi.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Employee {
  id: string; name: string; role: string; contract: number
}

interface Shift {
  id: string; employee_id: string; date: string
  type: string; start_hour: number; end_hour: number
  pause: number; validated: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const TYPE_LABEL: Record<string, string> = {
  work:   'Travail',
  leave:  'Congés',
  sick:   'Maladie',
  school: 'École',
  rest:   'Repos',
  absent: 'Absent',
}

const ROLE_ORDER: Record<string, number> = {
  'Cheffe Pâtissière': 0,
  'Pâtissier':         1,
  'Pâtissière':        1,
  'Vendeur':           2,
  'Vendeuse':          2,
}

function fmtH(h: number): string {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${String(hh).padStart(2, '0')}h${mm === 0 ? '00' : String(mm).padStart(2, '0')}`
}

function effectiveH(s: Shift): number {
  if (s.type !== 'work') return 0
  return Math.max(0, (s.end_hour - s.start_hour) - (s.pause ?? 0))
}

function shiftCell(shifts: Shift[]): string {
  if (!shifts.length) return ''
  const s = shifts[0]
  const label = TYPE_LABEL[s.type] ?? s.type
  if (s.type === 'work') {
    const eff  = effectiveH(s)
    const hh   = Math.floor(eff)
    const mm   = Math.round((eff - hh) * 60)
    const effStr = mm === 0 ? `${hh}h` : `${hh}h${String(mm).padStart(2, '0')}`
    return `${label} ${fmtH(s.start_hour)}–${fmtH(s.end_hour)} (${effStr})`
  }
  return label
}

/** Lundi de la semaine ISO contenant `date`. */
function mondayOf(date: Date): Date {
  const d   = new Date(date)
  const dow = d.getDay()                    // 0=dim … 6=sam
  const diff = dow === 0 ? -6 : 1 - dow    // décalage vers lundi
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// ── Export ────────────────────────────────────────────────────────────────────

export async function exportPlanning(
  supabase: SupabaseClient,
  token:    string,
  sheetId:  string,
): Promise<void> {
  // ── Charger les données ───────────────────────────────────────────────────

  const { data: employees, error: empErr } = await supabase
    .from('employees')
    .select('id, name, role, contract')
    .eq('archived', false)
    .order('name')
  if (empErr) throw new Error(`employees: ${empErr.message}`)

  const now   = new Date()
  const monday = mondayOf(now)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
  const weekStrs = weekDates.map(dateStr)

  // Shifts de la semaine en cours
  const { data: weekShifts, error: wsErr } = await supabase
    .from('shifts')
    .select('*')
    .gte('date', weekStrs[0])
    .lte('date', weekStrs[6])
  if (wsErr) throw new Error(`shifts semaine: ${wsErr.message}`)

  // Shifts du mois en cours
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastOfMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const { data: monthShifts, error: msErr } = await supabase
    .from('shifts')
    .select('*')
    .gte('date', dateStr(firstOfMonth))
    .lte('date', dateStr(lastOfMonth))
    .order('date', { ascending: false })
  if (msErr) throw new Error(`shifts mois: ${msErr.message}`)

  const sortedEmployees = [...(employees ?? [])].sort((a, b) => {
    const oa = ROLE_ORDER[a.role] ?? 99
    const ob = ROLE_ORDER[b.role] ?? 99
    return oa !== ob ? oa - ob : a.name.localeCompare(b.name)
  })

  // ── Onglet 1 — Semaine en cours ───────────────────────────────────────────

  const weekHeaders = [
    'Employé', 'Rôle',
    ...DAYS_FR.map((d, i) => `${d} ${String(weekDates[i].getDate()).padStart(2, '0')}/${String(weekDates[i].getMonth() + 1).padStart(2, '0')}`),
    'Total semaine',
  ]

  const weekRows: CellValue[][] = sortedEmployees.map(emp => {
    let totalEff = 0
    const dayCells: CellValue[] = weekDates.map((_d, i) => {
      const dayStr = weekStrs[i]
      const dayShifts = (weekShifts ?? []).filter((s: Shift) => s.employee_id === emp.id && s.date === dayStr)
      const eff = dayShifts.reduce((sum: number, s: Shift) => sum + effectiveH(s), 0)
      totalEff += eff
      return shiftCell(dayShifts)
    })
    const hh = Math.floor(totalEff)
    const mm = Math.round((totalEff - hh) * 60)
    return [emp.name, emp.role, ...dayCells, mm === 0 ? `${hh}h` : `${hh}h${String(mm).padStart(2, '0')}`]
  })

  // Ligne total
  const totalRow: CellValue[] = ['TOTAL', '']
  for (let i = 0; i < 7; i++) {
    const dayStr = weekStrs[i]
    const dayShifts = (weekShifts ?? []).filter((s: Shift) => s.date === dayStr)
    const total = dayShifts.reduce((sum: number, s: Shift) => sum + effectiveH(s), 0)
    const hh = Math.floor(total); const mm = Math.round((total - hh) * 60)
    totalRow.push(mm === 0 ? `${hh}h` : `${hh}h${String(mm).padStart(2, '0')}`)
  }
  totalRow.push('')
  weekRows.push(totalRow)

  const weekSheetId = await ensureSheet(token, sheetId, 'Semaine en cours')
  await clearRange(token, sheetId, 'Semaine en cours!A:ZZ')
  await writeValues(token, sheetId, 'Semaine en cours!A1', [weekHeaders, ...weekRows])

  // Format semaine
  const totalRowIdx = weekRows.length  // 0-based : en-tête=0, données=1..n, total=n+1
  const weekFormatRequests = [
    headerFormatRequest(weekSheetId, 0, weekHeaders.length),
    ...alternatingRowsRequest(weekSheetId, 1, weekRows.length, weekHeaders.length),
    // Ligne total en gras
    {
      repeatCell: {
        range: { sheetId: weekSheetId, startRowIndex: totalRowIdx, endRowIndex: totalRowIdx + 1, startColumnIndex: 0, endColumnIndex: weekHeaders.length },
        cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 } } },
        fields: 'userEnteredFormat(textFormat,backgroundColor)',
      },
    },
    autoResizeRequest(weekSheetId, weekHeaders.length),
    freezeFirstRowRequest(weekSheetId),
  ]
  await batchFormat(token, sheetId, weekFormatRequests)

  // ── Onglet 2 — Historique du mois ─────────────────────────────────────────

  const empById = Object.fromEntries((employees ?? []).map((e: Employee) => [e.id, e]))

  const histHeaders = ['Employé', 'Rôle', 'Date', 'Type', 'Début', 'Fin', 'Pause (min)', 'Heures eff.']
  const histRows: CellValue[][] = (monthShifts ?? []).map((s: Shift) => {
    const emp = empById[s.employee_id]
    const eff = effectiveH(s)
    const hh = Math.floor(eff); const mm = Math.round((eff - hh) * 60)
    const [year, month, day] = s.date.split('-')
    return [
      emp?.name  ?? s.employee_id,
      emp?.role  ?? '',
      `${day}/${month}/${year}`,
      TYPE_LABEL[s.type] ?? s.type,
      s.type === 'work' ? fmtH(s.start_hour) : '',
      s.type === 'work' ? fmtH(s.end_hour)   : '',
      s.type === 'work' ? (s.pause ?? 0)     : '',
      s.type === 'work' ? (mm === 0 ? `${hh}h` : `${hh}h${String(mm).padStart(2, '0')}`) : '',
    ]
  })

  await writeSheet(token, sheetId, 'Historique', histHeaders, histRows)
}
