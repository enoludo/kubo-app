// ─── Google Drive REST API v3 — Upload photos réceptions ──────────────────────
//
// Flux :
//  1. resolveFolderPath() → trouve/crée Kubo-Planning/Tracabilite/YYYY/MM/
//  2. Multipart upload (métadonnées + binaire en un seul appel)
//  3. setPermission 'anyone reader' → URL directe pour thumbnail
//
// Les IDs de dossiers sont mis en cache en mémoire pour éviter les appels
// répétés sur la même session.

import { getToken } from './googleAuth'

const BOUNDARY = 'kubo_tr_boundary'

// ── Cache dossiers (session uniquement) ───────────────────────────────────────
const _folderCache = new Map() // "parentId/name" → folderId

// ── Helpers Drive ─────────────────────────────────────────────────────────────

async function driveGet(path, params, token) {
  const url = new URL(`https://www.googleapis.com/drive/v3${path}`)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw Object.assign(new Error(e?.error?.message ?? `Drive HTTP ${res.status}`), { status: res.status })
  }
  return res.json()
}

async function drivePost(path, token, bodyObj) {
  const res = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(bodyObj),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw Object.assign(new Error(e?.error?.message ?? `Drive HTTP ${res.status}`), { status: res.status })
  }
  return res.json()
}

// ── Gestion des dossiers ──────────────────────────────────────────────────────

async function findFolder(name, parentId, token) {
  const cacheKey = `${parentId ?? 'root'}/${name}`
  if (_folderCache.has(cacheKey)) return _folderCache.get(cacheKey)

  const q = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentId ?? 'root'}' in parents and trashed=false`
  const data = await driveGet('/files', { q, fields: 'files(id)', pageSize: '1' }, token)
  const id   = data.files?.[0]?.id ?? null
  if (id) _folderCache.set(cacheKey, id)
  return id
}

async function createFolder(name, parentId, token) {
  const data = await drivePost('/files', token, {
    name:     name,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentId ? { parents: [parentId] } : {}),
  })
  const cacheKey = `${parentId ?? 'root'}/${name}`
  _folderCache.set(cacheKey, data.id)
  return data.id
}

async function findOrCreateFolder(name, parentId, token) {
  const existing = await findFolder(name, parentId, token)
  return existing ?? await createFolder(name, parentId, token)
}

/**
 * Résout (ou crée) la chaîne de dossiers :
 * Kubo-Planning → Tracabilite → YYYY → MM
 * @param {string} dateStr — 'YYYY-MM-DD'
 * @param {string} token
 * @returns {Promise<string>} folderId du dossier mois
 */
async function resolveFolderPath(dateStr, token) {
  const [y, m] = dateStr.split('-')
  const root  = await findOrCreateFolder('Kubo-Planning', null,  token)
  const trace = await findOrCreateFolder('Tracabilite',   root,  token)
  const year  = await findOrCreateFolder(y,               trace, token)
  const month = await findOrCreateFolder(m,               year,  token)
  return month
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeFilename(str) {
  return (str ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // enlève les accents
    .replace(/[^a-zA-Z0-9]/g, '_')   // remplace les caractères spéciaux
    .replace(/_+/g, '_')             // dédouble les underscores
    .slice(0, 40)
    .replace(/^_|_$/g, '')           // trim underscores
}

// ── Upload principal ──────────────────────────────────────────────────────────

/**
 * Upload une photo étiquette vers Google Drive.
 *
 * @param {object} params
 * @param {File}   params.file          — fichier image sélectionné
 * @param {string} params.dateStr       — 'YYYY-MM-DD'
 * @param {string} params.supplierName  — nom du fournisseur
 * @param {string} params.productName   — désignation du produit
 * @param {string} params.categoryLabel — libellé de la catégorie
 *
 * @returns {Promise<{ fileId: string, url: string }>}
 *   url = URL directe pour affichage (thumbnail + lightbox)
 *
 * @throws si non authentifié ou erreur Drive
 */
export async function uploadReceptionPhoto({ file, dateStr, supplierName, productName, categoryLabel, fileName: customFileName }) {
  const token = getToken()
  if (!token) throw new Error('Non connecté à Google. Connectez-vous via le module Planning.')

  const [y, m, d] = dateStr.split('-')
  const fileName    = customFileName
    ?? `${y}-${m}-${d}_${sanitizeFilename(supplierName)}_${sanitizeFilename(productName)}.jpg`
  const description = `${categoryLabel ?? ''} — ${productName ?? ''} — ${d}/${m}/${y}`

  // ── 1. Dossier destination ────────────────────────────────────────────────
  const folderId = await resolveFolderPath(dateStr, token)

  // ── 2. Corps multipart ────────────────────────────────────────────────────
  const meta      = JSON.stringify({ name: fileName, description, parents: [folderId] })
  const mimeType  = file.type || 'image/jpeg'
  const arrayBuf  = await file.arrayBuffer()

  const enc       = new TextEncoder()
  const sep       = `--${BOUNDARY}\r\n`
  const metaHead  = `${sep}Content-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n`
  const imgHead   = `${sep}Content-Type: ${mimeType}\r\n\r\n`
  const closing   = `\r\n--${BOUNDARY}--`

  const metaBytes = enc.encode(metaHead)
  const imgBytes  = enc.encode(imgHead)
  const endBytes  = enc.encode(closing)
  const imgData   = new Uint8Array(arrayBuf)

  const body = new Uint8Array(
    metaBytes.byteLength + imgBytes.byteLength + imgData.byteLength + endBytes.byteLength
  )
  let offset = 0
  body.set(metaBytes, offset); offset += metaBytes.byteLength
  body.set(imgBytes,  offset); offset += imgBytes.byteLength
  body.set(imgData,   offset); offset += imgData.byteLength
  body.set(endBytes,  offset)

  // ── 3. Upload ─────────────────────────────────────────────────────────────
  console.log('[drive] Upload en cours…', fileName)
  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${BOUNDARY}`,
      },
      body,
    }
  )
  if (!uploadRes.ok) {
    const e = await uploadRes.json().catch(() => ({}))
    throw new Error(e?.error?.message ?? `Erreur upload Drive (${uploadRes.status})`)
  }
  const { id: fileId } = await uploadRes.json()
  console.log('[drive] Fichier uploadé, fileId:', fileId)

  // ── 4. Permission publique (reader) ───────────────────────────────────────
  const permRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  })
  if (permRes.ok) {
    console.log('[drive] Permission publique posée ✓')
  } else {
    const e = await permRes.json().catch(() => ({}))
    console.error('[drive] Échec permission publique — les images ne s\'afficheront pas dans <img>', e?.error?.message ?? permRes.status)
  }

  const url = `https://drive.google.com/uc?export=view&id=${fileId}`
  console.log('[drive] URL finale:', url)
  return { fileId, url }
}

// ── Liste des photos ──────────────────────────────────────────────────────────

/**
 * Liste toutes les photos uploadées par cette app dans Google Drive.
 * Scope drive.file → retourne uniquement les fichiers créés par cette app.
 *
 * @returns {Promise<Array<{ fileId, name, description, createdTime, url }>>}
 */
export async function listDrivePhotos() {
  const token = getToken()
  if (!token) return []

  const data = await driveGet('/files', {
    q:        "mimeType contains 'image/' and trashed=false",
    fields:   'files(id,name,description,createdTime)',
    orderBy:  'createdTime desc',
    pageSize: '100',
  }, token).catch(err => {
    console.error('[drive] listDrivePhotos:', err.message)
    return { files: [] }
  })

  return (data.files ?? []).map(f => ({
    fileId:      f.id,
    name:        f.name,
    description: f.description ?? null,
    createdTime: f.createdTime ?? null,
    url:         `https://drive.google.com/uc?export=view&id=${f.id}`,
  }))
}
