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

const EQUIP_KEY    = 'kubo_temp_equipment'
const READINGS_KEY = 'kubo_temp_readings'
const DEBOUNCE_MS  = 500

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

function loadEquipment() {
  try {
    const raw = localStorage.getItem(EQUIP_KEY)
    const data = raw ? JSON.parse(raw) : initialEquipment
    return data.map(migrateEquipment)
  } catch { return initialEquipment }
}

function loadReadings() {
  try {
    const raw = localStorage.getItem(READINGS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveEquipment(eq) {
  try { localStorage.setItem(EQUIP_KEY, JSON.stringify(eq)) } catch {}
}

function saveReadings(r) {
  try { localStorage.setItem(READINGS_KEY, JSON.stringify(r)) } catch {}
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
  const [equipment, setEquipment] = useState(loadEquipment)
  const [readings,  setReadings]  = useState(loadReadings)

  // slugToSupabaseId : slug (ex: "eq-joel") → UUID Supabase
  const slugMap = useRef({})

  const debounceEqRef  = useRef(null)
  const debounceRdRef  = useRef(null)

  useEffect(() => {
    clearTimeout(debounceEqRef.current)
    debounceEqRef.current = setTimeout(() => saveEquipment(equipment), DEBOUNCE_MS)
  }, [equipment])

  useEffect(() => {
    clearTimeout(debounceRdRef.current)
    debounceRdRef.current = setTimeout(() => saveReadings(readings), DEBOUNCE_MS)
  }, [readings])

  // Chargement Supabase au montage
  useEffect(() => {
    // Équipements
    fetchEquipments()
      .then(async supabaseEq => {
        if (supabaseEq.length > 0) {
          // Construit le mapping slug → supabase id
          supabaseEq.forEach(e => { if (e.slug) slugMap.current[e.slug] = e.id })
          setEquipment(supabaseEq.map(e => ({ ...e, id: e.slug ?? e.id })))
          console.log('[supabase] équipements chargés:', supabaseEq.length)
        } else {
          const local = loadEquipment()
          const mapping = await upsertEquipments(local)
          mapping.forEach(({ id, slug }) => { if (slug) slugMap.current[slug] = id })
          console.log('[supabase] équipements seedés:', local.length)
        }
      })
      .catch(err => console.error('[supabase] fetchEquipments:', err.message))

    // Relevés
    fetchReadings()
      .then(supabaseReadings => {
        if (supabaseReadings.length > 0) {
          setReadings(supabaseReadings)
          console.log('[supabase] relevés chargés:', supabaseReadings.length)
        }
      })
      .catch(err => console.error('[supabase] fetchReadings:', err.message))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Lectures ─────────────────────────────────────────────────────────────

  function getReadingsForDay(equipmentId, date) {
    return readings.filter(r => r.equipmentId === equipmentId && r.date === date)
  }

  /**
   * Remplace tous les relevés d'un équipement pour une date donnée.
   * newReadings : [{ id?, slot, time, temperature, createdBy? }]
   * Les entrées sans `time` sont ignorées.
   */
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
