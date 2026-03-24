// ─── Sync produits → Google Sheets ────────────────────────────────────────────
//
// Flux :
//  1. products change + token dispo → debounce 1s → push 4 sheets
//  2. connect() → pull immédiat → merge dans l'état local via setProducts
//
// L'app est la seule source de vérité.
// Le Sheet est une vue en lecture. Pas de polling, pas de résolution de conflits.

import { useState, useEffect, useRef } from 'react'
import { writeProductsToSheet, readProductsFromSheet } from '../services/googleSheets'

const DEBOUNCE_MS = 1_000

export function useProductsGoogleSync({ products, getToken, setProducts, onToast }) {
  const [syncStatus, setSyncStatus] = useState('idle')  // 'idle' | 'syncing' | 'synced' | 'error'

  const productsRef  = useRef(products)
  const debounceRef  = useRef(null)
  // C1 : suppress le premier fire après un pull (consume-once)
  const suppressRef  = useRef(false)
  // C2 : sig produits — push uniquement si le contenu a changé
  const lastSigRef   = useRef(null)

  useEffect(() => { productsRef.current = products }, [products])

  // Debounce push — déclenché à chaque modification locale
  useEffect(() => {
    const token = getToken()
    if (!token) return
    if (suppressRef.current) {
      suppressRef.current = false
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(push, DEBOUNCE_MS)
  }, [products]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup au démontage
  useEffect(() => () => clearTimeout(debounceRef.current), [])

  // ── Push : App → Sheets ─────────────────────────────────────────────────────

  async function push() {
    const token = getToken()
    if (!token) return

    const sig = JSON.stringify(productsRef.current.map(p => p.id + p.updatedAt))
    if (sig === lastSigRef.current) return  // inchangé, on saute

    setSyncStatus('syncing')
    try {
      await writeProductsToSheet(token, productsRef.current)
      lastSigRef.current = sig
      setSyncStatus('synced')
    } catch (err) {
      onToast?.('Sync produits échouée — données locales préservées', '#E05555')
      setSyncStatus('error')
    }
  }

  // ── Pull : Sheets → App (au premier connect) ────────────────────────────────

  async function pullOnConnect() {
    const token = getToken()
    if (!token) return

    setSyncStatus('syncing')
    try {
      const remoteProducts = await readProductsFromSheet(token)

      if (remoteProducts && remoteProducts.length > 0) {
        // C1 : suppress = true AVANT la mise à jour pour bloquer le push immédiat
        suppressRef.current = true
        setProducts(() => remoteProducts)
        lastSigRef.current = JSON.stringify(remoteProducts.map(p => p.id + p.updatedAt))
      } else {
        // Pas de données distantes (sheets vides ou inexistantes) → push local
        await push()
        return  // push gère déjà le status
      }

      setSyncStatus('synced')
    } catch (err) {
      setSyncStatus('error')
      onToast?.('Lecture produits échouée', '#E05555')
    }
  }

  return { syncStatus, pullOnConnect }
}
