// ─── Planning — service Supabase ───────────────────────────────────────────────
import { supabase } from './supabase'

// ══════════════════════════════════════════════════════════════════════════════
// Conversion helpers  camelCase (frontend) ↔ snake_case (Supabase)
// ══════════════════════════════════════════════════════════════════════════════

function rowToEmployee(row) {
  return {
    id:           row.id,
    name:         row.name          ?? '',
    role:         row.role          ?? '',
    email:        row.email         ?? '',
    phone:        row.phone         ?? '',
    color:        row.color         ?? '',
    initials:     row.initials      ?? '',
    contract:     row.contract      ?? 35,
    startBalance: row.start_balance ?? 0,
    archived:     row.archived      ?? false,
  }
}

function employeeToRow(emp) {
  return {
    id:            emp.id,
    name:          emp.name          ?? '',
    role:          emp.role          ?? null,
    email:         emp.email         ?? null,
    phone:         emp.phone         ?? null,
    color:         emp.color         ?? null,
    initials:      emp.initials      ?? null,
    contract:      emp.contract      ?? 35,
    start_balance: emp.startBalance  ?? 0,
    archived:      emp.archived      ?? false,
  }
}

function rowToShift(row) {
  return {
    id:                    row.id,
    employeeId:            row.employee_id,
    date:                  row.date,
    type:                  row.type           ?? 'work',
    startHour:             row.start_hour,
    endHour:               row.end_hour,
    pause:                 row.pause          ?? 0,
    validated:             row.validated      ?? false,
    schoolAbsence:         row.school_absence ?? false,
    schoolAbsenceDuration: row.school_absence_duration ?? null,
  }
}

function shiftToRow(shift) {
  return {
    id:                      shift.id,
    employee_id:             shift.employeeId,
    date:                    shift.date,
    type:                    shift.type           ?? 'work',
    start_hour:              shift.startHour      ?? null,
    end_hour:                shift.endHour        ?? null,
    pause:                   shift.pause          ?? 0,
    validated:               shift.validated      ?? false,
    school_absence:          shift.schoolAbsence  ?? false,
    school_absence_duration: shift.schoolAbsenceDuration ?? null,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Employees
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name')
  if (error) throw error
  return data.map(rowToEmployee)
}

export async function upsertEmployee(emp) {
  const { error } = await supabase
    .from('employees')
    .upsert(employeeToRow(emp), { onConflict: 'id' })
  if (error) throw error
}

export async function deleteEmployee(id) {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ══════════════════════════════════════════════════════════════════════════════
// Shifts
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchShifts() {
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .order('date')
  if (error) throw error
  return data.map(rowToShift)
}

export async function upsertShift(shift) {
  const { error } = await supabase
    .from('shifts')
    .upsert(shiftToRow(shift), { onConflict: 'id' })
  if (error) throw error
}

export async function upsertShifts(shifts) {
  if (!shifts.length) return
  const { error } = await supabase
    .from('shifts')
    .upsert(shifts.map(shiftToRow), { onConflict: 'id' })
  if (error) throw error
}

export async function deleteShift(id) {
  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function deleteShifts(ids) {
  if (!ids.length) return
  const { error } = await supabase
    .from('shifts')
    .delete()
    .in('id', ids)
  if (error) throw error
}
