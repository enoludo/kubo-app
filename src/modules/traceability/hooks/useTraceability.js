// ─── Hook — état et logique du module Traçabilité ─────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { DEMO_SUPPLIERS, DEMO_PRODUCTS } from '../../../data/traceabilityDemo'

const SUPPLIERS_KEY = 'kubo_tr_suppliers'
const PRODUCTS_KEY  = 'kubo_tr_products'
const DEBOUNCE_MS   = 500

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
  const [suppliers, setSuppliers] = useState(() => load(SUPPLIERS_KEY, DEMO_SUPPLIERS))
  const [deliveries, setDeliveries] = useState(() => load(PRODUCTS_KEY, DEMO_PRODUCTS))

  const timerS = useRef(null)
  const timerD = useRef(null)

  useEffect(() => {
    clearTimeout(timerS.current)
    timerS.current = setTimeout(() => save(SUPPLIERS_KEY, suppliers), DEBOUNCE_MS)
    return () => clearTimeout(timerS.current)
  }, [suppliers])

  useEffect(() => {
    clearTimeout(timerD.current)
    timerD.current = setTimeout(() => save(PRODUCTS_KEY, deliveries), DEBOUNCE_MS)
    return () => clearTimeout(timerD.current)
  }, [deliveries])

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function getDeliveriesForDay(supplierId, dateStr) {
    return deliveries.filter(d => d.supplierId === supplierId && d.date === dateStr)
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
    setDeliveries(prev => prev.filter(d => d.supplierId !== id))
  }

  // ── CRUD produits livrés ─────────────────────────────────────────────────────

  function addDelivery(data) {
    const newDelivery = { ...data, id: `dp-${Date.now()}` }
    setDeliveries(prev => [...prev, newDelivery])
    return newDelivery
  }

  function updateDelivery(id, data) {
    setDeliveries(prev => prev.map(d => d.id === id ? { ...d, ...data } : d))
  }

  function deleteDelivery(id) {
    setDeliveries(prev => prev.filter(d => d.id !== id))
  }

  return {
    suppliers:          suppliers.filter(s => s.active),
    allSuppliers:       suppliers,
    deliveries,
    getDeliveriesForDay,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addDelivery,
    updateDelivery,
    deleteDelivery,
  }
}
