// ─── Service Account Auth — Google OAuth 2.0 ─────────────────────────────────
//
// Authentification via Service Account (pas d'OAuth utilisateur).
// Génère un JWT RS256 signé avec la clé privée du Service Account,
// l'échange contre un access_token Google, mis en cache pour 55 minutes.
//
// Dépend uniquement de l'API Web Crypto standard (disponible dans Deno/Edge).

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE     = 'https://www.googleapis.com/auth/spreadsheets'

let _cachedToken: string | null = null
let _tokenExpiry: number        = 0  // timestamp ms

// ── Helpers crypto ────────────────────────────────────────────────────────────

function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin     = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function encodeJSON(obj: unknown): string {
  return base64url(new TextEncoder().encode(JSON.stringify(obj)))
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // Nettoyer le PEM (les secrets Supabase peuvent avoir des \n littéraux)
  const cleaned = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\n/g, '')
    .trim()

  const binary = atob(cleaned)
  const bytes  = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  return crypto.subtle.importKey(
    'pkcs8',
    bytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

// ── JWT RS256 ─────────────────────────────────────────────────────────────────

async function makeJWT(email: string, privateKey: CryptoKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  const header  = encodeJSON({ alg: 'RS256', typ: 'JWT' })
  const payload = encodeJSON({
    iss:   email,
    scope: SCOPE,
    aud:   TOKEN_URL,
    exp:   now + 3600,
    iat:   now,
  })

  const sigInput = `${header}.${payload}`
  const sigBuf   = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(sigInput),
  )

  return `${sigInput}.${base64url(sigBuf)}`
}

// ── Export principal ──────────────────────────────────────────────────────────

/**
 * Retourne un access token Google valide.
 * Met le token en cache pendant 55 minutes pour éviter les requêtes redondantes.
 */
export async function getAccessToken(): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken

  const email      = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')
  const privateKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')

  if (!email || !privateKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL ou GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY manquant')
  }

  const key = await importPrivateKey(privateKey)
  const jwt = await makeJWT(email, key)

  const res = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google token error ${res.status}: ${err}`)
  }

  const data = await res.json() as { access_token: string; expires_in: number }
  _cachedToken = data.access_token
  _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000  // 60s buffer

  return _cachedToken
}
