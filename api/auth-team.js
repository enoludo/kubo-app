// ─── Vercel Serverless Function — Auth compte Team ────────────────────────────
// POST /api/auth-team
//
// Authentifie le compte team Supabase côté serveur.
// Les credentials ne transitent jamais dans le bundle client.
//
// Variables d'environnement requises (Vercel Dashboard + .env.local en dev) :
//   SUPABASE_URL      — ex. https://xxx.supabase.co
//   SUPABASE_ANON_KEY — clé anon Supabase
//   TEAM_EMAIL        — email du compte team
//   TEAM_PASSWORD     — mot de passe du compte team

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.ALLOWED_ORIGIN,
].filter(Boolean)

function resolveOrigin(reqOrigin) {
  if (ALLOWED_ORIGINS.includes(reqOrigin)) return reqOrigin
  return ALLOWED_ORIGINS.find(o => o.startsWith('https://')) ?? ALLOWED_ORIGINS[0]
}

function setCors(res, origin) {
  res.setHeader('Access-Control-Allow-Origin',  origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req, res) {
  const origin = resolveOrigin(req.headers.origin ?? '')
  setCors(res, origin)

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method Not Allowed' })

  const { SUPABASE_URL, SUPABASE_ANON_KEY, TEAM_EMAIL, TEAM_PASSWORD } = process.env

  const envCheck = {
    SUPABASE_URL:      SUPABASE_URL      ? SUPABASE_URL.slice(0, 30) + '…' : 'MISSING',
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? 'OK' : 'MISSING',
    TEAM_EMAIL:        TEAM_EMAIL        ? 'OK' : 'MISSING',
    TEAM_PASSWORD:     TEAM_PASSWORD     ? 'OK' : 'MISSING',
  }
  console.log('[auth-team] env:', envCheck)

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TEAM_EMAIL || !TEAM_PASSWORD) {
    console.error('[auth-team] Variables manquantes')
    return res.status(500).json({ error: 'Server configuration error', env: envCheck })
  }

  try {
    const url = `${SUPABASE_URL.trim()}/auth/v1/token?grant_type=password`
    console.log('[auth-team] calling:', url)

    const authRes = await fetch(url, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey':        SUPABASE_ANON_KEY.trim(),
      },
      body: JSON.stringify({ email: TEAM_EMAIL.trim(), password: TEAM_PASSWORD }),
    })

    console.log('[auth-team] Supabase status:', authRes.status)

    if (!authRes.ok) {
      const err = await authRes.json().catch(() => ({}))
      console.error('[auth-team] Supabase error:', authRes.status, err)
      return res.status(401).json({ error: "Échec de l'authentification", detail: err })
    }

    const data = await authRes.json()
    return res.status(200).json({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_in:    data.expires_in,
    })

  } catch (err) {
    console.error('[auth-team] fetch error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
