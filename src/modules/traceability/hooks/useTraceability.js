// ─── Hook — état et logique du module Traçabilité ─────────────────────────────
import { useState, useEffect, useRef } from 'react'
import {
  fetchSuppliers,  upsertSupplier,  deleteSupplier as deleteSupplierSupabase,
  fetchDeliveries, upsertDelivery,  deleteDelivery as deleteDeliverySupabase,
} from '../../../services/traceabilityService'

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTraceability() {
  const [suppliers,  setSuppliers]  = useState([])
  const [deliveries, setDeliveries] = useState([])

  // slugMap : slug (ex: "sup-001") → UUID Supabase
  const slugMap = useRef({})

  // Chargement Supabase au montage
  useEffect(() => {
    fetchSuppliers()
      .then(supabaseSuppliers => {
        supabaseSuppliers.forEach(s => { if (s.id) slugMap.current[s.id] = s._supabaseId })
        setSuppliers(supabaseSuppliers)
        console.log('[supabase] fournisseurs chargés:', supabaseSuppliers.length)
      })
      .catch(err => console.error('[supabase] fetchSuppliers:', err.message))

    fetchDeliveries()
      .then(supabaseDeliveries => {
        setDeliveries(supabaseDeliveries)
        console.log('[supabase] livraisons chargées:', supabaseDeliveries.length)
      })
      .catch(err => console.error('[supabase] fetchDeliveries:', err.message))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function getDeliveriesForDay(supplierId, dateStr) {
    return deliveries.filter(d => d.supplierId === supplierId && d.date === dateStr)
  }

  // ── CRUD fournisseurs ────────────────────────────────────────────────────────

  function addSupplier(data) {
    const newSupplier = { ...data, id: crypto.randomUUID(), active: true }
    setSuppliers(prev => [...prev, newSupplier])
    upsertSupplier(newSupplier)
      .then(({ id, slug }) => { if (slug) slugMap.current[slug] = id })
      .catch(err => console.error('[supabase] addSupplier:', err.message))
    return newSupplier
  }

  function updateSupplier(id, data) {
    let updated
    setSuppliers(prev => prev.map(s => {
      if (s.id !== id) return s
      updated = { ...s, ...data }
      return updated
    }))
    if (updated) upsertSupplier(updated).catch(err => console.error('[supabase] updateSupplier:', err.message))
  }

  function deleteSupplier(id) {
    setSuppliers(prev => prev.filter(s => s.id !== id))
    setDeliveries(prev => prev.filter(d => d.supplierId !== id))
    deleteSupplierSupabase(id).catch(err => console.error('[supabase] deleteSupplier:', err.message))
  }

  // ── CRUD produits livrés ─────────────────────────────────────────────────────

  function addDelivery(data) {
    const newDelivery = { ...data, id: crypto.randomUUID() }
    setDeliveries(prev => [...prev, newDelivery])
    const supabaseSupplierId = slugMap.current[newDelivery.supplierId] ?? newDelivery.supplierId
    upsertDelivery(newDelivery, supabaseSupplierId)
      .catch(err => console.error('[supabase] addDelivery:', err.message))
    return newDelivery
  }

  function updateDelivery(id, data) {
    let updated
    setDeliveries(prev => prev.map(d => {
      if (d.id !== id) return d
      updated = { ...d, ...data }
      return updated
    }))
    if (updated) {
      const supabaseSupplierId = slugMap.current[updated.supplierId] ?? updated.supplierId
      upsertDelivery(updated, supabaseSupplierId)
        .catch(err => console.error('[supabase] updateDelivery:', err.message))
    }
  }

  function deleteDelivery(id) {
    setDeliveries(prev => prev.filter(d => d.id !== id))
    deleteDeliverySupabase(id).catch(err => console.error('[supabase] deleteDelivery:', err.message))
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
