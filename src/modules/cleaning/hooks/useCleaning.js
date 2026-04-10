// ─── Hook — état et logique du module Nettoyage ───────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { dateToStr }                   from '../../../utils/date'
import {
  fetchZones,    upsertZone,    upsertZones,   deleteZone    as deleteZoneSupabase,
  fetchTasks,    upsertTask,    upsertTasks,   deleteTask    as deleteTaskSupabase,
                                               deleteTasksByZone,
  fetchRecords,  upsertRecord,  deleteRecord  as deleteRecordSupabase,
                                               deleteRecordsByTask,
} from '../../../services/cleaningService'

const TASKS_KEY   = 'kubo_cleaning_tasks'
const RECORDS_KEY = 'kubo_cleaning_records'
const ZONES_KEY   = 'kubo_cleaning_zones'
const DEBOUNCE_MS = 500

// ── Persistance locale ────────────────────────────────────────────────────────

function loadTasks() {
  try {
    const raw = localStorage.getItem(TASKS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveTasks(tasks) {
  try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)) } catch {}
}

function saveRecords(records) {
  try { localStorage.setItem(RECORDS_KEY, JSON.stringify(records)) } catch {}
}

function loadZones() {
  try {
    const raw = localStorage.getItem(ZONES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveZones(zones) {
  try { localStorage.setItem(ZONES_KEY, JSON.stringify(zones)) } catch {}
}

// ── Helpers purs — scheduling ─────────────────────────────────────────────────

/**
 * Retourne true si la tâche est planifiée pour la date donnée.
 * date : objet Date
 */
export function isTaskScheduledForDate(task, date) {
  if (!task.active) return false

  const dow = date.getDay() // 0 = dim, 1 = lun, …, 6 = sam

  switch (task.frequency) {
    case 'daily':
      return true

    case 'weekly':
      // dayOfWeek suit la convention JS (0-6, 0 = dimanche)
      return task.dayOfWeek === dow

    case 'monthly': {
      // 1ère semaine du mois : le jour est entre le 1er et le 7
      const dayOfMonth = date.getDate()
      return dayOfMonth <= 7
    }

    case 'quarterly': {
      // Mois de début de trimestre : janvier, avril, juillet, octobre
      const month = date.getMonth() + 1 // 1-12
      const dayOfMonth = date.getDate()
      return [1, 4, 7, 10].includes(month) && dayOfMonth <= 7
    }

    default:
      return false
  }
}

/**
 * Retourne le statut d'une tâche pour une date donnée.
 * Calcul à l'affichage, pas stocké.
 * - 'done'    : un record existe avec completedAt
 * - 'late'    : date passée, pas de record
 * - 'pending' : date future ou aujourd'hui, pas encore fait
 */
export function getTaskStatus(taskId, dateStr, records) {
  const record = records.find(r => r.taskId === taskId && r.scheduledDate === dateStr)
  if (record?.completedAt) return 'done'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const taskDate = new Date(dateStr + 'T00:00:00')

  if (taskDate < today) return 'late'
  return 'pending'
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCleaning() {
  const [tasks,   setTasks]   = useState(loadTasks)
  const [records, setRecords] = useState(loadRecords)
  const [zones,   setZones]   = useState(loadZones)

  const debounceTasksRef   = useRef(null)
  const debounceRecordsRef = useRef(null)
  const debounceZonesRef   = useRef(null)

  useEffect(() => {
    clearTimeout(debounceTasksRef.current)
    debounceTasksRef.current = setTimeout(() => saveTasks(tasks), DEBOUNCE_MS)
  }, [tasks])

  useEffect(() => {
    clearTimeout(debounceRecordsRef.current)
    debounceRecordsRef.current = setTimeout(() => saveRecords(records), DEBOUNCE_MS)
  }, [records])

  useEffect(() => {
    clearTimeout(debounceZonesRef.current)
    debounceZonesRef.current = setTimeout(() => saveZones(zones), DEBOUNCE_MS)
  }, [zones])

  // ── Chargement Supabase au montage ────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const supabaseZones = await fetchZones()
        if (supabaseZones.length > 0) {
          setZones(supabaseZones)
          console.log('[supabase] zones chargées:', supabaseZones.length)
        }
      } catch (err) { console.error('[supabase] fetchZones:', err.message) }

      try {
        const supabaseTasks = await fetchTasks()
        if (supabaseTasks.length > 0) {
          setTasks(supabaseTasks)
          console.log('[supabase] tâches chargées:', supabaseTasks.length)
        }
      } catch (err) { console.error('[supabase] fetchTasks:', err.message) }

      try {
        const supabaseRecords = await fetchRecords()
        if (supabaseRecords.length > 0) {
          setRecords(supabaseRecords)
          console.log('[supabase] records chargés:', supabaseRecords.length)
        }
      } catch (err) { console.error('[supabase] fetchRecords:', err.message) }
    }

    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Requêtes ──────────────────────────────────────────────────────────────

  /** Tâches actives planifiées pour une date, avec leur statut calculé. */
  function getTasksForDay(date, dateStr) {
    return tasks
      .filter(t => isTaskScheduledForDate(t, date))
      .map(t => ({
        ...t,
        status: getTaskStatus(t.id, dateStr, records),
      }))
  }

  /** Record existant pour une tâche à une date. */
  function getRecordForDay(taskId, dateStr) {
    return records.find(r => r.taskId === taskId && r.scheduledDate === dateStr) ?? null
  }

  /**
   * Statistiques de complétion d'une zone sur la semaine.
   * Retourne { done, total }
   */
  function getZoneStats(zone, weekDates) {
    const zoneTasks = tasks.filter(t => t.zone === zone && t.active)
    let total = 0
    let done  = 0

    for (const date of weekDates) {
      const dateStr = dateToStr(date)
      for (const task of zoneTasks) {
        if (!isTaskScheduledForDate(task, date)) continue
        total++
        const status = getTaskStatus(task.id, dateStr, records)
        if (status === 'done') done++
      }
    }

    return { done, total }
  }

  /** Nombre de tâches actives dans une zone. */
  function getZoneActiveCount(zone) {
    return tasks.filter(t => t.zone === zone && t.active).length
  }

  // ── Mutations records ─────────────────────────────────────────────────────

  /** Marque une tâche comme faite pour une date. */
  function markDone(taskId, dateStr, authorId = null, note = null) {
    const record = {
      id:            crypto.randomUUID(),
      taskId,
      scheduledDate: dateStr,
      completedAt:   new Date().toISOString(),
      authorId,
      status:        'done',
      note,
      createdAt:     new Date().toISOString(),
    }
    setRecords(prev => [
      ...prev.filter(r => !(r.taskId === taskId && r.scheduledDate === dateStr)),
      record,
    ])
    upsertRecord(record).catch(err => console.error('[supabase] markDone:', err.message))
  }

  /** Annule la validation d'une tâche pour une date. */
  function unmarkDone(taskId, dateStr) {
    setRecords(prev => prev.filter(r => !(r.taskId === taskId && r.scheduledDate === dateStr)))
    deleteRecordSupabase(taskId, dateStr).catch(err => console.error('[supabase] unmarkDone:', err.message))
  }

  // ── Mutations tâches ──────────────────────────────────────────────────────

  function addTask(data) {
    const task = {
      id:           crypto.randomUUID(),
      name:         data.name,
      zone:         data.zone,
      frequency:    data.frequency,
      dayOfWeek:    data.dayOfWeek ?? null,
      protocol:     data.protocol ?? [],
      product:      data.product  ?? null,
      duration_min: Number(data.duration_min) || 15,
      active:       true,
      createdAt:    new Date().toISOString(),
    }
    setTasks(prev => [...prev, task])
    upsertTask(task).catch(err => console.error('[supabase] addTask:', err.message))
  }

  function updateTask(id, updates) {
    let updated
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      updated = { ...t, ...updates }
      return updated
    }))
    if (updated) upsertTask(updated).catch(err => console.error('[supabase] updateTask:', err.message))
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
    setRecords(prev => prev.filter(r => r.taskId !== id))
    deleteTaskSupabase(id).catch(err => console.error('[supabase] deleteTask:', err.message))
    deleteRecordsByTask(id).catch(err => console.error('[supabase] deleteRecordsByTask:', err.message))
  }

  // ── Mutations zones ───────────────────────────────────────────────────────

  function addZone(data, tasksData = []) {
    const id = crypto.randomUUID()
    const zone = {
      id,
      name:      data.name.trim(),
      color:     data.color ?? 'blue',
      createdAt: new Date().toISOString(),
    }
    setZones(prev => [...prev, zone])
    upsertZone(zone).catch(err => console.error('[supabase] addZone:', err.message))
    tasksData.forEach(t => addTask({ ...t, zone: id }))
  }

  function updateZone(id, updates, tasksData = null) {
    let updatedZone
    setZones(prev => prev.map(z => {
      if (z.id !== id) return z
      updatedZone = { ...z, ...updates }
      return updatedZone
    }))
    if (updatedZone) upsertZone(updatedZone).catch(err => console.error('[supabase] updateZone:', err.message))

    if (tasksData !== null) {
      // Supprime les tâches existantes de la zone, recrée
      const newTasks = tasksData.map(t => ({
        id:           t.id ?? crypto.randomUUID(),
        name:         t.name,
        zone:         id,
        frequency:    t.frequency,
        dayOfWeek:    t.dayOfWeek ?? null,
        protocol:     t.protocol  ?? [],
        product:      t.product   ?? null,
        duration_min: Number(t.duration_min) || 15,
        active:       t.active ?? true,
        createdAt:    t.createdAt ?? new Date().toISOString(),
      }))
      setTasks(prev => [...prev.filter(t => t.zone !== id), ...newTasks])
      deleteTasksByZone(id)
        .then(() => upsertTasks(newTasks))
        .catch(err => console.error('[supabase] updateZone tasks:', err.message))
    }
  }

  function deleteZone(id) {
    setZones(prev => prev.filter(z => z.id !== id))
    setTasks(prev => prev.filter(t => t.zone !== id))
    setRecords(prev => prev.filter(r => {
      const task = tasks.find(t => t.id === r.taskId)
      return task ? task.zone !== id : true
    }))
    // CASCADE ON DELETE handles tasks + records in Supabase
    deleteZoneSupabase(id).catch(err => console.error('[supabase] deleteZone:', err.message))
  }

  return {
    tasks,
    records,
    zones,
    getTasksForDay,
    getRecordForDay,
    getZoneStats,
    getZoneActiveCount,
    markDone,
    unmarkDone,
    addTask,
    updateTask,
    deleteTask,
    addZone,
    updateZone,
    deleteZone,
  }
}

