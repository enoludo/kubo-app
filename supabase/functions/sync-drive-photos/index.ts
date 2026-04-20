// ─── Edge Function — sync-drive-photos ────────────────────────────────────────
//
// Liste les fichiers du dossier Drive Kubo-Planning/Tracabilite/ via Service Account,
// insère les nouveaux dans trace_photos, pose la permission "anyone reader".
//
// Prérequis :
//   - Dossier Kubo-Planning/Tracabilite/ partagé avec le Service Account (éditeur)
//   - Secrets Supabase : GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
//
// Déclenchement : manuel (bouton app) + cron toutes les heures

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Auth Service Account (scope Drive) ───────────────────────────────────────

const TOKEN_URL  = 'https://oauth2.googleapis.com/token'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive'

let _cachedToken = ''
let _tokenExpiry = 0

function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function importKey(pem: string): Promise<CryptoKey> {
  const cleaned = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '').replace(/\n/g, '').trim()
  const bin   = atob(cleaned)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return crypto.subtle.importKey(
    'pkcs8', bytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  )
}

async function getAccessToken(): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken

  const email = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')
  const pem   = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')
  if (!email || !pem) throw new Error('Service Account credentials manquants')

  const key = await importKey(pem)
  const now = Math.floor(Date.now() / 1000)
  const hdr = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
  const pld = base64url(new TextEncoder().encode(JSON.stringify({
    iss: email, scope: DRIVE_SCOPE, aud: TOKEN_URL, exp: now + 3600, iat: now,
  })))
  const sigBuf = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${hdr}.${pld}`),
  )
  const jwt = `${hdr}.${pld}.${base64url(sigBuf)}`

  const res = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  })
  if (!res.ok) throw new Error(`Google token error: ${await res.text()}`)

  const data = await res.json() as { access_token: string; expires_in: number }
  _cachedToken = data.access_token
  _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return _cachedToken
}

// ── Drive helpers ─────────────────────────────────────────────────────────────

async function driveList(q: string, fields: string, token: string): Promise<any[]> {
  const url = new URL('https://www.googleapis.com/drive/v3/files')
  url.searchParams.set('q',                      q)
  url.searchParams.set('fields',                 `files(${fields})`)
  url.searchParams.set('pageSize',               '200')
  url.searchParams.set('supportsAllDrives',      'true')
  url.searchParams.set('includeItemsFromAllDrives', 'true')
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as any
    throw new Error(e?.error?.message ?? `Drive ${res.status}`)
  }
  const data = await res.json() as { files: any[] }
  return data.files ?? []
}

async function findFolder(name: string, parentId: string | null, token: string): Promise<string | null> {
  const parentClause = parentId ? ` and '${parentId}' in parents` : ''
  const files = await driveList(
    `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentClause}`,
    'id',
    token,
  ).catch(() => [])
  return files[0]?.id ?? null
}

async function listSubfolders(parentId: string, token: string): Promise<string[]> {
  const files = await driveList(
    `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    'id',
    token,
  )
  return files.map((f: any) => f.id)
}

async function listImages(parentId: string, token: string): Promise<any[]> {
  return driveList(
    `'${parentId}' in parents and not mimeType='application/vnd.google-apps.folder' and trashed=false`,
    'id,name,description,createdTime,mimeType',
    token,
  )
}

async function setPublicPermission(fileId: string, token: string): Promise<boolean> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ role: 'reader', type: 'anyone' }),
    },
  )
  return res.ok
}

// ── Metadata parsing ──────────────────────────────────────────────────────────

function parseMetadata(f: { id: string; name: string; description?: string; createdTime: string; mimeType: string }) {
  let date: string | null = f.createdTime?.slice(0, 10) ?? null
  const dateMatch = f.name?.match(/^(\d{4}-\d{2}-\d{2})/)
  if (dateMatch) date = dateMatch[1]

  let categoryLabel: string | null = null
  let productName: string | null   = null
  if (f.description) {
    const parts = f.description.split(' — ')
    if (parts.length >= 2) { categoryLabel = parts[0] || null; productName = parts[1] || null }
  }

  let supplierName: string | null = null
  const noExt = (f.name ?? '').replace(/\.[^.]+$/, '')
  if (noExt.length > 11) {
    const after = noExt.slice(11)
    const idx   = after.indexOf('_')
    if (idx !== -1) supplierName = after.slice(0, idx) || null
  }

  return {
    file_id:        f.id,
    url:            `https://drive.google.com/uc?export=view&id=${f.id}`,
    name:           f.name,
    date,
    supplier_name:  supplierName,
    product_name:   productName,
    category_label: categoryLabel,
    mime_type:      f.mimeType,
  }
}

// ── Handler principal ─────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS, status: 204 })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const token = await getAccessToken()

    // ── Résolution dossier ────────────────────────────────────────────────────
    const rootId = Deno.env.get('KUBO_DRIVE_FOLDER_ID')
    if (!rootId) return Response.json({ synced: 0, message: 'KUBO_DRIVE_FOLDER_ID manquant' }, { headers: CORS })

    // ── Collecte récursive YYYY/MM ────────────────────────────────────────────
    const allFiles: any[] = await listImages(rootId, token)

    const yearFolders = await listSubfolders(rootId, token)
    for (const yearId of yearFolders) {
      allFiles.push(...await listImages(yearId, token))
      const monthFolders = await listSubfolders(yearId, token)
      for (const monthId of monthFolders) {
        allFiles.push(...await listImages(monthId, token))
      }
    }

    // ── Filtre images uniquement ──────────────────────────────────────────────
    const imageFiles = allFiles.filter(f =>
      f.mimeType?.startsWith('image/') ||
      f.name?.toLowerCase().endsWith('.heic') ||
      f.name?.toLowerCase().endsWith('.heif')
    )

    // ── Permission "anyone reader" sur TOUS les fichiers (idempotent) ─────────
    // Garantit que les fichiers antérieurs à la sync ont aussi la permission
    let permOk = 0
    for (const f of imageFiles) {
      const ok = await setPublicPermission(f.id, token)
      if (ok) permOk++
    }

    // ── Sync bidirectionnelle ─────────────────────────────────────────────────
    const { data: existing } = await supabase.from('trace_photos').select('file_id')
    const existingIds = new Set((existing ?? []).map((r: any) => r.file_id))
    const driveIds    = new Set(imageFiles.map((f: any) => f.id))

    // file_ids protégés — référencés dans photo_url d'un produit livré
    // format url : https://drive.google.com/uc?export=view&id=FILE_ID
    const { data: linkedProducts } = await supabase
      .from('delivered_products')
      .select('photo_url')
      .not('photo_url', 'is', null)
    const protectedIds = new Set(
      (linkedProducts ?? [])
        .map((r: any) => {
          const m = (r.photo_url as string)?.match(/[?&]id=([-\w]+)/)
          return m?.[1] ?? null
        })
        .filter(Boolean) as string[]
    )

    // Insertions
    const newFiles = imageFiles.filter((f: any) => !existingIds.has(f.id))
    if (newFiles.length > 0) {
      const rows = newFiles.map(parseMetadata)
      const { error } = await supabase
        .from('trace_photos')
        .upsert(rows, { onConflict: 'file_id' })
      if (error) throw error
    }

    // Suppressions — absents de Drive ET non protégés par une livraison
    const toDelete = (existing ?? [])
      .map((r: any) => r.file_id)
      .filter((id: string) => !driveIds.has(id) && !protectedIds.has(id))

    if (toDelete.length > 0) {
      const { error } = await supabase
        .from('trace_photos')
        .delete()
        .in('file_id', toDelete)
      if (error) throw error
    }

    console.log(`[sync-drive-photos] +${newFiles.length} -${toDelete.length} (${protectedIds.size} protégées), ${permOk}/${imageFiles.length} permissions`)
    return Response.json(
      {
        synced:      newFiles.length,
        deleted:     toDelete.length,
        permissions: permOk,
        total:       imageFiles.length,
        message:     newFiles.length > 0 || toDelete.length > 0
          ? `+${newFiles.length} ajoutée(s), -${toDelete.length} supprimée(s)`
          : `${imageFiles.length} photos vérifiées — à jour`,
      },
      { headers: CORS },
    )

  } catch (err: any) {
    console.error('[sync-drive-photos]', err.message)
    return Response.json({ error: err.message }, { status: 500, headers: CORS })
  }
})
