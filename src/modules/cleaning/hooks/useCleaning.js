// ─── Hook — état et logique du module Nettoyage ───────────────────────────────
import { useState, useEffect } from 'react'
import { dateToStr }           from '../../../utils/date'
import {
  fetchRooms,    upsertRoom,    deleteRoom    as deleteRoomSupabase,
  fetchZones,    upsertZone,    upsertZones,   deleteZone    as deleteZoneSupabase,
                                               deleteZonesByRoom,
  fetchSubzones, upsertSubzone, upsertSubzones, deleteSubzone as deleteSubzoneSupabase,
                                               deleteSubzonesByZone,
  fetchTasks,    upsertTask,    upsertTasks,   deleteTask    as deleteTaskSupabase,
                                               deleteTasksByZone,
                                               deleteTasksBySubzone,
  fetchRecords,  upsertRecord,  deleteRecord  as deleteRecordSupabase,
                                               deleteRecordsByTask,
} from '../../../services/cleaningService'

// ── Helpers purs — scheduling ─────────────────────────────────────────────────

export function isTaskScheduledForDate(task, date) {
  if (!task.active) return false
  const dow        = date.getDay()
  const month      = date.getMonth() + 1
  const dayOfMonth = date.getDate()

  switch (task.frequency) {
    case 'daily':
      return true
    case 'weekly':
      return task.dayOfWeek === dow
    case 'monthly':
      return dayOfMonth <= 7
    case 'quarterly':
      return [1, 4, 7, 10].includes(month) && dayOfMonth <= 7
    case 'semiannual': {
      const start  = task.cycleStart ?? 1
      const second = ((start - 1 + 6) % 12) + 1
      return [start, second].includes(month) && dayOfMonth <= 7
    }
    default:
      return false
  }
}

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
  const [rooms,    setRooms]    = useState([])
  const [zones,    setZones]    = useState([])
  const [subzones, setSubzones] = useState([])
  const [tasks,    setTasks]    = useState([])
  const [records,  setRecords]  = useState([])

  // Chargement Supabase au montage
  useEffect(() => {
    async function load() {
      try {
        setRooms(await fetchRooms())
        console.log('[supabase] rooms chargées')
      } catch (err) { console.error('[supabase] fetchRooms:', err.message) }

      try {
        setZones(await fetchZones())
        console.log('[supabase] zones chargées')
      } catch (err) { console.error('[supabase] fetchZones:', err.message) }

      try {
        setSubzones(await fetchSubzones())
        console.log('[supabase] sous-zones chargées')
      } catch (err) { console.error('[supabase] fetchSubzones:', err.message) }

      try {
        setTasks(await fetchTasks())
        console.log('[supabase] tâches chargées')
      } catch (err) { console.error('[supabase] fetchTasks:', err.message) }

      try {
        setRecords(await fetchRecords())
        console.log('[supabase] records chargés')
      } catch (err) { console.error('[supabase] fetchRecords:', err.message) }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Requêtes ──────────────────────────────────────────────────────────────

  function getTasksForDay(date, dateStr) {
    return tasks
      .filter(t => isTaskScheduledForDate(t, date))
      .map(t => ({ ...t, status: getTaskStatus(t.id, dateStr, records) }))
  }

  function getRecordForDay(taskId, dateStr) {
    return records.find(r => r.taskId === taskId && r.scheduledDate === dateStr) ?? null
  }

  /** Statistiques pour une room sur une semaine */
  function getRoomStats(roomId, weekDates) {
    const roomZoneIds    = zones.filter(z => z.roomId === roomId).map(z => z.id)
    const roomSubzoneIds = subzones.filter(s => roomZoneIds.includes(s.zoneId)).map(s => s.id)
    const roomTasks      = tasks.filter(t =>
      t.active && (
        roomZoneIds.includes(t.zoneId) ||
        roomSubzoneIds.includes(t.subzoneId)
      )
    )

    let total = 0, done = 0
    for (const date of weekDates) {
      const dateStr = dateToStr(date)
      for (const task of roomTasks) {
        if (!isTaskScheduledForDate(task, date)) continue
        total++
        if (getTaskStatus(task.id, dateStr, records) === 'done') done++
      }
    }
    return { done, total }
  }

  function getRoomActiveTaskCount(roomId) {
    const roomZoneIds    = zones.filter(z => z.roomId === roomId).map(z => z.id)
    const roomSubzoneIds = subzones.filter(s => roomZoneIds.includes(s.zoneId)).map(s => s.id)
    return tasks.filter(t =>
      t.active && (
        roomZoneIds.includes(t.zoneId) ||
        roomSubzoneIds.includes(t.subzoneId)
      )
    ).length
  }

  /** Toutes les tâches planifiées pour un jour, liées à une room */
  function getTasksForRoomDay(roomId, date, dateStr) {
    const roomZoneIds    = zones.filter(z => z.roomId === roomId).map(z => z.id)
    const roomSubzoneIds = subzones.filter(s => roomZoneIds.includes(s.zoneId)).map(s => s.id)
    return tasks
      .filter(t =>
        isTaskScheduledForDate(t, date) &&
        (roomZoneIds.includes(t.zoneId) || roomSubzoneIds.includes(t.subzoneId))
      )
      .map(t => ({ ...t, status: getTaskStatus(t.id, dateStr, records) }))
  }

  // ── Mutations records ─────────────────────────────────────────────────────

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

  function unmarkDone(taskId, dateStr) {
    setRecords(prev => prev.filter(r => !(r.taskId === taskId && r.scheduledDate === dateStr)))
    deleteRecordSupabase(taskId, dateStr).catch(err => console.error('[supabase] unmarkDone:', err.message))
  }

  // ── Mutations tâches ──────────────────────────────────────────────────────

  function addTask(data) {
    const task = {
      id:          crypto.randomUUID(),
      zoneId:      data.zoneId    ?? null,
      subzoneId:   data.subzoneId ?? null,
      name:        data.name,
      product:     data.product   ?? null,
      dosage:      data.dosage    ?? null,
      frequency:   data.frequency ?? 'daily',
      dayOfWeek:   data.dayOfWeek ?? null,
      cycleStart:  data.cycleStart ?? null,
      protocol:    data.protocol  ?? [],
      active:      data.active    ?? true,
      createdAt:   new Date().toISOString(),
    }
    setTasks(prev => [...prev, task])
    upsertTask(task).catch(err => console.error('[supabase] addTask:', err.message))
    return task.id
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

  // ── Mutations sous-zones ──────────────────────────────────────────────────

  function addSubzone(data) {
    const subzone = {
      id:        crypto.randomUUID(),
      zoneId:    data.zoneId,
      name:      data.name.trim(),
      active:    data.active ?? true,
      createdAt: new Date().toISOString(),
    }
    setSubzones(prev => [...prev, subzone])
    upsertSubzone(subzone).catch(err => console.error('[supabase] addSubzone:', err.message))
    return subzone.id
  }

  function updateSubzone(id, updates, tasksData = null) {
    let updated
    setSubzones(prev => prev.map(s => {
      if (s.id !== id) return s
      updated = { ...s, ...updates }
      return updated
    }))
    if (updated) upsertSubzone(updated).catch(err => console.error('[supabase] updateSubzone:', err.message))

    if (tasksData !== null) {
      const newTasks = tasksData.map(t => ({
        id:         t.id ?? crypto.randomUUID(),
        zoneId:     null,
        subzoneId:  id,
        name:       t.name,
        product:    t.product   ?? null,
        dosage:     t.dosage    ?? null,
        frequency:  t.frequency ?? 'daily',
        dayOfWeek:  t.dayOfWeek ?? null,
        cycleStart: t.cycleStart ?? null,
        protocol:   t.protocol  ?? [],
        active:     t.active    ?? true,
        createdAt:  t.createdAt ?? new Date().toISOString(),
      }))
      setTasks(prev => [...prev.filter(t => t.subzoneId !== id), ...newTasks])
      deleteTasksBySubzone(id)
        .then(() => upsertTasks(newTasks))
        .catch(err => console.error('[supabase] updateSubzone tasks:', err.message))
    }
  }

  function deleteSubzone(id) {
    setSubzones(prev => prev.filter(s => s.id !== id))
    const removedTaskIds = tasks.filter(t => t.subzoneId === id).map(t => t.id)
    setTasks(prev => prev.filter(t => t.subzoneId !== id))
    setRecords(prev => prev.filter(r => !removedTaskIds.includes(r.taskId)))
    deleteSubzoneSupabase(id).catch(err => console.error('[supabase] deleteSubzone:', err.message))
  }

  // ── Mutations zones ───────────────────────────────────────────────────────

  function addZone(data) {
    const zone = {
      id:        crypto.randomUUID(),
      roomId:    data.roomId,
      name:      data.name.trim(),
      active:    data.active ?? true,
      createdAt: new Date().toISOString(),
    }
    setZones(prev => [...prev, zone])
    upsertZone(zone).catch(err => console.error('[supabase] addZone:', err.message))
    return zone.id
  }

  function updateZone(id, updates, tasksData = null) {
    let updated
    setZones(prev => prev.map(z => {
      if (z.id !== id) return z
      updated = { ...z, ...updates }
      return updated
    }))
    if (updated) upsertZone(updated).catch(err => console.error('[supabase] updateZone:', err.message))

    if (tasksData !== null) {
      const newTasks = tasksData.map(t => ({
        id:         t.id ?? crypto.randomUUID(),
        zoneId:     id,
        subzoneId:  null,
        name:       t.name,
        product:    t.product   ?? null,
        dosage:     t.dosage    ?? null,
        frequency:  t.frequency ?? 'daily',
        dayOfWeek:  t.dayOfWeek ?? null,
        cycleStart: t.cycleStart ?? null,
        protocol:   t.protocol  ?? [],
        active:     t.active    ?? true,
        createdAt:  t.createdAt ?? new Date().toISOString(),
      }))
      setTasks(prev => [...prev.filter(t => t.zoneId !== id), ...newTasks])
      deleteTasksByZone(id)
        .then(() => upsertTasks(newTasks))
        .catch(err => console.error('[supabase] updateZone tasks:', err.message))
    }
  }

  function deleteZone(id) {
    const subzoneIds     = subzones.filter(s => s.zoneId === id).map(s => s.id)
    const removedTaskIds = tasks.filter(t => t.zoneId === id || subzoneIds.includes(t.subzoneId)).map(t => t.id)
    setZones(prev => prev.filter(z => z.id !== id))
    setSubzones(prev => prev.filter(s => s.zoneId !== id))
    setTasks(prev => prev.filter(t => t.zoneId !== id && !subzoneIds.includes(t.subzoneId)))
    setRecords(prev => prev.filter(r => !removedTaskIds.includes(r.taskId)))
    deleteZoneSupabase(id).catch(err => console.error('[supabase] deleteZone:', err.message))
  }

  // ── Mutations rooms ───────────────────────────────────────────────────────

  function addRoom(data, zonesData = []) {
    const roomId = crypto.randomUUID()
    const room = {
      id:        roomId,
      name:      data.name.trim(),
      color:     data.color ?? 'blue',
      active:    true,
      createdAt: new Date().toISOString(),
    }
    setRooms(prev => [...prev, room])
    upsertRoom(room).catch(err => console.error('[supabase] addRoom:', err.message))

    zonesData.forEach(zoneData => {
      const zoneId = crypto.randomUUID()
      const zone = {
        id:        zoneId,
        roomId,
        name:      zoneData.name.trim(),
        active:    zoneData.active ?? true,
        createdAt: new Date().toISOString(),
      }
      setZones(prev => [...prev, zone])
      upsertZone(zone).catch(err => console.error('[supabase] addRoom zone:', err.message))

      // Tâches directes de la zone
      ;(zoneData.tasks ?? []).forEach(t => addTask({ ...t, zoneId, subzoneId: null }))

      // Sous-zones
      ;(zoneData.subzones ?? []).forEach(szData => {
        const szId = crypto.randomUUID()
        const sz = {
          id:        szId,
          zoneId,
          name:      szData.name.trim(),
          active:    szData.active ?? true,
          createdAt: new Date().toISOString(),
        }
        setSubzones(prev => [...prev, sz])
        upsertSubzone(sz).catch(err => console.error('[supabase] addRoom subzone:', err.message))
        ;(szData.tasks ?? []).forEach(t => addTask({ ...t, zoneId: null, subzoneId: szId }))
      })
    })
  }

  function updateRoom(id, updates) {
    let updated
    setRooms(prev => prev.map(r => {
      if (r.id !== id) return r
      updated = { ...r, ...updates }
      return updated
    }))
    if (updated) upsertRoom(updated).catch(err => console.error('[supabase] updateRoom:', err.message))
  }

  /**
   * Sauvegarde complète d'une pièce (create ou update).
   * zonesData = [{ id?, name, active, tasks: [...], subzones: [{ id?, name, active, tasks: [] }] }]
   * Préserve les records des tâches dont l'ID est conservé.
   */
  function saveRoomFull(roomId, roomData, zonesData) {
    const isEdit = !!roomId
    const id     = roomId ?? crypto.randomUUID()
    const now    = new Date().toISOString()

    function buildTask(t, zoneId, subzoneId) {
      return {
        id:          t.id ?? crypto.randomUUID(),
        zoneId,
        subzoneId,
        name:        t.name.trim(),
        product:     t.product?.trim()  || null,
        dosage:      t.dosage?.trim()   || null,
        frequency:   t.frequency        ?? 'daily',
        dayOfWeek:   t.frequency === 'weekly'     ? (t.dayOfWeek  ?? 1) : null,
        cycleStart:  t.frequency === 'semiannual' ? (t.cycleStart ?? 1) : null,
        protocol:    (t.protocol ?? []).filter(s => s.trim()),
        active:      t.active ?? true,
        createdAt:   t.createdAt ?? now,
      }
    }

    const room = {
      id,
      name:      roomData.name.trim(),
      color:     roomData.color ?? 'blue',
      active:    true,
      createdAt: isEdit ? (rooms.find(r => r.id === id)?.createdAt ?? now) : now,
    }

    // Build flat lists from nested input
    const nextZones    = []
    const nextSubzones = []
    const nextTasks    = []

    for (const zData of zonesData) {
      if (!zData.name.trim()) continue
      const zoneId = zData.id ?? crypto.randomUUID()
      nextZones.push({ id: zoneId, roomId: id, name: zData.name.trim(), active: zData.active ?? true, createdAt: zData.createdAt ?? now })
      for (const t of (zData.tasks ?? [])) {
        if (!t.name.trim()) continue
        nextTasks.push(buildTask(t, zoneId, null))
      }
      for (const szData of (zData.subzones ?? [])) {
        if (!szData.name.trim()) continue
        const szId = szData.id ?? crypto.randomUUID()
        nextSubzones.push({ id: szId, zoneId, name: szData.name.trim(), active: szData.active ?? true, createdAt: szData.createdAt ?? now })
        for (const t of (szData.tasks ?? [])) {
          if (!t.name.trim()) continue
          nextTasks.push(buildTask(t, null, szId))
        }
      }
    }

    // Diff against current state
    const prevZoneIds    = zones.filter(z => z.roomId === id).map(z => z.id)
    const prevSubzoneIds = subzones.filter(s => prevZoneIds.includes(s.zoneId)).map(s => s.id)
    const prevTaskIds    = tasks.filter(t =>
      prevZoneIds.includes(t.zoneId) || prevSubzoneIds.includes(t.subzoneId)
    ).map(t => t.id)

    const nextZoneIds    = new Set(nextZones.map(z => z.id))
    const nextSubzoneIds = new Set(nextSubzones.map(s => s.id))
    const nextTaskIds    = new Set(nextTasks.map(t => t.id))

    const removedZoneIds    = prevZoneIds.filter(zid => !nextZoneIds.has(zid))
    const keptSubzoneIds    = subzones.filter(s => nextZoneIds.has(s.zoneId)).map(s => s.id)
    const removedSubzoneIds = keptSubzoneIds.filter(sid => !nextSubzoneIds.has(sid))
    const keptTaskIds       = tasks.filter(t =>
      nextZoneIds.has(t.zoneId) || nextSubzoneIds.has(t.subzoneId)
    ).map(t => t.id)
    const removedTaskIds    = keptTaskIds.filter(tid => !nextTaskIds.has(tid))

    // Update React state
    setRooms(prev => isEdit ? prev.map(r => r.id === id ? room : r) : [...prev, room])
    setZones(prev => [
      ...prev.filter(z => z.roomId !== id),
      ...nextZones,
    ])
    setSubzones(prev => [
      ...prev.filter(s => !prevZoneIds.includes(s.zoneId)),
      ...nextSubzones,
    ])
    setTasks(prev => [
      ...prev.filter(t => !prevZoneIds.includes(t.zoneId) && !prevSubzoneIds.includes(t.subzoneId)),
      ...nextTasks,
    ])
    setRecords(prev => prev.filter(r => !removedTaskIds.includes(r.taskId)))

    // Supabase — séquentiel pour respecter les FK (room → zones → subzones → tasks)
    async function persist() {
      await upsertRoom(room)
      await Promise.all([
        ...removedZoneIds.map(zid => deleteZoneSupabase(zid)),
        ...removedSubzoneIds.map(sid => deleteSubzoneSupabase(sid)),
        ...removedTaskIds.map(tid => deleteTaskSupabase(tid)),
      ])
      if (nextZones.length)    await upsertZones(nextZones)
      if (nextSubzones.length) await upsertSubzones(nextSubzones)
      if (nextTasks.length)    await upsertTasks(nextTasks)
    }
    persist().catch(err => console.error('[supabase] saveRoomFull:', err.message))
  }

  function deleteRoom(id) {
    const roomZoneIds    = zones.filter(z => z.roomId === id).map(z => z.id)
    const roomSubzoneIds = subzones.filter(s => roomZoneIds.includes(s.zoneId)).map(s => s.id)
    const removedTaskIds = tasks.filter(t =>
      roomZoneIds.includes(t.zoneId) || roomSubzoneIds.includes(t.subzoneId)
    ).map(t => t.id)

    setRooms(prev => prev.filter(r => r.id !== id))
    setZones(prev => prev.filter(z => z.roomId !== id))
    setSubzones(prev => prev.filter(s => !roomZoneIds.includes(s.zoneId)))
    setTasks(prev => prev.filter(t => !removedTaskIds.includes(t.id)))
    setRecords(prev => prev.filter(r => !removedTaskIds.includes(r.taskId)))
    deleteRoomSupabase(id).catch(err => console.error('[supabase] deleteRoom:', err.message))
  }

  return {
    rooms,
    zones,
    subzones,
    tasks,
    records,
    getTasksForDay,
    getTasksForRoomDay,
    getRecordForDay,
    getRoomStats,
    getRoomActiveTaskCount,
    markDone,
    unmarkDone,
    addTask,
    updateTask,
    deleteTask,
    addSubzone,
    updateSubzone,
    deleteSubzone,
    addZone,
    updateZone,
    deleteZone,
    addRoom,
    updateRoom,
    deleteRoom,
    saveRoomFull,
  }
}
