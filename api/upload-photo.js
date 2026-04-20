// ─── Vercel Serverless Function — Upload photo vers Google Drive ───────────────
// POST /api/upload-photo (multipart/form-data)
//
// Fields :
//   file           — image (HEIC, JPEG, PNG…)
//   dateStr        — 'YYYY-MM-DD'
//   supplierName   — nom du fournisseur
//   productName    — désignation du produit
//   categoryLabel  — libellé catégorie (optionnel)
//
// Variables d'environnement requises :
//   GOOGLE_SERVICE_ACCOUNT_EMAIL
//   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js'
import formidable        from 'formidable'
import { readFileSync, unlinkSync } from 'fs'
import crypto            from 'crypto'
import convert           from 'heic-convert'

export const config = {
  api: { bodyParser: false },
}

const BOUNDARY  = 'kubo_upload_boundary'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE     = 'https://www.googleapis.com/auth/drive'

// ── Service Account JWT ───────────────────────────────────────────────────────

let _token  = null
let _expiry = 0

function b64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function getToken() {
  if (_token && Date.now() < _expiry) return _token

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const pem   = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
  if (!email || !pem) throw new Error('Service Account credentials manquants')

  const now     = Math.floor(Date.now() / 1000)
  const header  = b64url(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
  const payload = b64url(Buffer.from(JSON.stringify({ iss: email, scope: SCOPE, aud: TOKEN_URL, exp: now + 3600, iat: now })))
  const signer  = crypto.createSign('RSA-SHA256')
  signer.update(`${header}.${payload}`)
  const jwt = `${header}.${payload}.${b64url(signer.sign(pem))}`

  const res = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  if (!res.ok) throw new Error(`Google token error: ${await res.text()}`)

  const data = await res.json()
  _token  = data.access_token
  _expiry = Date.now() + (data.expires_in - 60) * 1000
  return _token
}

// ── Drive helpers ─────────────────────────────────────────────────────────────

async function driveJson(url, opts) {
  const res = await fetch(url, opts)
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e?.error?.message ?? `Drive HTTP ${res.status}`)
  }
  return res.json()
}

async function findFolder(name, parentId, token) {
  const parentClause = parentId ? ` and '${parentId}' in parents` : ''
  const q   = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentClause}`
  const url = new URL('https://www.googleapis.com/drive/v3/files')
  url.searchParams.set('q', q)
  url.searchParams.set('fields', 'files(id)')
  url.searchParams.set('pageSize', '1')
  const data = await driveJson(url, { headers: { Authorization: `Bearer ${token}` } })
  return data.files?.[0]?.id ?? null
}

async function createFolder(name, parentId, token) {
  const data = await driveJson('https://www.googleapis.com/drive/v3/files', {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', ...(parentId ? { parents: [parentId] } : {}) }),
  })
  return data.id
}

async function findOrCreate(name, parentId, token) {
  return (await findFolder(name, parentId, token)) ?? (await createFolder(name, parentId, token))
}

async function resolveFolderPath(dateStr, token) {
  const [y, m] = dateStr.split('-')
  const root  = await findOrCreate('Kubo-Planning', null,  token)
  const trace = await findOrCreate('Tracabilite',   root,  token)
  const year  = await findOrCreate(y,               trace, token)
  return        await findOrCreate(m,               year,  token)
}

async function uploadFile({ buffer, mimeType, fileName, description, folderId, token }) {
  const meta     = JSON.stringify({ name: fileName, description, parents: [folderId] })
  const body     = Buffer.concat([
    Buffer.from(`--${BOUNDARY}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n`),
    Buffer.from(`--${BOUNDARY}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${BOUNDARY}--`),
  ])
  const data = await driveJson(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${BOUNDARY}` },
      body,
    },
  )
  return data.id
}

async function setPublicPermission(fileId, token) {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ role: 'reader', type: 'anyone' }),
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitize(str) {
  return (str ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').slice(0, 40).replace(/^_|_$/g, '')
}

function isHeic(mime, name) {
  return (mime ?? '').includes('heic') || (mime ?? '').includes('heif') ||
    (name ?? '').toLowerCase().endsWith('.heic') || (name ?? '').toLowerCase().endsWith('.heif')
}

// ── Handler principal ─────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const form = formidable({ maxFileSize: 20 * 1024 * 1024, keepExtensions: true })
  let fields, files
  try {
    ;[fields, files] = await form.parse(req)
  } catch (err) {
    return res.status(400).json({ error: `Parse multipart: ${err.message}` })
  }

  const fileObj       = files.file?.[0]
  const dateStr       = fields.dateStr?.[0]       ?? new Date().toISOString().slice(0, 10)
  const supplierName  = fields.supplierName?.[0]  ?? ''
  const productName   = fields.productName?.[0]   ?? ''
  const categoryLabel = fields.categoryLabel?.[0] ?? ''

  if (!fileObj) return res.status(400).json({ error: 'Champ "file" manquant' })

  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
    return res.status(500).json({ error: 'Service Account non configuré' })
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
    return res.status(500).json({ error: 'Supabase non configuré' })

  try {
    let buffer   = readFileSync(fileObj.filepath)
    let mimeType = fileObj.mimetype || 'image/jpeg'

    // ── Conversion HEIC → JPEG ───────────────────────────────────────────────
    if (isHeic(mimeType, fileObj.originalFilename)) {
      buffer   = Buffer.from(await convert({ buffer, format: 'JPEG', quality: 0.7 }))
      mimeType = 'image/jpeg'
    }

    // ── Nom de fichier ───────────────────────────────────────────────────────
    const [y, m, d] = dateStr.split('-')
    const fileName    = `${y}-${m}-${d}_${sanitize(supplierName)}_${sanitize(productName)}.jpg`
    const description = `${categoryLabel} — ${productName} — ${d}/${m}/${y}`

    // ── Upload Drive ─────────────────────────────────────────────────────────
    const token    = await getToken()
    const folderId = await resolveFolderPath(dateStr, token)
    const fileId   = await uploadFile({ buffer, mimeType, fileName, description, folderId, token })
    await setPublicPermission(fileId, token)

    const url = `https://drive.google.com/uc?export=view&id=${fileId}`

    // ── Supabase trace_photos ────────────────────────────────────────────────
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    await supabase.from('trace_photos').upsert(
      { file_id: fileId, url, name: fileName, date: dateStr, supplier_name: supplierName || null, product_name: productName || null, category_label: categoryLabel || null, mime_type: 'image/jpeg' },
      { onConflict: 'file_id' },
    )

    console.log('[upload-photo] OK —', fileName, '— fileId:', fileId)
    return res.status(200).json({ fileId, url })

  } catch (err) {
    console.error('[upload-photo]', err.message)
    return res.status(500).json({ error: err.message })
  } finally {
    try { unlinkSync(fileObj.filepath) } catch {}
  }
}
