// ─── Export Planning → Google Sheets ──────────────────────────────────────────
//
// Onglet 1 — "Semaine en cours" : tableau employé × 7 jours
// Onglet 2 — "Historique"       : tous les shifts du mois en cours

import { writeSheet, cellColorRequest, type CellValue, type Color } from '../sheetsApi.ts'
import { ensureSheet, clearRange, writeValues, batchFormat,
         headerFormatRequest, alternatingRowsRequest,
         autoResizeRequest, freezeFirstRowRequest } from '../sheetsApi.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Employee {
  id: string; name: string; role: string; contract: number; start_balance: number
}

interface Shift {
  id: string; employee_id: string; date: string
  type: string; start_hour: number; end_hour: number
  pause: number; validated: boolean
}

// ── Constantes ────────────────────────────────────────────────────────────────

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// Indices dans le tableau DAYS_FR (0=Lundi, 6=Dimanche) → repos par défaut
const DEFAULT_REST_DAY_INDICES = new Set([0, 6])

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

// Couleurs shift normales (-100)
const SHIFT_COLORS: Record<string, Color> = {
  work:   { red: 0.73, green: 0.88, blue: 1.0  },
  school: { red: 1.0,  green: 0.95, blue: 0.82 },
  rest:   { red: 0.82, green: 0.96, blue: 0.88 },
  leave:  { red: 0.93, green: 0.91, blue: 1.0  },
  sick:   { red: 1.0,  green: 0.89, blue: 0.89 },
  absent: { red: 1.0,  green: 0.92, blue: 0.86 },
}

// Couleurs shift validés (-200, plus foncé)
const SHIFT_COLORS_VALIDATED: Record<string, Color> = {
  work:   { red: 0.60, green: 0.83, blue: 1.0  },
  school: { red: 1.0,  green: 0.90, blue: 0.61 },
  rest:   { red: 0.61, green: 0.90, blue: 0.75 },
  leave:  { red: 0.85, green: 0.80, blue: 1.0  },
  sick:   { red: 1.0,  green: 0.79, blue: 0.79 },
  absent: { red: 1.0,  green: 0.82, blue: 0.69 },
}

// Couleurs colonnes différentiel / solde
const COLOR_DIFF_POS:  Color = { red: 1.0,  green: 0.89, blue: 0.89 }  // rouge clair — surplus
const COLOR_DIFF_NEG:  Color = { red: 1.0,  green: 0.92, blue: 0.86 }  // orange clair — déficit
const COLOR_DIFF_ZERO: Color = { red: 0.82, green: 0.96, blue: 0.88 }  // vert clair — équilibré

// ── Helpers ───────────────────────────────────────────────────────────────────

function shiftColor(shift: Shift): Color | null {
  const map = shift.validated ? SHIFT_COLORS_VALIDATED : SHIFT_COLORS
  return map[shift.type] ?? null
}

function diffColor(h: number): Color {
  if (h >  0.01) return COLOR_DIFF_POS
  if (h < -0.01) return COLOR_DIFF_NEG
  return COLOR_DIFF_ZERO
}

function fmtH(h: number): string {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${String(hh).padStart(2, '0')}h${mm === 0 ? '00' : String(mm).padStart(2, '0')}`
}

function fmtDiff(h: number): string {
  const abs = Math.abs(h)
  const hh  = Math.floor(abs)
  const mm  = Math.round((abs - hh) * 60)
  const str = mm === 0 ? `${hh}h00` : `${hh}h${String(mm).padStart(2, '0')}`
  if (h >  0.01) return `+${str}`
  if (h < -0.01) return `-${str}`
  return '0h00'
}

function effectiveH(s: Shift): number {
  if (s.type !== 'work') return 0
  return Math.max(0, (s.end_hour - s.start_hour) - (s.pause ?? 0))
}

function shiftCell(shifts: Shift[], isDefaultRest = false): string {
  if (!shifts.length) return isDefaultRest ? 'Repos' : ''
  const s = shifts[0]
  if (s.type === 'work') {
    const timeStr  = `${fmtH(s.start_hour)}–${fmtH(s.end_hour)}`
    const pauseStr = (s.pause ?? 0) > 0 ? ` (${s.pause} min pause)` : ''
    return `${timeStr}${pauseStr}`
  }
  return TYPE_LABEL[s.type] ?? s.type
}

function mondayOf(date: Date): Date {
  const d    = new Date(date)
  const dow  = d.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Clé lundi de semaine à partir d'une date string ISO */
function weekKey(dateString: string): string {
  return dateStr(mondayOf(new Date(dateString + 'T00:00:00')))
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
    .select('id, name, role, contract, start_balance')
    .eq('archived', false)
    .order('name')
  if (empErr) throw new Error(`employees: ${empErr.message}`)

  const now    = new Date()
  const monday = mondayOf(now)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
  const weekStrs = weekDates.map(dateStr)

  // Shifts de la semaine courante
  const { data: weekShifts, error: wsErr } = await supabase
    .from('shifts')
    .select('*')
    .gte('date', weekStrs[0])
    .lte('date', weekStrs[6])
  if (wsErr) throw new Error(`shifts semaine: ${wsErr.message}`)

  // Tous les shifts — pour calcul des soldes cumulés
  const { data: allShifts, error: allErr } = await supabase
    .from('shifts')
    .select('employee_id, date, type, start_hour, end_hour, pause')
  if (allErr) throw new Error(`allShifts: ${allErr.message}`)

  // Shifts du mois — pour l'onglet Historique
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastOfMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const { data: monthShifts, error: msErr } = await supabase
    .from('shifts')
    .select('*')
    .gte('date', dateStr(firstOfMonth))
    .lte('date', dateStr(lastOfMonth))
    .order('date', { ascending: false })
  if (msErr) throw new Error(`shifts mois: ${msErr.message}`)

  const sortedEmployees = [...(employees ?? [])].sort((a: Employee, b: Employee) => {
    const oa = ROLE_ORDER[a.role] ?? 99
    const ob = ROLE_ORDER[b.role] ?? 99
    return oa !== ob ? oa - ob : a.name.localeCompare(b.name)
  })

  // ── Soldes cumulés (tous shifts historiques) ──────────────────────────────

  const soldeByEmp = new Map<string, number>()
  sortedEmployees.forEach((emp: Employee) => {
    const empShifts = (allShifts ?? []).filter((s: Shift) => s.employee_id === emp.id)
    const totalH    = empShifts.reduce((sum: number, s: Shift) => sum + effectiveH(s), 0)
    const weeks     = new Set(empShifts.map((s: Shift) => weekKey(s.date))).size
    const contract  = emp.contract ?? 35
    const startBal  = emp.start_balance ?? 0
    soldeByEmp.set(emp.id, totalH - weeks * contract + startBal)
  })

  // ── Onglet 1 — Semaine en cours ───────────────────────────────────────────

  // Colonnes : Employé | Rôle | Lun-Dim (×7) | Diff. semaine | Solde total | Total semaine
  const COL_FIRST_DAY = 2
  const COL_DIFF      = 9
  const COL_SOLDE     = 10
  const COL_TOTAL     = 11

  const weekHeaders = [
    'Employé', 'Rôle',
    ...DAYS_FR.map((d, i) => `${d} ${String(weekDates[i].getDate()).padStart(2, '0')}/${String(weekDates[i].getMonth() + 1).padStart(2, '0')}`),
    'Diff. semaine',
    'Solde total',
    'Total semaine',
  ]

  // Pré-calcul par employé pour réutiliser dans rows ET dans les requêtes de couleur
  const empData = sortedEmployees.map((emp: Employee) => {
    const dayShiftsList = weekDates.map((_d, i) =>
      (weekShifts ?? []).filter((s: Shift) => s.employee_id === emp.id && s.date === weekStrs[i])
    )
    let totalEff = 0
    const dayCells: CellValue[] = dayShiftsList.map((dayShifts, i) => {
      totalEff += dayShifts.reduce((sum: number, s: Shift) => sum + effectiveH(s), 0)
      return shiftCell(dayShifts, dayShifts.length === 0 && DEFAULT_REST_DAY_INDICES.has(i))
    })
    const contract = emp.contract ?? 35
    const weekDiff = totalEff - contract
    const solde    = soldeByEmp.get(emp.id) ?? 0
    const hh = Math.floor(totalEff)
    const mm = Math.round((totalEff - hh) * 60)
    return { emp, dayShiftsList, dayCells, totalEff, weekDiff, solde, hh, mm }
  })

  const weekRows: CellValue[][] = empData.map(({ emp, dayCells, weekDiff, solde, hh, mm }) => [
    emp.name, emp.role,
    ...dayCells,
    fmtDiff(weekDiff),
    fmtDiff(solde),
    mm === 0 ? `${hh}h00` : `${hh}h${String(mm).padStart(2, '0')}`,
  ])

  const weekSheetId = await ensureSheet(token, sheetId, 'Semaine en cours')
  await clearRange(token, sheetId, 'Semaine en cours!A:ZZ')
  await writeValues(token, sheetId, 'Semaine en cours!A1', [weekHeaders, ...weekRows])

  // ── Requêtes de mise en forme ─────────────────────────────────────────────

  const cellColorRequests = empData.flatMap(({ emp, dayShiftsList, weekDiff, solde }, empIdx) => {
    const row      = empIdx + 1  // +1 pour l'en-tête
    const requests = []

    // Couleurs cellules jours (shift ou repos par défaut)
    dayShiftsList.forEach((dayShifts, dayIdx) => {
      const shift         = dayShifts[0] ?? null
      const isDefaultRest = !shift && DEFAULT_REST_DAY_INDICES.has(dayIdx)
      let color: Color | null = null
      if (shift)          color = shiftColor(shift)
      else if (isDefaultRest) color = SHIFT_COLORS['rest']
      if (color) requests.push(cellColorRequest(weekSheetId, row, COL_FIRST_DAY + dayIdx, color))
    })

    // Couleur diff. semaine
    requests.push(cellColorRequest(weekSheetId, row, COL_DIFF,  diffColor(weekDiff)))
    // Couleur solde total
    requests.push(cellColorRequest(weekSheetId, row, COL_SOLDE, diffColor(solde)))

    return requests
  })

  const weekFormatRequests = [
    headerFormatRequest(weekSheetId, 0, weekHeaders.length),
    ...alternatingRowsRequest(weekSheetId, 1, weekRows.length, weekHeaders.length),
    autoResizeRequest(weekSheetId, weekHeaders.length),
    freezeFirstRowRequest(weekSheetId),
    ...cellColorRequests,   // en dernier → surcharge le fond alterné
  ]
  await batchFormat(token, sheetId, weekFormatRequests)

  // ── Onglet 2 — Historique du mois ─────────────────────────────────────────

  const empById = Object.fromEntries((employees ?? []).map((e: Employee) => [e.id, e]))

  const histHeaders = ['Employé', 'Rôle', 'Date', 'Type', 'Début', 'Fin', 'Pause (min)', 'Heures eff.']
  const histRows: CellValue[][] = (monthShifts ?? []).map((s: Shift) => {
    const emp = empById[s.employee_id]
    const eff = effectiveH(s)
    const hh  = Math.floor(eff); const mm = Math.round((eff - hh) * 60)
    const [year, month, day] = s.date.split('-')
    return [
      emp?.name ?? s.employee_id,
      emp?.role ?? '',
      `${day}/${month}/${year}`,
      TYPE_LABEL[s.type] ?? s.type,
      s.type === 'work' ? fmtH(s.start_hour) : '',
      s.type === 'work' ? fmtH(s.end_hour)   : '',
      s.type === 'work' ? (s.pause ?? 0)      : '',
      s.type === 'work' ? (mm === 0 ? `${hh}h00` : `${hh}h${String(mm).padStart(2, '0')}`) : '',
    ]
  })

  await writeSheet(token, sheetId, 'Historique', histHeaders, histRows)
}
