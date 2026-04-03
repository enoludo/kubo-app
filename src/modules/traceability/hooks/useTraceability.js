// ─── Hook — état et logique du module Traçabilité ─────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { DEMO_SUPPLIERS }              from '../../../data/traceabilityDemo'
import { DEMO_RECEPTIONS }             from '../../../data/traceabilityDemo'

const SUPPLIERS_KEY  = 'kubo_tr_suppliers'
const RECEPTIONS_KEY = 'kubo_tr_receptions'
const DEBOUNCE_MS    = 500

// ── Persistance locale ────────────────────────────────────────────────────────

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTraceability() {
  const [suppliers,  setSuppliers]  = useState(() => load(SUPPLIERS_KEY,  DEMO_SUPPLIERS))
  const [receptions, setReceptions] = useState(() => load(RECEPTIONS_KEY, DEMO_RECEPTIONS))

  const timerS = useRef(null)
  const timerR = useRef(null)

  // Persistance avec debounce
  useEffect(() => {
    clearTimeout(timerS.current)
    timerS.current = setTimeout(() => save(SUPPLIERS_KEY, suppliers), DEBOUNCE_MS)
    return () => clearTimeout(timerS.current)
  }, [suppliers])

  useEffect(() => {
    clearTimeout(timerR.current)
    timerR.current = setTimeout(() => save(RECEPTIONS_KEY, receptions), DEBOUNCE_MS)
    return () => clearTimeout(timerR.current)
  }, [receptions])

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** Réceptions pour un fournisseur donné sur une date */
  function getReceptionsForDay(supplierId, dateStr) {
    return receptions.filter(r => r.supplierId === supplierId && r.date === dateStr)
  }

  /** Réceptions pour un fournisseur sur la semaine */
  function getReceptionsForWeek(supplierId, weekDates) {
    const dateStrs = new Set(weekDates.map(d => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${dd}`
    }))
    return receptions.filter(r => r.supplierId === supplierId && dateStrs.has(r.date))
  }

  // ── CRUD fournisseurs ────────────────────────────────────────────────────────

  function addSupplier(data) {
    const newSupplier = { ...data, id: `sup-${Date.now()}`, active: true }
    setSuppliers(prev => [...prev, newSupplier])
    return newSupplier
  }

  function updateSupplier(id, data) {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
  }

  function deleteSupplier(id) {
    setSuppliers(prev => prev.filter(s => s.id !== id))
    setReceptions(prev => prev.filter(r => r.supplierId !== id))
  }

  // ── CRUD réceptions ──────────────────────────────────────────────────────────

  function addReception(data) {
    const newRec = { ...data, id: `rec-${Date.now()}` }
    setReceptions(prev => [...prev, newRec])
    return newRec
  }

  function updateReception(id, data) {
    setReceptions(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
  }

  function deleteReception(id) {
    setReceptions(prev => prev.filter(r => r.id !== id))
  }

  return {
    suppliers:             suppliers.filter(s => s.active),
    allSuppliers:          suppliers,
    receptions,
    getReceptionsForDay,
    getReceptionsForWeek,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addReception,
    updateReception,
    deleteReception,
  }
}
