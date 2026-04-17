// ─── Export Températures → Google Sheets ──────────────────────────────────────
//
// Onglet 1 — "Relevés du mois"        : tous les relevés du mois courant
// Onglet 2 — "Récapitulatif semaine"  : pivot 1 ligne/équipement × 7 jours

import { writeSheet, cellColorRequest, COLORS, ensureSheet, clearRange,
         writeValues, batchFormat, headerFormatRequest, alternatingRowsRequest,
         autoResizeRequest, freezeFirstRowRequest, type CellValue } from '../sheetsApi.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Equipment {
  id: string; name: string; type: string
  min_temp: number; max_temp: number; order: number
}

interface Reading {
  id: string; equipment_id: string; date: string
  slot: string; time: string; temperature: number
  comment: string | null; created_by: string | null
  author_id: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

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

function isOutOfRange(temp: number, eq: Equipment): boolean {
  return temp < eq.min_temp || temp > eq.max_temp
}

// ── Export ────────────────────────────────────────────────────────────────────

export async function exportTemperatures(
  supabase: SupabaseClient,
  token:    string,
  sheetId:  string,
): Promise<void> {
  const now = new Date()

  // ── Charger les données ───────────────────────────────────────────────────

  const { data: equipment, error: eqErr } = await supabase
    .from('equipments')
    .select('id, name, type, min_temp, max_temp, order')
    .eq('active', true)
    .order('order')
  if (eqErr) throw new Error(`equipments: ${eqErr.message}`)

  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastOfMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const { data: readings, error: rdErr } = await supabase
    .from('temperature_readings')
    .select('*')
    .gte('date', dateStr(firstOfMonth))
    .lte('date', dateStr(lastOfMonth))
    .order('date', { ascending: false })
    .order('equipment_id')
  if (rdErr) throw new Error(`temperature_readings: ${rdErr.message}`)

  const eqById = Object.fromEntries((equipment ?? []).map((e: Equipment) => [e.id, e]))

  // ── Onglet 1 — Relevés du mois ────────────────────────────────────────────

  const readingHeaders = ['Date', 'Équipement', 'Type', 'Créneau', 'Heure', 'Température (°C)', 'Min', 'Max', 'Auteur', 'Commentaire']
  const readingRows: CellValue[][] = (readings ?? []).map((r: Reading) => {
    const eq = eqById[r.equipment_id]
    const [year, month, day] = r.date.split('-')
    return [
      `${day}/${month}/${year}`,
      eq?.name ?? r.equipment_id,
      eq?.type === 'negatif' ? 'Négatif' : 'Positif',
      r.slot === 'morning' ? 'Matin' : r.slot === 'evening' ? 'Soir' : r.slot ?? '',
      r.time ?? '',
      r.temperature,
      eq?.min_temp ?? '',
      eq?.max_temp ?? '',
      r.created_by ?? '',
      r.comment ?? '',
    ]
  })

  // Écriture manuelle pour pouvoir colorer les cellules température hors plage
  const readingsSheetId = await ensureSheet(token, sheetId, 'Relevés du mois')
  await clearRange(token, sheetId, 'Relevés du mois!A:ZZ')
  await writeValues(token, sheetId, 'Relevés du mois!A1', [readingHeaders, ...readingRows])

  // Colorer les cellules température hors plage en rouge
  const redRequests = (readings ?? []).reduce((acc: unknown[], r: Reading, i: number) => {
    const eq = eqById[r.equipment_id]
    if (eq && isOutOfRange(r.temperature, eq)) {
      acc.push(cellColorRequest(readingsSheetId, i + 1, 5, COLORS.red))
    }
    return acc
  }, [])

  const formatRequests = [
    headerFormatRequest(readingsSheetId, 0, readingHeaders.length),
    ...alternatingRowsRequest(readingsSheetId, 1, readingRows.length + 1, readingHeaders.length),
    autoResizeRequest(readingsSheetId, readingHeaders.length),
    freezeFirstRowRequest(readingsSheetId),
    ...redRequests,
  ]
  await batchFormat(token, sheetId, formatRequests)

  // ── Onglet 2 — Récapitulatif semaine ─────────────────────────────────────

  const monday = mondayOf(now)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
  const weekStrs = weekDates.map(dateStr)

  const { data: weekReadings, error: wrErr } = await supabase
    .from('temperature_readings')
    .select('*')
    .gte('date', weekStrs[0])
    .lte('date', weekStrs[6])
  if (wrErr) throw new Error(`temperature_readings semaine: ${wrErr.message}`)

  const recapHeaders = [
    'Équipement', 'Type',
    ...DAYS_FR.map((d, i) => `${d} ${String(weekDates[i].getDate()).padStart(2, '0')}/${String(weekDates[i].getMonth() + 1).padStart(2, '0')}`),
  ]

  const recapRows: CellValue[][] = (equipment ?? []).map((eq: Equipment) => {
    const dayCells: CellValue[] = weekDates.map((_d, i) => {
      const dayStr = weekStrs[i]
      const dayReadings = (weekReadings ?? []).filter((r: Reading) => r.equipment_id === eq.id && r.date === dayStr)
      if (!dayReadings.length) return ''
      // Prendre la dernière lecture du jour (la plus récente par heure)
      const last = dayReadings.sort((a: Reading, b: Reading) => (a.time > b.time ? -1 : 1))[0]
      const flag = isOutOfRange(last.temperature, eq) ? ' ⚠️' : ''
      return `${last.temperature}°C${flag}`
    })
    return [eq.name, eq.type === 'negatif' ? 'Négatif' : 'Positif', ...dayCells]
  })

  // Écriture avec coloration hors plage dans le récap
  const recapSheetId = await ensureSheet(token, sheetId, 'Récapitulatif semaine')
  await clearRange(token, sheetId, 'Récapitulatif semaine!A:ZZ')
  await writeValues(token, sheetId, 'Récapitulatif semaine!A1', [recapHeaders, ...recapRows])

  const recapRedRequests: unknown[] = []
  ;(equipment ?? []).forEach((eq: Equipment, eqIdx: number) => {
    weekDates.forEach((_d, dayIdx) => {
      const dayStr = weekStrs[dayIdx]
      const dayReadings = (weekReadings ?? []).filter((r: Reading) => r.equipment_id === eq.id && r.date === dayStr)
      if (!dayReadings.length) return
      const last = dayReadings.sort((a: Reading, b: Reading) => (a.time > b.time ? -1 : 1))[0]
      if (isOutOfRange(last.temperature, eq)) {
        recapRedRequests.push(cellColorRequest(recapSheetId, eqIdx + 1, dayIdx + 2, COLORS.red))
      }
    })
  })

  const recapFormatRequests = [
    headerFormatRequest(recapSheetId, 0, recapHeaders.length),
    ...alternatingRowsRequest(recapSheetId, 1, recapRows.length + 1, recapHeaders.length),
    autoResizeRequest(recapSheetId, recapHeaders.length),
    freezeFirstRowRequest(recapSheetId),
    ...recapRedRequests,
  ]
  await batchFormat(token, sheetId, recapFormatRequests)
}
