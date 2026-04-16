// Proxy Express local — remplace vercel dev pour le développement
// Lance avec : npm run proxy
// Lit WEBFLOW_SITE_ID et WEBFLOW_API_TOKEN depuis .env.local via --env-file

import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

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

const server = app.listen(PORT, () => {
  console.log(`Webflow proxy prêt sur http://localhost:${PORT}`)
  console.log(`WEBFLOW_SITE_ID : ${process.env.WEBFLOW_SITE_ID ? 'OK' : 'MANQUANT'}`)
  console.log(`WEBFLOW_API_TOKEN : ${process.env.WEBFLOW_API_TOKEN ? 'OK' : 'MANQUANT'}`)
})

process.on('SIGTERM', () => { server.close(() => process.exit(0)) })
process.on('SIGINT',  () => { server.close(() => process.exit(0)) })
