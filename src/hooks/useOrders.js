// ─── Hook useOrders — State, CRUD & polling Webflow ───────────────────────────
//
// Source de vérité unique : Supabase.
// Webflow polling :
//  - Fetch initial au montage du module Commandes
//  - setInterval toutes les 2 minutes
//  - Déduplication par webflowOrderId
//  - Toast si nouvelles commandes détectées

import { useState, useRef, useEffect, useCallback } from 'react'
import { fetchOrders as fetchWebflowOrders } from '../services/webflowAdapter'
import { dateToStr } from '../utils/date'
import {
  fetchOrders    as fetchSupabaseOrders,
  upsertOrder,
  upsertOrders,
  deleteOrder    as deleteSupabaseOrder,
} from '../services/ordersService'

const POLL_INTERVAL = 2 * 60 * 1000  // 2 minutes

export function useOrders({ onToast } = {}) {
  const [orders,        setOrders]        = useState([])
  const [webflowStatus, setWebflowStatus] = useState('idle')
  const [webflowError,  setWebflowError]  = useState(null)

  const pollTimer  = useRef(null)
  const ordersRef  = useRef(orders)
  const onToastRef = useRef(onToast)

  useEffect(() => { ordersRef.current  = orders  }, [orders])
  useEffect(() => { onToastRef.current = onToast }, [onToast])

  // Chargement Supabase au montage
  useEffect(() => {
    fetchSupabaseOrders()
      .then(supabaseOrders => {
        setOrders(supabaseOrders)
        console.log('[supabase] commandes chargées:', supabaseOrders.length)
      })
      .catch(err => console.error('[supabase] fetchOrders:', err.message))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Computed ───────────────────────────────────────────────────────────────

  const today = dateToStr(new Date())

  const upcomingCount = orders.filter(
    o => o.pickupDate >= today
  ).length

  // ── Requêtes ───────────────────────────────────────────────────────────────

  function ordersForDate(dateStr) {
    return orders.filter(o => o.pickupDate === dateStr)
  }

  function ordersForMonth(year, month) {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    return orders.filter(o => o.pickupDate?.startsWith(prefix))
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  function addOrder(orderData) {
    const now   = new Date().toISOString()
    const order = {
      ...orderData,
      id:             orderData.id             ?? crypto.randomUUID(),
      webflowOrderId: orderData.webflowOrderId ?? null,
      status:         orderData.status         ?? 'new',
      createdAt:      orderData.createdAt      ?? now,
      updatedAt:      now,
    }
    setOrders(prev => [...prev, order])
    upsertOrder(order).catch(err => console.error('[supabase] addOrder:', err.message))
    return order
  }

  function updateOrder(id, updates) {
    let updated
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o
      updated = { ...o, ...updates, updatedAt: new Date().toISOString() }
      return updated
    }))
    if (updated) upsertOrder(updated).catch(err => console.error('[supabase] updateOrder:', err.message))
  }

  function deleteOrder(id) {
    setOrders(prev => prev.filter(o => o.id !== id))
    deleteSupabaseOrder(id).catch(err => console.error('[supabase] deleteOrder:', err.message))
  }

  function updateStatus(id, status) {
    updateOrder(id, { status })
  }

  function resetOrders() {
    setOrders([])
  }

  // ── Webflow sync ───────────────────────────────────────────────────────────

  const syncWebflow = useCallback(async () => {
    setWebflowStatus('loading')
    setWebflowError(null)

    try {
      const allWebflowOrders = await fetchWebflowOrders(new Set())

      setOrders(prev => {
        const webflowById = new Map(allWebflowOrders.map(o => [o.webflowOrderId, o]))
        const updated = prev.map(o =>
          o.webflowOrderId && webflowById.has(o.webflowOrderId)
            ? { ...webflowById.get(o.webflowOrderId), id: o.id }
            : o
        )
        const knownIds = new Set(prev.filter(o => o.webflowOrderId).map(o => o.webflowOrderId))
        const incoming = allWebflowOrders.filter(o => !knownIds.has(o.webflowOrderId))
        return incoming.length === 0 ? updated : [...updated, ...incoming]
      })

      const knownAtFetch = new Set(ordersRef.current.filter(o => o.webflowOrderId).map(o => o.webflowOrderId))
      const n = allWebflowOrders.filter(o => !knownAtFetch.has(o.webflowOrderId)).length
      if (n > 0) {
        const msg = `${n} nouvelle${n > 1 ? 's' : ''} commande${n > 1 ? 's' : ''} reçue${n > 1 ? 's' : ''}`
        onToastRef.current?.(msg, '#7AC5FF')
      }

      upsertOrders(allWebflowOrders).catch(err => console.error('[supabase] syncWebflow upsert:', err.message))

      setWebflowStatus('connected')
    } catch (err) {
      console.error('[useOrders] Webflow fetch error:', err.message)
      setWebflowError(err.message)
      setWebflowStatus('error')
    }
  }, [])

  // Fetch initial + polling
  useEffect(() => {
    syncWebflow()
    pollTimer.current = setInterval(syncWebflow, POLL_INTERVAL)
    return () => clearInterval(pollTimer.current)
  }, [syncWebflow])

  // ── API publique ───────────────────────────────────────────────────────────

  return {
    orders,
    upcomingCount,
    ordersForDate,
    ordersForMonth,
    addOrder,
    updateOrder,
    deleteOrder,
    updateStatus,
    resetOrders,
    webflowStatus,
    webflowError,
    retryWebflow: syncWebflow,
  }
}
