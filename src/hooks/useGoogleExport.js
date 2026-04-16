// ─── Export manuel Supabase → Google Sheets ────────────────────────────────────
//
// Reçoit un getToken() depuis useGoogleSync (via App.jsx ou PlanningApp).
// Expose une fonction export + un statut d'export.

import { useState } from 'react'

/**
 * @param {object} params
 * @param {() => string|null} params.getToken  — retourne le token OAuth actuel
 * @param {(msg, color) => void} params.onToast
 */
export function useGoogleExport({ getToken, onToast }) {
  const [exporting, setExporting] = useState(false)

  /**
   * Déclenche un export et affiche un toast.
   * @param {() => Promise<void>} exportFn — appel à sheetsExport.*
   * @param {string} label — nom du module pour les messages toast
   */
  async function runExport(exportFn, label) {
    const token = getToken?.()
    if (!token) {
      onToast?.(`Google non connecté — connectez-vous d'abord`, 'var(--color-danger)')
      return false
    }
    setExporting(true)
    onToast?.(`Export ${label} en cours…`, 'var(--color-grey-500)')
    try {
      await exportFn(token)
      onToast?.(`Export ${label} terminé ✓`, 'var(--color-success)')
      return true
    } catch (err) {
      onToast?.(`Export ${label} échoué : ${err.message}`, 'var(--color-danger)')
      return false
    } finally {
      setExporting(false)
    }
  }

  return { exporting, runExport }
}
