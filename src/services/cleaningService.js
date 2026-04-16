// ─── Cleaning — service Supabase ──────────────────────────────────────────────
import { supabase } from './supabase'

// ══════════════════════════════════════════════════════════════════════════════
// Helpers de conversion
// ══════════════════════════════════════════════════════════════════════════════

function rowToRoom(row) {
  return {
    id:        row.id,
    name:      row.name      ?? '',
    color:     row.color     ?? 'blue',
    active:    row.active    ?? true,
    createdAt: row.created_at,
  }
}

function roomToRow(room) {
  return {
    id:     room.id,
    name:   room.name   ?? '',
    color:  room.color  ?? 'blue',
    active: room.active ?? true,
  }
}

function rowToZone(row) {
  return {
    id:        row.id,
    roomId:    row.room_id,
    name:      row.name   ?? '',
    active:    row.active ?? true,
    createdAt: row.created_at,
  }
}

function zoneToRow(zone) {
  return {
    id:      zone.id,
    room_id: zone.roomId,
    name:    zone.name   ?? '',
    active:  zone.active ?? true,
  }
}

function rowToSubzone(row) {
  return {
    id:        row.id,
    zoneId:    row.zone_id,
    name:      row.name   ?? '',
    active:    row.active ?? true,
    createdAt: row.created_at,
  }
}

function subzoneToRow(subzone) {
  return {
    id:      subzone.id,
    zone_id: subzone.zoneId,
    name:    subzone.name   ?? '',
    active:  subzone.active ?? true,
  }
}

function rowToTask(row) {
  return {
    id:          row.id,
    zoneId:      row.zone_id    ?? null,
    subzoneId:   row.subzone_id ?? null,
    name:        row.name       ?? '',
    product:     row.product    ?? null,
    dosage:      row.dosage     ?? null,
    frequency:   row.frequency  ?? 'daily',
    dayOfWeek:   row.day_of_week  ?? null,
    cycleStart:  row.cycle_start  ?? null,
    protocol:    row.protocol   ?? [],
    active:      row.active     ?? true,
    createdAt:   row.created_at,
  }
}

function taskToRow(task) {
  return {
    id:          task.id,
    zone_id:     task.zoneId    ?? null,
    subzone_id:  task.subzoneId ?? null,
    name:        task.name      ?? '',
    product:     task.product   ?? null,
    dosage:      task.dosage    ?? null,
    frequency:   task.frequency ?? 'daily',
    day_of_week: task.dayOfWeek  ?? null,
    cycle_start: task.cycleStart ?? null,
    protocol:    task.protocol  ?? [],
    active:      task.active    ?? true,
  }
}

function rowToRecord(row) {
  return {
    id:            row.id,
    taskId:        row.task_id,
    scheduledDate: row.scheduled_date,
    completedAt:   row.completed_at ?? null,
    authorId:      row.author_id    ?? null,
    status:        row.status       ?? 'done',
    note:          row.note         ?? null,
    createdAt:     row.created_at,
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function recordToRow(record) {
  return {
    id:             record.id,
    task_id:        record.taskId,
    scheduled_date: record.scheduledDate,
    completed_at:   record.completedAt ?? null,
    author_id:      record.authorId && UUID_RE.test(record.authorId) ? record.authorId : null,
    status:         record.status      ?? 'done',
    note:           record.note        ?? null,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Rooms
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchRooms() {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data.map(rowToRoom)
}

export async function upsertRoom(room) {
  const { error } = await supabase
    .from('rooms')
    .upsert(roomToRow(room), { onConflict: 'id' })
  if (error) throw error
}

export async function deleteRoom(id) {
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ══════════════════════════════════════════════════════════════════════════════
// Zones
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchZones() {
  const { data, error } = await supabase
    .from('cleaning_zones')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data.map(rowToZone)
}

export async function upsertZone(zone) {
  const { error } = await supabase
    .from('cleaning_zones')
    .upsert(zoneToRow(zone), { onConflict: 'id' })
  if (error) throw error
}

export async function upsertZones(zones) {
  const { error } = await supabase
    .from('cleaning_zones')
    .upsert(zones.map(zoneToRow), { onConflict: 'id' })
  if (error) throw error
}

export async function deleteZone(id) {
  const { error } = await supabase
    .from('cleaning_zones')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function deleteZonesByRoom(roomId) {
  const { error } = await supabase
    .from('cleaning_zones')
    .delete()
    .eq('room_id', roomId)
  if (error) throw error
}

// ══════════════════════════════════════════════════════════════════════════════
// Subzones
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchSubzones() {
  const { data, error } = await supabase
    .from('cleaning_subzones')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data.map(rowToSubzone)
}

export async function upsertSubzone(subzone) {
  const { error } = await supabase
    .from('cleaning_subzones')
    .upsert(subzoneToRow(subzone), { onConflict: 'id' })
  if (error) throw error
}

export async function upsertSubzones(subzones) {
  const { error } = await supabase
    .from('cleaning_subzones')
    .upsert(subzones.map(subzoneToRow), { onConflict: 'id' })
  if (error) throw error
}

export async function deleteSubzone(id) {
  const { error } = await supabase
    .from('cleaning_subzones')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function deleteSubzonesByZone(zoneId) {
  const { error } = await supabase
    .from('cleaning_subzones')
    .delete()
    .eq('zone_id', zoneId)
  if (error) throw error
}

// ══════════════════════════════════════════════════════════════════════════════
// Tasks
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchTasks() {
  const { data, error } = await supabase
    .from('cleaning_tasks')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data.map(rowToTask)
}

export async function upsertTask(task) {
  const { error } = await supabase
    .from('cleaning_tasks')
    .upsert(taskToRow(task), { onConflict: 'id' })
  if (error) throw error
}

export async function upsertTasks(tasks) {
  const { error } = await supabase
    .from('cleaning_tasks')
    .upsert(tasks.map(taskToRow), { onConflict: 'id' })
  if (error) throw error
}

export async function deleteTask(id) {
  const { error } = await supabase
    .from('cleaning_tasks')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function deleteTasksByZone(zoneId) {
  const { error } = await supabase
    .from('cleaning_tasks')
    .delete()
    .eq('zone_id', zoneId)
  if (error) throw error
}

export async function deleteTasksBySubzone(subzoneId) {
  const { error } = await supabase
    .from('cleaning_tasks')
    .delete()
    .eq('subzone_id', subzoneId)
  if (error) throw error
}

// ══════════════════════════════════════════════════════════════════════════════
// Records
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchRecords() {
  const { data, error } = await supabase
    .from('cleaning_records')
    .select('*')
    .order('scheduled_date', { ascending: false })
  if (error) throw error
  return data.map(rowToRecord)
}

export async function upsertRecord(record) {
  const { error } = await supabase
    .from('cleaning_records')
    .upsert(recordToRow(record), { onConflict: 'id' })
  if (error) throw error
}

export async function deleteRecord(taskId, scheduledDate) {
  const { error } = await supabase
    .from('cleaning_records')
    .delete()
    .eq('task_id', taskId)
    .eq('scheduled_date', scheduledDate)
  if (error) throw error
}

export async function deleteRecordsByTask(taskId) {
  const { error } = await supabase
    .from('cleaning_records')
    .delete()
    .eq('task_id', taskId)
  if (error) throw error
}
