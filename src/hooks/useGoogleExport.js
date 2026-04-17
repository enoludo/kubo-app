// ─── Export Supabase → Google Sheets via Edge Function ────────────────────────
//
// Remplace l'ancien export OAuth utilisateur.
// Appelle la Edge Function export-to-sheets qui utilise le Service Account Google.
// Plus besoin de token OAuth — le frontend ne touche plus à l'API Sheets directement.

import { useState } from 'react'
import { supabase } from '../services/supabase'

/**
 * @param {object} params
 * @param {(msg: string, color?: string) => void} params.onToast
 */
export function useGoogleExport({ onToast } = {}) {
  const [exporting, setExporting] = useState(false)

  /**
   * Déclenche l'export d'un module vers Sheets via la Edge Function.
   * @param {'planning'|'temperatures'|'cleaning'|'traceability'|'all'} module
   * @returns {Promise<boolean>}
   */
  async function runExport(module = 'all') {
    setExporting(true)
    const label = {
      planning:      'Planning',
      temperatures:  'Températures',
      cleaning:      'Nettoyage',
      traceability:  'Traçabilité',
      all:           'complet',
    }[module] ?? module

    onToast?.(`Export ${label} en cours…`, null)

    try {
      const { data, error } = await supabase.functions.invoke('export-to-sheets', {
        body: { module },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      onToast?.(`Export ${label} terminé ✓`, null)
      return true
    } catch (err) {
      const msg = err?.message ?? 'Erreur inconnue'
      onToast?.(`Export ${label} échoué : ${msg}`, 'var(--color-danger)')
      return false
    } finally {
      setExporting(false)
    }
  }

  return { exporting, runExport }
}
