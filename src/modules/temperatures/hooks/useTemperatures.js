import { useState, useEffect, useRef } from 'react'
import initialEquipment from '../data/equipment.json'
import { COLOR_PALETTE } from '../utils/tempColors.jsx'
import {
  fetchEquipments,
  upsertEquipments,
  updateEquipment    as updateEquipmentSupabase,
  fetchReadings,
  saveReadingsForDay as saveReadingsSupabase,
  deleteReading      as deleteReadingSupabase,
} from '../../../services/temperaturesService'

// Migration : anciens types et anciens champs color/order
function migrateEquipment(eq) {
  const TYPE_MAP = { frigo: 'positif', tour: 'positif', autre: 'positif', congelateur: 'negatif' }
  const colorKeyToIndex = Object.fromEntries(COLOR_PALETTE.map((c, i) => [c.key, i]))
  return {
    ...eq,
    type:       TYPE_MAP[eq.type] ?? eq.type,
    colorIndex: eq.colorIndex ?? colorKeyToIndex[eq.color] ?? 0,
  }
}

// ── Pure helpers ────────────────────────────────────────────────────────────

export function isOutOfRange(reading, equipment) {
  if (!reading || !equipment) return false
  const t = Number(reading.temperature)
  return t < equipment.minTemp || t > equipment.maxTemp
}

export function hasAlert(readings, equipment) {
  return readings.some(r => isOutOfRange(r, equipment))
}

export function getMissingSlots(readings) {
  const slots = new Set(readings.map(r => r.slot))
  const missing = []
  if (!slots.has('morning')) missing.push('morning')
  if (!slots.has('evening')) missing.push('evening')
  return missing
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useTemperatures() {
  const [equipment, setEquipment] = useState([])
  const [readings,  setReadings]  = useState([])

  // slugToSupabaseId : slug (ex: "eq-joel") → UUID Supabase
  const slugMap = useRef({})

  // Chargement Supabase au montage
  useEffect(() => {
    // Équipements
    fetchEquipments()
      .then(async supabaseEq => {
        if (supabaseEq.length > 0) {
          supabaseEq.forEach(e => { if (e.slug) slugMap.current[e.slug] = e.id })
          setEquipment(supabaseEq)   // id = UUID Supabase
          console.log('[supabase] équipements chargés:', supabaseEq.length)
        } else {
          const seed = initialEquipment.map(migrateEquipment)
          const mapping = await upsertEquipments(seed)
          mapping.forEach(({ id, slug }) => { if (slug) slugMap.current[slug] = id })
          setEquipment(seed)
          console.log('[supabase] équipements seedés:', seed.length)
        }
      })
      .catch(err => console.error('[supabase] fetchEquipments:', err.message))

    // Relevés
    fetchReadings()
      .then(supabaseReadings => {
        setReadings(supabaseReadings)
        console.log('[supabase] relevés chargés:', supabaseReadings.length)
      })
      .catch(err => console.error('[supabase] fetchReadings:', err.message))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Lectures ─────────────────────────────────────────────────────────────

  function getReadingsForDay(equipmentId, date) {
    return readings.filter(r => r.equipmentId === equipmentId && r.date === date)
  }

  function saveReadingsForDay(equipmentId, date, newReadings) {
    const created = newReadings
      .filter(r => r.time !== '' && r.temperature !== '' && r.temperature !== null && r.temperature !== undefined)
      .map(r => ({
        id:          r.id ?? crypto.randomUUID(),
        equipmentId,
        date,
        slot:        r.slot,
        time:        r.time,
        temperature: Number(r.temperature),
        comment:     r.comment ?? null,
        authorId:    r.authorId ?? null,
        createdBy:   r.createdBy ?? null,
        createdAt:   r.createdAt ?? new Date().toISOString(),
      }))
    setReadings(prev => [
      ...prev.filter(r => !(r.equipmentId === equipmentId && r.date === date)),
      ...created,
    ])
    const supabaseId = slugMap.current[equipmentId] ?? equipmentId
    saveReadingsSupabase(supabaseId, date, created)
      .catch(err => console.error('[supabase] saveReadingsForDay:', err.message))
  }

  function deleteReading(id) {
    setReadings(prev => prev.filter(r => r.id !== id))
    deleteReadingSupabase(id).catch(err => console.error('[supabase] deleteReading:', err.message))
  }

  // ── Équipements ───────────────────────────────────────────────────────────

  function addEquipment(data) {
    const maxOrder = equipment.reduce((max, e) => Math.max(max, e.order ?? 0), 0)
    const newEq = {
      id:         crypto.randomUUID(),
      name:       data.name,
      type:       data.type,
      minTemp:    Number(data.minTemp),
      maxTemp:    Number(data.maxTemp),
      colorIndex: data.colorIndex ?? 0,
      order:      maxOrder + 1,
      active:     true,
      createdAt:  new Date().toISOString(),
    }
    setEquipment(prev => [...prev, newEq])
    upsertEquipments([newEq])
      .then(mapping => mapping.forEach(({ id, slug }) => { if (slug) slugMap.current[slug] = id }))
      .catch(err => console.error('[supabase] addEquipment:', err.message))
  }

  function updateEquipment(id, updates) {
    setEquipment(prev => prev.map(e =>
      e.id === id
        ? { ...e, ...updates, minTemp: Number(updates.minTemp ?? e.minTemp), maxTemp: Number(updates.maxTemp ?? e.maxTemp) }
        : e
    ))
    const supabaseId = slugMap.current[id] ?? id
    updateEquipmentSupabase(supabaseId, updates)
      .catch(err => console.error('[supabase] updateEquipment:', err.message))
  }

  function archiveEquipment(id) {
    setEquipment(prev => prev.map(e => e.id === id ? { ...e, active: false } : e))
    const supabaseId = slugMap.current[id] ?? id
    updateEquipmentSupabase(supabaseId, { active: false })
      .catch(err => console.error('[supabase] archiveEquipment:', err.message))
  }

  const activeEquipment = [...equipment]
    .filter(e => e.active)
    .sort((a, b) => a.order - b.order)

  return {
    equipment,
    activeEquipment,
    readings,
    setEquipment,
    setReadings,
    getReadingsForDay,
    saveReadingsForDay,
    deleteReading,
    addEquipment,
    updateEquipment,
    archiveEquipment,
  }
}
