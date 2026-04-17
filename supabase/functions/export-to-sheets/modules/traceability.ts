// ─── Export Traçabilité → Google Sheets ──────────────────────────────────────
//
// Onglet 1 — "Réceptions du mois" : delivered_products du mois courant
// Onglet 2 — "Fournisseurs"       : liste des suppliers actifs

import { writeSheet, cellColorRequest, COLORS, ensureSheet, clearRange,
         writeValues, batchFormat, headerFormatRequest, alternatingRowsRequest,
         autoResizeRequest, freezeFirstRowRequest, type CellValue } from '../sheetsApi.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Supplier {
  id: string; name: string; contact_name: string | null
  phone: string | null; active: boolean
}

interface DeliveredProduct {
  id: string; supplier_id: string; date: string
  product_name: string; weight_text: string | null
  lot: string | null; dlc: string | null
  temperature: number | null; conformity: string
  non_conformity_note: string | null; created_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

// ── Export ────────────────────────────────────────────────────────────────────

export async function exportTraceability(
  supabase: SupabaseClient,
  token:    string,
  sheetId:  string,
): Promise<void> {
  const now = new Date()

  // ── Charger les données ───────────────────────────────────────────────────

  const { data: suppliers, error: supErr } = await supabase
    .from('suppliers')
    .select('*')
    .order('name')
  if (supErr) throw new Error(`suppliers: ${supErr.message}`)

  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastOfMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const { data: deliveries, error: delErr } = await supabase
    .from('delivered_products')
    .select('*')
    .gte('date', dateStr(firstOfMonth))
    .lte('date', dateStr(lastOfMonth))
    .order('date', { ascending: false })
  if (delErr) throw new Error(`delivered_products: ${delErr.message}`)

  const supById = Object.fromEntries((suppliers ?? []).map((s: Supplier) => [s.id, s]))

  // ── Onglet 1 — Réceptions du mois ─────────────────────────────────────────

  const receptHeaders = [
    'Date', 'Heure', 'Fournisseur', 'Produit', 'Poids/Volume',
    'Lot', 'DLC', 'Température (°C)', 'Conformité', 'Note non-conformité',
  ]

  const receptRows: CellValue[][] = (deliveries ?? []).map((d: DeliveredProduct) => {
    const sup = supById[d.supplier_id]
    return [
      fmtDate(d.date),
      d.created_at ? fmtDateTime(d.created_at) : '',
      sup?.name ?? d.supplier_id,
      d.product_name,
      d.weight_text ?? '',
      d.lot ?? '',
      d.dlc ? fmtDate(d.dlc) : '',
      d.temperature ?? '',
      d.conformity === 'compliant' ? 'Conforme' : 'Non conforme',
      d.non_conformity_note ?? '',
    ]
  })

  // Écriture manuelle pour colorier la colonne conformité
  const receptSheetId = await ensureSheet(token, sheetId, 'Réceptions du mois')
  await clearRange(token, sheetId, 'Réceptions du mois!A:ZZ')
  await writeValues(token, sheetId, 'Réceptions du mois!A1', [receptHeaders, ...receptRows])

  const conformityRequests: unknown[] = (deliveries ?? []).map((d: DeliveredProduct, i: number) => {
    const isCompliant = d.conformity === 'compliant'
    return cellColorRequest(
      receptSheetId,
      i + 1,           // row (0-based, +1 pour l'en-tête)
      8,               // colonne "Conformité" (index 8)
      isCompliant ? COLORS.green : COLORS.red,
    )
  })

  // Fond rouge clair sur toute la ligne si non conforme
  const nonCompliantRowRequests = (deliveries ?? []).reduce((acc: unknown[], d: DeliveredProduct, i: number) => {
    if (d.conformity !== 'compliant') {
      acc.push({
        repeatCell: {
          range: {
            sheetId: receptSheetId,
            startRowIndex: i + 1, endRowIndex: i + 2,
            startColumnIndex: 0, endColumnIndex: receptHeaders.length,
          },
          cell: { userEnteredFormat: { backgroundColor: { red: 1, green: 0.93, blue: 0.93 } } },
          fields: 'userEnteredFormat.backgroundColor',
        },
      })
    }
    return acc
  }, [])

  await batchFormat(token, sheetId, [
    headerFormatRequest(receptSheetId, 0, receptHeaders.length),
    ...alternatingRowsRequest(receptSheetId, 1, receptRows.length + 1, receptHeaders.length),
    autoResizeRequest(receptSheetId, receptHeaders.length),
    freezeFirstRowRequest(receptSheetId),
    ...nonCompliantRowRequests,
    ...conformityRequests,
  ])

  // ── Onglet 2 — Fournisseurs ───────────────────────────────────────────────

  const supHeaders = ['Nom', 'Contact', 'Téléphone', 'Actif']
  const supRows: CellValue[][] = (suppliers ?? []).map((s: Supplier) => [
    s.name,
    s.contact_name ?? '',
    s.phone        ?? '',
    s.active ? 'Oui' : 'Non',
  ])

  await writeSheet(token, sheetId, 'Fournisseurs', supHeaders, supRows)
}
