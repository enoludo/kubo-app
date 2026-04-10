// ─── Temperatures — service Supabase ──────────────────────────────────────────
import { supabase } from './supabase'

// ══════════════════════════════════════════════════════════════════════════════
// Conversion helpers
// ══════════════════════════════════════════════════════════════════════════════

function rowToEquipment(row) {
  return {
    id:         row.id,
    slug:       row.slug       ?? null,
    name:       row.name       ?? '',
    type:       row.type       ?? 'positif',
    minTemp:    row.min_temp   ?? 0,
    maxTemp:    row.max_temp   ?? 10,
    colorIndex: row.color_index ?? 0,
    order:      row.order      ?? 0,
    active:     row.active     ?? true,
    createdAt:  row.created_at,
  }
}

function equipmentToRow(eq) {
  return {
    name:        eq.name       ?? '',
    type:        eq.type       ?? 'positif',
    min_temp:    Number(eq.minTemp),
    max_temp:    Number(eq.maxTemp),
    color_index: eq.colorIndex ?? 0,
    order:       eq.order      ?? 0,
    active:      eq.active     ?? true,
    slug:        eq.slug ?? eq.id ?? null,  // slug = id legacy (ex: "eq-joel")
  }
}

function rowToReading(row) {
  return {
    id:          row.id,
    equipmentId: row.equipment_id,
    date:        row.date,
    slot:        row.slot       ?? null,
    time:        row.time,
    temperature: row.temperature,
    comment:     row.comment    ?? null,
    authorId:    row.author_id  ?? null,
    createdBy:   row.created_by ?? null,
    createdAt:   row.created_at,
  }
}

function readingToRow(reading, supabaseEquipmentId) {
  return {
    id:           reading.id,
    equipment_id: supabaseEquipmentId ?? reading.equipmentId,
    date:         reading.date,
    slot:         reading.slot    ?? null,
    time:         reading.time,
    temperature:  Number(reading.temperature),
    comment:      reading.comment ?? null,
    author_id:    reading.authorId ?? null,
    created_by:   reading.createdBy ?? null,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Equipments
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchEquipments() {
  const { data, error } = await supabase
    .from('equipments')
    .select('*')
    .order('order')
  if (error) throw error
  return data.map(rowToEquipment)
}

// Upsert par slug (= id legacy ou uuid) — retourne l'id Supabase réel
export async function upsertEquipment(eq) {
  const row = equipmentToRow(eq)
  const { data, error } = await supabase
    .from('equipments')
    .upsert(row, { onConflict: 'slug' })
    .select('id, slug')
    .single()
  if (error) throw error
  return data
}

export async function upsertEquipments(equipments) {
  const rows = equipments.map(equipmentToRow)
  const { data, error } = await supabase
    .from('equipments')
    .upsert(rows, { onConflict: 'slug' })
    .select('id, slug')
  if (error) throw error
  return data  // [{ id, slug }] — mapping slug → supabase id
}

export async function updateEquipment(id, updates) {
  const { error } = await supabase
    .from('equipments')
    .update({
      name:        updates.name,
      type:        updates.type,
      min_temp:    updates.minTemp !== undefined ? Number(updates.minTemp) : undefined,
      max_temp:    updates.maxTemp !== undefined ? Number(updates.maxTemp) : undefined,
      color_index: updates.colorIndex,
      order:       updates.order,
      active:      updates.active,
    })
    .eq('id', id)
  if (error) throw error
}

// ══════════════════════════════════════════════════════════════════════════════
// Readings
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchReadings() {
  const { data, error } = await supabase
    .from('temperature_readings')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return data.map(rowToReading)
}

// Remplace tous les relevés d'un équipement pour une date (delete + insert)
export async function saveReadingsForDay(supabaseEquipmentId, date, readings) {
  const { error: delErr } = await supabase
    .from('temperature_readings')
    .delete()
    .eq('equipment_id', supabaseEquipmentId)
    .eq('date', date)
  if (delErr) throw delErr

  if (readings.length > 0) {
    const rows = readings.map(r => readingToRow(r, supabaseEquipmentId))
    const { error: insErr } = await supabase
      .from('temperature_readings')
      .insert(rows)
    if (insErr) throw insErr
  }
}

export async function deleteReading(id) {
  const { error } = await supabase
    .from('temperature_readings')
    .delete()
    .eq('id', id)
  if (error) throw error
}
