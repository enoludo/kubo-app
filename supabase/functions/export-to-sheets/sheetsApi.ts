// ─── Google Sheets API v4 — helpers HTTP ──────────────────────────────────────
//
// Toutes les opérations passent par fetch() + access token.
// Pas de dépendance googleapis (Node.js uniquement).

// ── Types ─────────────────────────────────────────────────────────────────────

export type CellValue = string | number | boolean | null

export interface RowData {
  values: CellValue[]
}

export interface SheetProperties {
  sheetId:    number
  title:      string
  index:      number
  sheetType?: string
}

export interface Color {
  red?:   number  // 0–1
  green?: number
  blue?:  number
  alpha?: number
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function sheetsCall(
  method:  string,
  url:     string,
  token:   string,
  body?:   unknown,
): Promise<unknown> {
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } })) as { error?: { message?: string } }
    throw new Error(err?.error?.message ?? `Sheets API error ${res.status}`)
  }

  return res.json()
}

// ── Spreadsheet info ──────────────────────────────────────────────────────────

export async function getSpreadsheet(token: string, spreadsheetId: string): Promise<{ sheets: { properties: SheetProperties }[] }> {
  return sheetsCall('GET', `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, token) as Promise<{ sheets: { properties: SheetProperties }[] }>
}

// ── Gestion des feuilles ──────────────────────────────────────────────────────

/**
 * Crée un onglet s'il n'existe pas, retourne son sheetId.
 * Si l'onglet existe déjà, retourne son sheetId existant.
 */
export async function ensureSheet(
  token:         string,
  spreadsheetId: string,
  title:         string,
): Promise<number> {
  const meta = await getSpreadsheet(token, spreadsheetId)
  const existing = meta.sheets.find(s => s.properties.title === title)
  if (existing) return existing.properties.sheetId

  const res = await sheetsCall('POST',
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    token,
    {
      requests: [{ addSheet: { properties: { title } } }],
    },
  ) as { replies: [{ addSheet: { properties: SheetProperties } }] }

  return res.replies[0].addSheet.properties.sheetId
}

// ── Lecture / écriture ────────────────────────────────────────────────────────

/** Vide une plage avant réécriture. */
export async function clearRange(
  token:         string,
  spreadsheetId: string,
  range:         string,
): Promise<void> {
  await sheetsCall('POST',
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
    token,
  )
}

/** Écrit des lignes dans une plage (RAW — pas d'interprétation formule). */
export async function writeValues(
  token:         string,
  spreadsheetId: string,
  range:         string,
  rows:          CellValue[][],
): Promise<void> {
  await sheetsCall('PUT',
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    token,
    { range, majorDimension: 'ROWS', values: rows },
  )
}

// ── Mise en forme batchUpdate ─────────────────────────────────────────────────

/** Envoie un tableau de requests de formatage en une seule requête batchUpdate. */
export async function batchFormat(
  token:         string,
  spreadsheetId: string,
  requests:      unknown[],
): Promise<void> {
  if (!requests.length) return
  await sheetsCall('POST',
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    token,
    { requests },
  )
}

// ── Helpers de mise en forme ──────────────────────────────────────────────────

/** Fond sombre + texte blanc + gras — pour les lignes d'en-tête. */
export function headerFormatRequest(sheetId: number, rowIndex: number, numCols: number) {
  return {
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: rowIndex,
        endRowIndex:   rowIndex + 1,
        startColumnIndex: 0,
        endColumnIndex:   numCols,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.102, green: 0.102, blue: 0.18 },  // #1a1a2e
          textFormat:      { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true },
          borders: allBorders(),
        },
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat,borders)',
    },
  }
}

/** Lignes alternées blanc / gris très clair. */
export function alternatingRowsRequest(sheetId: number, startRow: number, endRow: number, numCols: number) {
  const requests = []
  for (let r = startRow; r < endRow; r++) {
    const isEven = (r - startRow) % 2 === 0
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: r,
          endRowIndex:   r + 1,
          startColumnIndex: 0,
          endColumnIndex:   numCols,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: isEven
              ? { red: 1, green: 1, blue: 1 }
              : { red: 0.96, green: 0.96, blue: 0.96 },
            borders: allBorders(),
          },
        },
        fields: 'userEnteredFormat(backgroundColor,borders)',
      },
    })
  }
  return requests
}

/** Cellule colorée selon une couleur RGBA (0–1). */
export function cellColorRequest(sheetId: number, row: number, col: number, color: Color) {
  return {
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: row, endRowIndex: row + 1,
        startColumnIndex: col, endColumnIndex: col + 1,
      },
      cell: { userEnteredFormat: { backgroundColor: color, borders: allBorders() } },
      fields: 'userEnteredFormat(backgroundColor,borders)',
    },
  }
}

/** Auto-resize toutes les colonnes. */
export function autoResizeRequest(sheetId: number, numCols: number) {
  return {
    autoResizeDimensions: {
      dimensions: {
        sheetId,
        dimension:  'COLUMNS',
        startIndex: 0,
        endIndex:   numCols,
      },
    },
  }
}

/** Fige la première ligne (en-tête). */
export function freezeFirstRowRequest(sheetId: number) {
  return {
    updateSheetProperties: {
      properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
      fields: 'gridProperties.frozenRowCount',
    },
  }
}

/** Bordures fines sur toutes les côtés. */
function allBorders() {
  const thin = { style: 'SOLID', width: 1, color: { red: 0.8, green: 0.8, blue: 0.8 } }
  return { top: thin, bottom: thin, left: thin, right: thin }
}

// ── Helpers couleur pratiques ─────────────────────────────────────────────────

export const COLORS = {
  red:         { red: 1,    green: 0.8,  blue: 0.8  } as Color,
  green:       { red: 0.8,  green: 0.95, blue: 0.8  } as Color,
  orange:      { red: 1,    green: 0.92, blue: 0.8  } as Color,
  grey:        { red: 0.9,  green: 0.9,  blue: 0.9  } as Color,
  white:       { red: 1,    green: 1,    blue: 1    } as Color,
  lightGrey:   { red: 0.96, green: 0.96, blue: 0.96 } as Color,
}

// ── Écriture complète d'un onglet ─────────────────────────────────────────────

/**
 * Réécrit complètement un onglet :
 * 1. Vide la feuille
 * 2. Écrit les données
 * 3. Applique les formats (en-tête, lignes alternées, auto-resize, freeze)
 */
export async function writeSheet(
  token:         string,
  spreadsheetId: string,
  sheetTitle:    string,
  headers:       string[],
  rows:          CellValue[][],
  extraRequests: unknown[] = [],
): Promise<void> {
  const sheetId = await ensureSheet(token, spreadsheetId, sheetTitle)
  const range   = `${sheetTitle}!A1`

  await clearRange(token, spreadsheetId, `${sheetTitle}!A:ZZ`)
  await writeValues(token, spreadsheetId, range, [headers, ...rows])

  const formatRequests = [
    headerFormatRequest(sheetId, 0, headers.length),
    ...alternatingRowsRequest(sheetId, 1, rows.length + 1, headers.length),
    autoResizeRequest(sheetId, headers.length),
    freezeFirstRowRequest(sheetId),
    ...extraRequests,
  ]

  await batchFormat(token, spreadsheetId, formatRequests)
}
