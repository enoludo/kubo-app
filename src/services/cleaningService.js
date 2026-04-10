// ─── Cleaning — service Supabase ──────────────────────────────────────────────
import { supabase } from './supabase'

// ══════════════════════════════════════════════════════════════════════════════
// Conversion helpers
// ══════════════════════════════════════════════════════════════════════════════

function rowToZone(row) {
  return {
    id:        row.id,
    name:      row.name      ?? '',
    color:     row.color     ?? 'blue',
    createdAt: row.created_at,
  }
}

function zoneToRow(zone) {
  return {
    id:    zone.id,
    name:  zone.name  ?? '',
    color: zone.color ?? 'blue',
  }
}

function rowToTask(row) {
  return {
    id:           row.id,
    name:         row.name         ?? '',
    zone:         row.zone_id,
    frequency:    row.frequency    ?? 'daily',
    dayOfWeek:    row.day_of_week  ?? null,
    protocol:     row.protocol     ?? [],
    product:      row.product      ?? null,
    duration_min: row.duration_min ?? 15,
    active:       row.active       ?? true,
    createdAt:    row.created_at,
  }
}

function taskToRow(task) {
  return {
    id:           task.id,
    name:         task.name         ?? '',
    zone_id:      task.zone,
    frequency:    task.frequency    ?? 'daily',
    day_of_week:  task.dayOfWeek    ?? null,
    protocol:     task.protocol     ?? [],
    product:      task.product      ?? null,
    duration_min: task.duration_min ?? 15,
    active:       task.active       ?? true,
  }
}

function rowToRecord(row) {
  return {
    id:            row.id,
    taskId:        row.task_id,
    scheduledDate: row.scheduled_date,
    completedAt:   row.completed_at   ?? null,
    authorId:      row.author_id      ?? null,
    status:        row.status         ?? 'done',
    note:          row.note           ?? null,
    createdAt:     row.created_at,
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function recordToRow(record) {
  return {
    id:             record.id,
    task_id:        record.taskId,
    scheduled_date: record.scheduledDate,
    completed_at:   record.completedAt  ?? null,
    author_id:      record.authorId && UUID_RE.test(record.authorId) ? record.authorId : null,
    status:         record.status       ?? 'done',
    note:           record.note         ?? null,
  }
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
