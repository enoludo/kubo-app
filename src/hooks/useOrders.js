// ─── Hook useOrders — State, CRUD & polling Webflow ───────────────────────────
//
// Persistance à deux niveaux :
//  - localStorage  'kubo_boutique_orders' : commandes boutique + brunch boutique
//    → survivent à la fermeture du navigateur
//  - sessionStorage 'kubo_webflow_orders' : cache des commandes Webflow
//    → re-fetchées automatiquement au prochain chargement
//
// Webflow polling :
//  - Fetch initial au montage du module Commandes
//  - setInterval toutes les 2 minutes
//  - Déduplication par webflowOrderId
//  - Toast si nouvelles commandes détectées

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { fetchOrders as fetchWebflowOrders } from '../services/webflowAdapter'
import { useOrdersGoogleSync } from './useOrdersGoogleSync'
import { dateToStr } from '../utils/date'
import {
  fetchOrders    as fetchSupabaseOrders,
  upsertOrder,
  upsertOrders,
  deleteOrder    as deleteSupabaseOrder,
} from '../services/ordersService'

const LOCAL_KEY   = 'kubo_boutique_orders'  // localStorage  — persistant
const SESSION_KEY = 'kubo_webflow_orders'   // sessionStorage — cache session
const POLL_INTERVAL = 2 * 60 * 1000        // 2 minutes

// Commandes locales (boutique ou brunch boutique) → localStorage
function isLocalOrder(o) {
  return o.channel === 'boutique' ||
    (o.channel === 'brunch' && o.brunchSource === 'boutique')
}

function localLoad() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function localSave(orders) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(orders.filter(isLocalOrder)))
  } catch {}
}

function sessionLoad() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function sessionSave(orders) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(orders.filter(o => !isLocalOrder(o))))
  } catch {}
}

// Migration paid: boolean → paymentStatus: string
function migratePaymentStatus(orders) {
  return orders.map(o => {
    if (o.paymentStatus) return o
    return { ...o, paymentStatus: o.paid ? 'paid' : 'unpaid' }
  })
}

// Migration depuis l'ancien format (kubo_orders en sessionStorage)
function migrateOldStorage() {
  try {
    const OLD_KEY = 'kubo_orders'
    const raw = sessionStorage.getItem(OLD_KEY)
    if (!raw) return
    const old = JSON.parse(raw)
    const boutique = old.filter(isLocalOrder)
    if (boutique.length > 0) {
      const existing   = localLoad()
      const existingIds = new Set(existing.map(o => o.id))
      const toAdd      = boutique.filter(o => !existingIds.has(o.id))
      if (toAdd.length > 0) {
        localStorage.setItem(LOCAL_KEY, JSON.stringify([...existing, ...toAdd]))
      }
    }
    sessionStorage.removeItem(OLD_KEY)
    console.log('[useOrders] migration kubo_orders → localStorage effectuée')
  } catch {}
}

export function useOrders({ onToast } = {}) {
  const [orders,        setOrders]        = useState(() => {
    migrateOldStorage()
    return migratePaymentStatus([...localLoad(), ...sessionLoad()])
  })
  const [webflowStatus, setWebflowStatus] = useState('idle')
  const [webflowError,  setWebflowError]  = useState(null)

  const saveTimer  = useRef(null)
  const pollTimer  = useRef(null)
  const ordersRef  = useRef(orders)
  const onToastRef = useRef(onToast)

  useEffect(() => { ordersRef.current  = orders  }, [orders])
  useEffect(() => { onToastRef.current = onToast }, [onToast])

  // Chargement Supabase au montage
  useEffect(() => {
    fetchSupabaseOrders()
      .then(async supabaseOrders => {
        if (supabaseOrders.length > 0) {
          setOrders(prev => {
            const supabaseIds   = new Set(supabaseOrders.map(o => o.id))
            const supabaseWfIds = new Set(supabaseOrders.filter(o => o.webflowOrderId).map(o => o.webflowOrderId))

            // Commandes absentes de Supabase → à seeder
            const localOnly = prev.filter(o =>
              !supabaseIds.has(o.id) &&
              !(o.webflowOrderId && supabaseWfIds.has(o.webflowOrderId))
            )
            if (localOnly.length > 0) {
              upsertOrders(localOnly).catch(err => console.error('[supabase] seed local orders:', err.message))
            }

            // Commandes boutique présentes dans Supabase sans items
            // mais dont la version locale a des items → re-upsert
            const toRepair = supabaseOrders.filter(so => {
              if (so.webflowOrderId) return false         // Webflow gère ses propres items
              if ((so.items ?? []).length > 0) return false // déjà OK
              const local = prev.find(o => o.id === so.id)
              return local?.items?.length > 0
            })
            if (toRepair.length > 0) {
              const withLocalItems = toRepair.map(so => ({
                ...so,
                items: prev.find(o => o.id === so.id).items,
              }))
              upsertOrders(withLocalItems).catch(err => console.error('[supabase] repair items:', err.message))
              console.log('[supabase] repair items pour', toRepair.length, 'commandes')
            }

            return [...supabaseOrders, ...localOnly]
          })
          console.log('[supabase] commandes chargées:', supabaseOrders.length)
        } else {
          // Table vide — seed avec les commandes locales
          setOrders(prev => {
            if (prev.length > 0) {
              upsertOrders(prev).catch(err => console.error('[supabase] seed orders:', err.message))
              console.log('[supabase] commandes seedées:', prev.length)
            }
            return prev
          })
        }
      })
      .catch(err => console.error('[supabase] fetchOrders:', err.message))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save debounce 500ms — boutique → localStorage, webflow → sessionStorage
  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      localSave(orders)
      sessionSave(orders)
    }, 500)
    return () => clearTimeout(saveTimer.current)
  }, [orders])

  // ── Google Sheets sync (commandes boutique uniquement) ─────────────────────

  // Commandes locales (boutique + brunch boutique) — memoïsées pour le hook de sync
  const localOrders = useMemo(() => orders.filter(isLocalOrder), [orders])

  // Appelé par le hook de sync lors du pull initial depuis Sheets
  function handlePullOrders(sheetOrders) {
    setOrders(prev => {
      const existingIds = new Set(prev.map(o => o.id))
      // Mettre à jour les commandes locales existantes avec les données Sheet
      const updated = prev.map(o => {
        if (!isLocalOrder(o)) return o
        const fromSheet = sheetOrders.find(s => s.id === o.id)
        return fromSheet ?? o
      })
      // Ajouter les commandes présentes dans Sheet mais pas en local
      const newFromSheet = sheetOrders.filter(o => !existingIds.has(o.id))
      return [...updated, ...newFromSheet]
    })
  }

  const {
    status:                sheetsStatus,
    errMsg:                sheetsError,
    connect:               sheetsConnect,
    disconnect:            sheetsDisconnect,
    retry:                 sheetsRetry,
    connectFromSharedToken: sheetsConnectFromShared,
  } = useOrdersGoogleSync({ localOrders, onPullOrders: handlePullOrders, onToast })

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
    localStorage.removeItem(LOCAL_KEY)
    sessionStorage.removeItem(SESSION_KEY)
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
        // Remplace les commandes Webflow existantes par les versions fraîches (items.size nettoyé)
        const updated = prev.map(o =>
          o.webflowOrderId && webflowById.has(o.webflowOrderId)
            ? { ...webflowById.get(o.webflowOrderId), id: o.id }
            : o
        )
        // Ajoute les commandes Webflow inconnues
        const knownIds = new Set(prev.filter(o => o.webflowOrderId).map(o => o.webflowOrderId))
        const incoming  = allWebflowOrders.filter(o => !knownIds.has(o.webflowOrderId))
        return incoming.length === 0 ? updated : [...updated, ...incoming]
      })

      const knownAtFetch = new Set(ordersRef.current.filter(o => o.webflowOrderId).map(o => o.webflowOrderId))
      const n = allWebflowOrders.filter(o => !knownAtFetch.has(o.webflowOrderId)).length
      if (n > 0) {
        const msg = `${n} nouvelle${n > 1 ? 's' : ''} commande${n > 1 ? 's' : ''} reçue${n > 1 ? 's' : ''}`
        onToastRef.current?.(msg, '#7AC5FF')
      }

      // Sync Webflow → Supabase (toutes les commandes web, nouvelles ou mises à jour)
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
    retryWebflow:     syncWebflow,
    sheetsStatus,
    sheetsError,
    sheetsConnect,
    sheetsDisconnect,
    sheetsRetry,
    sheetsConnectFromShared,
  }
}
