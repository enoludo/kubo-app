// ─── Hook useProducts — State & CRUD ──────────────────────────────────────────
//
// Persistance localStorage 'kubo_products'.
// Si vide → charge les données de démonstration.
// Sprint 5 ajoutera la sync Google Sheets.

import { useState, useCallback, useMemo, useEffect } from 'react'
import { fetchProducts as fetchWebflowProducts } from '../services/webflowAdapter'
import {
  fetchProducts    as fetchSupabaseProducts,
  upsertProduct,
  upsertProducts,
  deleteProduct    as deleteSupabaseProduct,
} from '../services/productsService'

const LOCAL_KEY = 'kubo_products'

function localLoad() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function localSave(products) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(products))
  } catch {}
}

export function useProducts({ onToast } = {}) {
  const [products, setProducts] = useState(() => {
    const saved = localLoad()
    return saved ?? []
  })

  // ── Chargement Supabase puis sync Webflow (séquentiel — évite la race condition) ──

  useEffect(() => {
    async function init() {
      // 1. Charger Supabase d'abord
      let base = []
      try {
        const supabaseProducts = await fetchSupabaseProducts()
        if (supabaseProducts.length > 0) {
          const supabaseIds   = new Set(supabaseProducts.map(p => p.id))
          const supabaseWfIds = new Set(supabaseProducts.filter(p => p.webflowProductId).map(p => p.webflowProductId))
          const localOnly = (localLoad() ?? []).filter(p =>
            !supabaseIds.has(p.id) &&
            !(p.webflowProductId && supabaseWfIds.has(p.webflowProductId))
          )
          if (localOnly.length > 0) {
            upsertProducts(localOnly).catch(err => console.error('[supabase] seed local products:', err.message))
          }
          base = [...supabaseProducts, ...localOnly]
        } else {
          const local = localLoad() ?? []
          if (local.length > 0) {
            upsertProducts(local).catch(err => console.error('[supabase] seed products:', err.message))
          }
          base = local
        }
        setProducts(base)
        console.log('[supabase] produits chargés:', base.length)
      } catch (err) {
        console.error('[supabase] fetchProducts:', err.message)
        base = localLoad() ?? []
        setProducts(base)
      }

      // 2. Sync Webflow sur la base Supabase (pas sur le localStorage)
      try {
        const webflowProducts = await fetchWebflowProducts()
        if (!webflowProducts.length) return

        const wfIdSet       = new Set(webflowProducts.map(p => p.webflowProductId))
        const existingWfIds = new Set(base.filter(p => p.webflowProductId).map(p => p.webflowProductId))
        const toAdd         = webflowProducts.filter(p => !existingWfIds.has(p.webflowProductId))

        let changed = false
        let next = base.map(p => {
          if (!p.webflowProductId) return p

          const wf = webflowProducts.find(w => w.webflowProductId === p.webflowProductId)

          if (wf) {
            const updated = { ...p, name: wf.name, active: wf.active, sizes: wf.sizes, photoUrl: wf.photoUrl, updatedAt: new Date().toISOString() }
            upsertProduct(updated).catch(err => {
              console.error('[supabase] updateWebflowProduct:', err.message)
              onToast?.(`Erreur sync produit "${p.name}" : ${err.message}`, 'var(--color-danger)')
            })
            changed = true
            return updated
          }

          // Absent de Webflow → archivé/supprimé → désactiver
          if (p.active) {
            const deactivated = { ...p, active: false, updatedAt: new Date().toISOString() }
            upsertProduct(deactivated).catch(err => {
              console.error('[supabase] deactivateWebflowProduct:', err.message)
              onToast?.(`Erreur désactivation "${p.name}" : ${err.message}`, 'var(--color-danger)')
            })
            changed = true
            return deactivated
          }
          return p
        })

        if (toAdd.length) {
          next = [...next, ...toAdd]
          upsertProducts(toAdd).catch(err => {
            console.error('[supabase] addWebflowProducts:', err.message)
            onToast?.(`Erreur import produits Webflow : ${err.message}`, 'var(--color-danger)')
          })
          onToast?.(`${toAdd.length} nouveau(x) produit(s) importé(s) depuis Webflow`, null)
          changed = true
        }

        if (changed) {
          setProducts(next)
          localSave(next)
        }
      } catch (err) {
        console.warn('[useProducts] Webflow sync échouée:', err.message)
        onToast?.(`Sync Webflow échouée : ${err.message}`, 'var(--color-danger)')
      }
    }

    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers internes ───────────────────────────────────────────────────────

  function update(next) {
    setProducts(next)
    localSave(next)
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const addProduct = useCallback((data) => {
    const now = new Date().toISOString()
    const product = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
    update(prev => {
      const next = [...prev, product]
      localSave(next)
      return next
    })
    upsertProduct(product).catch(err => console.error('[supabase] addProduct:', err.message))
    onToast?.(`${data.name} ajouté ✓`, null)
    return product
  }, [onToast])

  const updateProduct = useCallback((id, changes) => {
    let updated
    update(prev => {
      const next = prev.map(p => {
        if (p.id !== id) return p
        updated = { ...p, ...changes, updatedAt: new Date().toISOString() }
        return updated
      })
      localSave(next)
      return next
    })
    if (updated) upsertProduct(updated).catch(err => console.error('[supabase] updateProduct:', err.message))
    onToast?.('Produit mis à jour ✓', null)
  }, [onToast])

  const deleteProduct = useCallback((id) => {
    update(prev => {
      const next = prev.filter(p => p.id !== id)
      localSave(next)
      return next
    })
    deleteSupabaseProduct(id).catch(err => console.error('[supabase] deleteProduct:', err.message))
    onToast?.('Produit supprimé', null)
  }, [onToast])

  const toggleActive = useCallback((id) => {
    let updated
    update(prev => {
      const next = prev.map(p => {
        if (p.id !== id) return p
        updated = { ...p, active: !p.active, updatedAt: new Date().toISOString() }
        return updated
      })
      localSave(next)
      return next
    })
    if (updated) upsertProduct(updated).catch(err => console.error('[supabase] toggleActive:', err.message))
  }, [])

  // ── Dérivés ────────────────────────────────────────────────────────────────

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean))
    return Array.from(set).sort()
  }, [products])

  const activeProducts   = useMemo(() => products.filter(p => p.active),  [products])
  const inactiveProducts = useMemo(() => products.filter(p => !p.active), [products])

  function getById(id) {
    if (!id) return null
    if (id.startsWith('wf-')) {
      const wfId = id.slice(3)
      return products.find(p => p.webflowProductId === wfId || p.id === id) ?? null
    }
    return products.find(p => p.id === id) ?? null
  }

  // ── Vider tous les produits ────────────────────────────────────────────────

  const resetToDemo = useCallback(() => {
    localStorage.removeItem(LOCAL_KEY)
    setProducts([])
    onToast?.('Données produits réinitialisées', null)
  }, [onToast])

  // Exposé pour la sync Sheets : remplace l'état entier + persiste
  const setProductsFromSync = useCallback((nextOrFn) => {
    setProducts(prev => {
      const next = typeof nextOrFn === 'function' ? nextOrFn(prev) : nextOrFn
      localSave(next)
      return next
    })
  }, [])

  return {
    products,
    activeProducts,
    inactiveProducts,
    categories,
    getById,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleActive,
    resetToDemo,
    setProductsFromSync,
  }
}
