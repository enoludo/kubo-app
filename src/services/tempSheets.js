// ─── Google Sheets — Module Températures ─────────────────────────────────────
//
// Deux feuilles dans le même spreadsheet :
//   "TempEquipements" — liste des équipements (id, name, type, min, max, color, order, active)
//   "TempReleves"     — tous les relevés    (id, equipmentId, date, slot, time, temperature, createdBy, createdAt)

import { ensureSheet, readValues, writeValues, clearRange } from './googleSheets'
import { COLOR_PALETTE } from '../modules/temperatures/utils/tempColors.jsx'

const colorKeyToIndex = Object.fromEntries(COLOR_PALETTE.map((c, i) => [c.key, i]))

const EQUIP_SHEET    = 'TempEquipements'
const READINGS_SHEET = 'TempReleves'

// ── En-têtes ──────────────────────────────────────────────────────────────────

const EQUIP_HDR = [
  'id', 'name', 'type', 'minTemp', 'maxTemp', 'color', 'order', 'active', 'createdAt',
]

const READINGS_HDR = [
  'id', 'equipmentId', 'date', 'slot', 'time', 'temperature', 'comment', 'authorId', 'createdBy', 'createdAt',
]

// ── Sérialiseurs ──────────────────────────────────────────────────────────────

function equipToRow(e) {
  return [
    e.id, e.name, e.type,
    e.minTemp, e.maxTemp,
    COLOR_PALETTE[e.colorIndex]?.key ?? 'blue',
    e.order, e.active ? 'true' : 'false',
    e.createdAt ?? '',
  ]
}

function rowToEquip(r) {
  return {
    id:         String(r[0] ?? ''),
    name:       String(r[1] ?? ''),
    type:       String(r[2] ?? 'positif'),
    minTemp:    Number(r[3] ?? 0),
    maxTemp:    Number(r[4] ?? 5),
    colorIndex: colorKeyToIndex[String(r[5] ?? '')] ?? 0,
    order:      Number(r[6] ?? 0),
    active:     String(r[7] ?? 'true') !== 'false',
    createdAt:  String(r[8] ?? ''),
  }
}

function readingToRow(r) {
  return [
    r.id, r.equipmentId, r.date, r.slot, r.time,
    r.temperature,
    r.comment   ?? '',
    r.authorId  ?? '',
    r.createdBy ?? '',
    r.createdAt ?? '',
  ]
}

function rowToReading(r) {
  return {
    id:          String(r[0] ?? ''),
    equipmentId: String(r[1] ?? ''),
    date:        String(r[2] ?? ''),
    slot:        String(r[3] ?? 'extra'),
    time:        String(r[4] ?? ''),
    temperature: Number(r[5] ?? 0),
    comment:     r[6] ? String(r[6]) : null,
    authorId:    r[7] ? String(r[7]) : null,
    createdBy:   r[8] ? String(r[8]) : null,
    createdAt:   String(r[9] ?? ''),
  }
}

// ── Équipements ───────────────────────────────────────────────────────────────

export async function writeEquipmentToSheet(token, equipment) {
  await ensureSheet(token, EQUIP_SHEET)
  await clearRange(token, `${EQUIP_SHEET}!A:I`)
  const rows = [EQUIP_HDR, ...equipment.map(equipToRow)]
  await writeValues(token, `${EQUIP_SHEET}!A1`, rows)
  console.log('[tempSheets] writeEquipmentToSheet —', equipment.length, 'équipements')
}

export async function readEquipmentFromSheet(token) {
  console.log('[tempSheets] readEquipmentFromSheet — lecture…')
  try {
    const rows = await readValues(token, `${EQUIP_SHEET}!A:I`)
    // Skip header row
    const data = rows.slice(1).filter(r => r[0]).map(rowToEquip)
    console.log('[tempSheets] readEquipmentFromSheet —', data.length, 'équipements')
    return data
  } catch (e) {
    console.warn('[tempSheets] readEquipmentFromSheet — erreur:', e.message)
    if (e.status === 400 || String(e.message).includes('Unable to parse range')) return []
    throw e
  }
}

// ── Relevés ───────────────────────────────────────────────────────────────────

export async function writeReadingsToSheet(token, readings) {
  await ensureSheet(token, READINGS_SHEET)
  await clearRange(token, `${READINGS_SHEET}!A:J`)
  const rows = [READINGS_HDR, ...readings.map(readingToRow)]
  await writeValues(token, `${READINGS_SHEET}!A1`, rows)
  console.log('[tempSheets] writeReadingsToSheet —', readings.length, 'relevés')
}

export async function readReadingsFromSheet(token) {
  console.log('[tempSheets] readReadingsFromSheet — lecture…')
  try {
    const rows = await readValues(token, `${READINGS_SHEET}!A:J`)
    const data = rows.slice(1).filter(r => r[0]).map(rowToReading)
    console.log('[tempSheets] readReadingsFromSheet —', data.length, 'relevés')
    return data
  } catch (e) {
    console.warn('[tempSheets] readReadingsFromSheet — erreur:', e.message)
    if (e.status === 400 || String(e.message).includes('Unable to parse range')) return []
    throw e
  }
}
