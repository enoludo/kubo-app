// Proxy Express local — remplace vercel dev pour le développement
// Lance avec : npm run proxy
// Lit WEBFLOW_SITE_ID et WEBFLOW_API_TOKEN depuis .env.local via --env-file

import express from 'express'
import cors from 'cors'
import { IncomingForm } from 'formidable'
import { readFileSync, unlinkSync } from 'fs'
import crypto from 'crypto'

const app = express()
const PORT = 3001

// ── Service Account helpers (mirror of api/upload-photo.js) ──────────────────

const BOUNDARY  = 'kubo_proxy_boundary'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE     = 'https://www.googleapis.com/auth/drive'

let _saToken = null; let _saExpiry = 0

function b64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function getSAToken() {
  if (_saToken && Date.now() < _saExpiry) return _saToken
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const pem   = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
  if (!email || !pem) throw new Error('Service Account credentials manquants')
  const now = Math.floor(Date.now() / 1000)
  const hdr = b64url(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
  const pld = b64url(Buffer.from(JSON.stringify({ iss: email, scope: SCOPE, aud: TOKEN_URL, exp: now + 3600, iat: now })))
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(`${hdr}.${pld}`)
  const jwt = `${hdr}.${pld}.${b64url(signer.sign(pem))}`
  const res = await fetch(TOKEN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  if (!res.ok) throw new Error(`Google token error: ${await res.text()}`)
  const data = await res.json()
  _saToken = data.access_token; _saExpiry = Date.now() + (data.expires_in - 60) * 1000
  return _saToken
}

async function driveJson(url, opts) {
  const res = await fetch(url, opts)
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message ?? `Drive HTTP ${res.status}`) }
  return res.json()
}

function sanitize(str) {
  return (str ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').slice(0, 40).replace(/^_|_$/g, '')
}

app.use(cors({ origin: true }))  // autorise toutes les origines (dev local uniquement)

app.post('/api/auth-team', async (_req, res) => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY, TEAM_EMAIL, TEAM_PASSWORD } = process.env

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TEAM_EMAIL || !TEAM_PASSWORD) {
    console.error('[proxy] auth-team — variables manquantes')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body:    JSON.stringify({ email: TEAM_EMAIL, password: TEAM_PASSWORD }),
    })

    if (!authRes.ok) {
      console.error('[proxy] auth-team Supabase error:', authRes.status)
      return res.status(401).json({ error: "Échec de l'authentification" })
    }

    const data = await authRes.json()
    console.log('[proxy] auth-team OK')
    res.json({ access_token: data.access_token, refresh_token: data.refresh_token, expires_in: data.expires_in })
  } catch (err) {
    console.error('[proxy] auth-team error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/webflow-orders', async (req, res) => {
  const siteId = process.env.WEBFLOW_SITE_ID
  const token  = process.env.WEBFLOW_API_TOKEN

  if (!siteId || !token) {
    console.error('[proxy] Variables manquantes — WEBFLOW_SITE_ID:', siteId ? 'OK' : 'ABSENT', '/ WEBFLOW_API_TOKEN:', token ? 'OK' : 'ABSENT')
    return res.status(500).json({ error: 'Missing Webflow credentials' })
  }

  const { limit = '100', offset = '0', status } = req.query
  const params = new URLSearchParams({ limit, offset })
  if (status) params.set('status', status)

  const url = `https://api.webflow.com/v2/sites/${siteId}/orders?${params}`

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`[proxy] Webflow error ${response.status}:`, JSON.stringify(data).slice(0, 200))
      return res.status(response.status).json({ error: data?.message ?? 'Webflow error' })
    }

    console.log(`[proxy] ${data.orders?.length ?? 0} commande(s) reçue(s) de Webflow`)
    res.json(data)
  } catch (err) {
    console.error('[proxy] fetch error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/webflow-products', async (req, res) => {
  const siteId = process.env.WEBFLOW_SITE_ID
  const token  = process.env.WEBFLOW_API_TOKEN

  if (!siteId || !token) {
    return res.status(500).json({ error: 'Missing Webflow credentials' })
  }

  const { limit = '100', offset = '0' } = req.query
  const params = new URLSearchParams({ limit, offset })
  const url = `https://api.webflow.com/v2/sites/${siteId}/products?${params}`

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const data = await response.json()
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.message ?? 'Webflow error' })
    }
    console.log(`[proxy] ${data.items?.length ?? 0} produit(s) reçu(s) de Webflow`)
    res.json(data)
  } catch (err) {
    console.error('[proxy] fetch error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/upload-photo', async (req, res) => {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
    return res.status(500).json({ error: 'Service Account non configuré' })
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
    return res.status(500).json({ error: 'Supabase non configuré' })

  const form = new IncomingForm({ maxFileSize: 20 * 1024 * 1024, keepExtensions: true })
  let fields, files
  try { [fields, files] = await form.parse(req) }
  catch (err) { return res.status(400).json({ error: `Parse multipart: ${err.message}` }) }

  const fileObj       = files.file?.[0]
  const dateStr       = fields.dateStr?.[0]       ?? new Date().toISOString().slice(0, 10)
  const supplierName  = fields.supplierName?.[0]  ?? ''
  const productName   = fields.productName?.[0]   ?? ''
  const categoryLabel = fields.categoryLabel?.[0] ?? ''
  if (!fileObj) return res.status(400).json({ error: 'Champ "file" manquant' })

  try {
    const buffer   = readFileSync(fileObj.filepath)
    const mimeType = fileObj.mimetype || 'image/jpeg'
    const [y, m, d] = dateStr.split('-')
    const fileName    = `${y}-${m}-${d}_${sanitize(supplierName)}_${sanitize(productName)}.jpg`
    const description = `${categoryLabel} — ${productName} — ${d}/${m}/${y}`

    const { KUBO_DRIVE_FOLDER_ID } = process.env
    if (!KUBO_DRIVE_FOLDER_ID) return res.status(500).json({ error: 'KUBO_DRIVE_FOLDER_ID manquant' })

    console.log('[proxy upload] folderId:', KUBO_DRIVE_FOLDER_ID)
    console.log('[proxy upload] file:', fileObj.originalFilename, '— size:', fileObj.size)

    const token = await getSAToken()
    const meta  = JSON.stringify({ name: fileName, description, parents: [KUBO_DRIVE_FOLDER_ID] })
    const body  = Buffer.concat([
      Buffer.from(`--${BOUNDARY}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n`),
      Buffer.from(`--${BOUNDARY}\r\nContent-Type: ${mimeType}\r\n\r\n`),
      buffer,
      Buffer.from(`\r\n--${BOUNDARY}--`),
    ])
    const uploadRes = await driveJson(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${BOUNDARY}` }, body },
    )
    const fileId = uploadRes.id
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    })

    const url = `https://drive.google.com/uc?export=view&id=${fileId}`

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    await supabase.from('trace_photos').upsert(
      { file_id: fileId, url, name: fileName, date: dateStr, supplier_name: supplierName || null, product_name: productName || null, category_label: categoryLabel || null, mime_type: 'image/jpeg' },
      { onConflict: 'file_id' },
    )

    console.log('[proxy upload-photo] OK —', fileName, '— fileId:', fileId)
    res.json({ fileId, url })
  } catch (err) {
    console.error('[proxy upload-photo]', err.message)
    res.status(500).json({ error: err.message })
  } finally {
    try { unlinkSync(fileObj.filepath) } catch {}
  }
})

app.get('/api/drive-photo', async (req, res) => {
  const { id } = req.query
  if (!id || !/^[-\w]+$/.test(id)) return res.status(400).end()

  const { GOOGLE_API_KEY } = process.env
  if (!GOOGLE_API_KEY) {
    console.error('[proxy] drive-photo — GOOGLE_API_KEY manquante')
    return res.status(500).end()
  }

  try {
    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${GOOGLE_API_KEY}`
    )
    if (!driveRes.ok) {
      console.error('[proxy] drive-photo Drive error:', driveRes.status)
      return res.status(driveRes.status).end()
    }
    const contentType = driveRes.headers.get('content-type') ?? 'image/jpeg'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable')
    const buf = Buffer.from(await driveRes.arrayBuffer())
    res.send(buf)
  } catch (err) {
    console.error('[proxy] drive-photo error:', err.message)
    res.status(502).end()
  }
})

const server = app.listen(PORT, () => {
  console.log(`Webflow proxy prêt sur http://localhost:${PORT}`)
  console.log(`WEBFLOW_SITE_ID : ${process.env.WEBFLOW_SITE_ID ? 'OK' : 'MANQUANT'}`)
  console.log(`WEBFLOW_API_TOKEN : ${process.env.WEBFLOW_API_TOKEN ? 'OK' : 'MANQUANT'}`)
})

process.on('SIGTERM', () => { server.close(() => process.exit(0)) })
process.on('SIGINT',  () => { server.close(() => process.exit(0)) })
