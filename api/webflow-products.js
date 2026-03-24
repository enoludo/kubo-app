// ─── Vercel Serverless Function — Proxy Webflow Ecommerce Products ────────────
// GET /api/webflow-products
//
// Variables d'environnement requises :
//   WEBFLOW_SITE_ID    — ID du site Webflow
//   WEBFLOW_API_TOKEN  — Bearer token Webflow API v2
//   ALLOWED_ORIGIN     — Domaine de production (optionnel)

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.ALLOWED_ORIGIN,
].filter(Boolean)

if (!process.env.ALLOWED_ORIGIN && process.env.VERCEL_ENV === 'production') {
  console.warn('[webflow-products] ALLOWED_ORIGIN non défini en production — restreindre le CORS')
}

function resolveOrigin(reqOrigin) {
  if (ALLOWED_ORIGINS.includes(reqOrigin)) return reqOrigin
  return reqOrigin || ALLOWED_ORIGINS[0]
}

function setCors(res, allowedOrigin) {
  res.setHeader('Access-Control-Allow-Origin',  allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req, res) {
  const allowedOrigin = resolveOrigin(req.headers.origin ?? '')
  setCors(res, allowedOrigin)

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { WEBFLOW_SITE_ID, WEBFLOW_API_TOKEN } = process.env

  console.log('[webflow-products] SITE_ID:', WEBFLOW_SITE_ID ? 'OK' : 'MANQUANT')
  console.log('[webflow-products] TOKEN:', WEBFLOW_API_TOKEN ? 'OK' : 'MANQUANT')

  if (!WEBFLOW_SITE_ID || !WEBFLOW_API_TOKEN) {
    console.error('[webflow-products] Variables manquantes — vérifier .env.local ou Dashboard Vercel')
    return res.status(500).json({ error: 'Missing Webflow credentials' })
  }

  const { limit = '100', offset = '0' } = req.query
  const params = new URLSearchParams({ limit, offset })
  const url = `https://api.webflow.com/v2/sites/${WEBFLOW_SITE_ID}/products?${params}`

  try {
    const webflowRes = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
      },
    })

    if (webflowRes.status === 401) {
      return res.status(401).json({ error: 'Webflow authentication failed' })
    }
    if (webflowRes.status === 403) {
      return res.status(403).json({ error: 'Webflow access forbidden — check token permissions' })
    }
    if (webflowRes.status === 429) {
      const retryAfter = webflowRes.headers.get('retry-after') ?? '60'
      return res.status(429).json({ error: 'Rate limit reached', retryAfter: Number(retryAfter) })
    }
    if (!webflowRes.ok) {
      const body = await webflowRes.text()
      console.error(`[webflow-products] Webflow error ${webflowRes.status}:`, body)
      return res.status(502).json({ error: `Webflow error ${webflowRes.status}` })
    }

    const data = await webflowRes.json()
    return res.status(200).json(data)

  } catch (err) {
    console.error('[webflow-products] fetch error:', err.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
