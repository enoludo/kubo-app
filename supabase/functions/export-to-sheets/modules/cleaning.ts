// ─── Export Nettoyage → Google Sheets ────────────────────────────────────────
//
// Onglet 1 — "Tâches de la semaine" : Room > Zone > Tâche × 7 jours
// Onglet 2 — "Historique"           : tous les records du mois courant

import { writeSheet, cellColorRequest, COLORS, ensureSheet, clearRange,
         writeValues, batchFormat, headerFormatRequest, alternatingRowsRequest,
         autoResizeRequest, freezeFirstRowRequest, type CellValue } from '../sheetsApi.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Room     { id: string; name: string; color: string }
interface Zone     { id: string; room_id: string; name: string; active: boolean }
interface Subzone  { id: string; zone_id: string; name: string; active: boolean }
interface Task {
  id: string; zone_id: string | null; subzone_id: string | null
  name: string; frequency: string; day_of_week: number | null
  cycle_start: number | null; active: boolean
}
interface Record_ {
  id: string; task_id: string; scheduled_date: string
  completed_at: string | null; status: string
  note: string | null; author_id: string | null
}

// ── Helpers scheduling ────────────────────────────────────────────────────────

function isScheduled(task: Task, date: Date): boolean {
  if (!task.active) return false
  const dow        = date.getDay()   // 0=dim
  const month      = date.getMonth() + 1
  const dayOfMonth = date.getDate()

  switch (task.frequency) {
    case 'daily':   return true
    case 'weekly':  return task.day_of_week === dow
    case 'monthly': return dayOfMonth <= 7
    case 'quarterly': return [1, 4, 7, 10].includes(month) && dayOfMonth <= 7
    case 'semiannual': {
      const start  = task.cycle_start ?? 1
      const second = ((start - 1 + 6) % 12) + 1
      return [start, second].includes(month) && dayOfMonth <= 7
    }
    default: return false
  }
}

function mondayOf(date: Date): Date {
  const d   = new Date(date)
  const dow = d.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// ── Export ────────────────────────────────────────────────────────────────────

export async function exportCleaning(
  supabase: SupabaseClient,
  token:    string,
  sheetId:  string,
): Promise<void> {
  const now = new Date()

  // ── Charger les données ───────────────────────────────────────────────────

  const [roomsRes, zonesRes, subzonesRes, tasksRes] = await Promise.all([
    supabase.from('rooms').select('*').eq('active', true),
    supabase.from('cleaning_zones').select('*').eq('active', true),
    supabase.from('cleaning_subzones').select('*').eq('active', true),
    supabase.from('cleaning_tasks').select('*').eq('active', true),
  ])
  if (roomsRes.error)    throw new Error(`rooms: ${roomsRes.error.message}`)
  if (zonesRes.error)    throw new Error(`cleaning_zones: ${zonesRes.error.message}`)
  if (subzonesRes.error) throw new Error(`cleaning_subzones: ${subzonesRes.error.message}`)
  if (tasksRes.error)    throw new Error(`cleaning_tasks: ${tasksRes.error.message}`)

  const monday = mondayOf(now)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
  const weekStrs = weekDates.map(dateStr)

  const { data: weekRecords, error: wrErr } = await supabase
    .from('cleaning_records')
    .select('*')
    .gte('scheduled_date', weekStrs[0])
    .lte('scheduled_date', weekStrs[6])
  if (wrErr) throw new Error(`cleaning_records semaine: ${wrErr.message}`)

  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastOfMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const { data: monthRecords, error: mrErr } = await supabase
    .from('cleaning_records')
    .select('*, cleaning_tasks(name, cleaning_zones(name), cleaning_subzones(name))')
    .gte('scheduled_date', dateStr(firstOfMonth))
    .lte('scheduled_date', dateStr(lastOfMonth))
    .order('scheduled_date', { ascending: false })
  if (mrErr) throw new Error(`cleaning_records mois: ${mrErr.message}`)

  const rooms    = (roomsRes.data    ?? []) as Room[]
  const zones    = (zonesRes.data    ?? []) as Zone[]
  const subzones = (subzonesRes.data ?? []) as Subzone[]
  const tasks    = (tasksRes.data    ?? []) as Task[]
  const records  = (weekRecords      ?? []) as Record_[]

  // ── Onglet 1 — Tâches de la semaine ──────────────────────────────────────

  const weekHeaders = [
    'Pièce', 'Zone', 'Sous-zone', 'Tâche', 'Fréquence',
    ...DAYS_FR.map((d, i) => `${d} ${String(weekDates[i].getDate()).padStart(2, '0')}/${String(weekDates[i].getMonth() + 1).padStart(2, '0')}`),
  ]

  const taskRows: { row: CellValue[]; colorMap: { colIdx: number; type: 'done' | 'late' | 'na' }[] }[] = []
  const today = new Date(); today.setHours(0, 0, 0, 0)

  for (const room of rooms) {
    const roomZones = zones.filter(z => z.room_id === room.id)

    for (const zone of roomZones) {
      // Tâches directes de la zone
      const zoneTasks = tasks.filter(t => t.zone_id === zone.id && !t.subzone_id)
      for (const task of zoneTasks) {
        const dayCells: CellValue[] = []
        const colorMap: { colIdx: number; type: 'done' | 'late' | 'na' }[] = []

        weekDates.forEach((date, i) => {
          const dayStr = weekStrs[i]
          if (!isScheduled(task, date)) {
            dayCells.push('—')
            colorMap.push({ colIdx: i + 5, type: 'na' })
            return
          }
          const rec = records.find(r => r.task_id === task.id && r.scheduled_date === dayStr)
          if (rec?.completed_at) {
            const t = new Date(rec.completed_at)
            dayCells.push(`✓ ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`)
            colorMap.push({ colIdx: i + 5, type: 'done' })
          } else {
            const isLate = date < today
            dayCells.push(isLate ? '✗ Non fait' : '')
            if (isLate) colorMap.push({ colIdx: i + 5, type: 'late' })
          }
        })

        const FREQ_LABEL: Record<string, string> = {
          daily: 'Quotidien', weekly: 'Hebdomadaire', monthly: 'Mensuel',
          quarterly: 'Trimestriel', semiannual: 'Semestriel',
        }
        taskRows.push({
          row: [room.name, zone.name, '', task.name, FREQ_LABEL[task.frequency] ?? task.frequency, ...dayCells],
          colorMap,
        })
      }

      // Sous-zones
      const zoneSubzones = subzones.filter(s => s.zone_id === zone.id)
      for (const sz of zoneSubzones) {
        const szTasks = tasks.filter(t => t.subzone_id === sz.id)
        for (const task of szTasks) {
          const dayCells: CellValue[] = []
          const colorMap: { colIdx: number; type: 'done' | 'late' | 'na' }[] = []

          weekDates.forEach((date, i) => {
            const dayStr = weekStrs[i]
            if (!isScheduled(task, date)) {
              dayCells.push('—')
              colorMap.push({ colIdx: i + 5, type: 'na' })
              return
            }
            const rec = records.find(r => r.task_id === task.id && r.scheduled_date === dayStr)
            if (rec?.completed_at) {
              const t = new Date(rec.completed_at)
              dayCells.push(`✓ ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`)
              colorMap.push({ colIdx: i + 5, type: 'done' })
            } else {
              const isLate = date < today
              dayCells.push(isLate ? '✗ Non fait' : '')
              if (isLate) colorMap.push({ colIdx: i + 5, type: 'late' })
            }
          })

          const FREQ_LABEL: Record<string, string> = {
            daily: 'Quotidien', weekly: 'Hebdomadaire', monthly: 'Mensuel',
            quarterly: 'Trimestriel', semiannual: 'Semestriel',
          }
          taskRows.push({
            row: [room.name, zone.name, sz.name, task.name, FREQ_LABEL[task.frequency] ?? task.frequency, ...dayCells],
            colorMap,
          })
        }
      }
    }
  }

  const weekSheetId = await ensureSheet(token, sheetId, 'Tâches de la semaine')
  await clearRange(token, sheetId, 'Tâches de la semaine!A:ZZ')
  await writeValues(token, sheetId, 'Tâches de la semaine!A1', [weekHeaders, ...taskRows.map(r => r.row)])

  const weekColorRequests: unknown[] = []
  taskRows.forEach((tr, rowIdx) => {
    tr.colorMap.forEach(({ colIdx, type }) => {
      const color = type === 'done' ? COLORS.green : type === 'late' ? COLORS.red : COLORS.grey
      weekColorRequests.push(cellColorRequest(weekSheetId, rowIdx + 1, colIdx, color))
    })
  })

  await batchFormat(token, sheetId, [
    headerFormatRequest(weekSheetId, 0, weekHeaders.length),
    ...alternatingRowsRequest(weekSheetId, 1, taskRows.length + 1, weekHeaders.length),
    autoResizeRequest(weekSheetId, weekHeaders.length),
    freezeFirstRowRequest(weekSheetId),
    ...weekColorRequests,
  ])

  // ── Onglet 2 — Historique du mois ─────────────────────────────────────────

  const histHeaders = ['Date', 'Pièce', 'Zone', 'Tâche', 'Statut', 'Heure', 'Note']

  // Reconstruction depuis les relations imbriquées
  const taskById = Object.fromEntries(tasks.map(t => [t.id, t]))
  const zoneById = Object.fromEntries(zones.map(z => [z.id, z]))
  const roomById = Object.fromEntries(rooms.map(r => [r.id, r]))

  const histRows: CellValue[][] = (monthRecords ?? []).map((r: Record_ & { cleaning_tasks?: { name: string } }) => {
    const task = taskById[r.task_id]
    const zone = task?.zone_id ? zoneById[task.zone_id] : null
    const room = zone?.room_id ? roomById[zone.room_id] : null
    const [year, month, day] = r.scheduled_date.split('-')
    const heureStr = r.completed_at
      ? (() => { const t = new Date(r.completed_at); return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}` })()
      : ''
    return [
      `${day}/${month}/${year}`,
      room?.name  ?? '',
      zone?.name  ?? '',
      task?.name  ?? r.task_id,
      r.completed_at ? 'Fait' : 'Non fait',
      heureStr,
      r.note ?? '',
    ]
  })

  await writeSheet(token, sheetId, 'Historique', histHeaders, histRows)
}
