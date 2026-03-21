// Proxy Express local — remplace vercel dev pour le développement
// Lance avec : npm run proxy
// Lit WEBFLOW_SITE_ID et WEBFLOW_API_TOKEN depuis .env.local via --env-file

import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

app.use(cors({ origin: 'http://localhost:5173' }))

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

const server = app.listen(PORT, () => {
  console.log(`Webflow proxy prêt sur http://localhost:${PORT}`)
  console.log(`WEBFLOW_SITE_ID : ${process.env.WEBFLOW_SITE_ID ? 'OK' : 'MANQUANT'}`)
  console.log(`WEBFLOW_API_TOKEN : ${process.env.WEBFLOW_API_TOKEN ? 'OK' : 'MANQUANT'}`)
})

process.on('SIGTERM', () => { server.close(() => process.exit(0)) })
process.on('SIGINT',  () => { server.close(() => process.exit(0)) })
