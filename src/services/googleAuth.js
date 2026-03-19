// ─── Google Identity Services — OAuth 2.0 (browser only) ─────────────────────
// Charge GIS dynamiquement, demande un access token pour l'API Sheets.
// Le token est gardé en mémoire, jamais en localStorage.

const GIS_URL = 'https://accounts.google.com/gsi/client'

let _tokenClient = null
let _token       = null
let _tokenExpiry = 0   // timestamp ms
let _clientId    = null

// Charge le script GIS une seule fois
export async function loadGIS() {
  if (window.google?.accounts?.oauth2) return
  if (document.getElementById('gis-script')) {
    // Script déjà en cours de chargement — attendre
    return new Promise((res, rej) => {
      const el = document.getElementById('gis-script')
      el.addEventListener('load',  res)
      el.addEventListener('error', rej)
    })
  }
  return new Promise((res, rej) => {
    const s    = document.createElement('script')
    s.id       = 'gis-script'
    s.src      = GIS_URL
    s.async    = true
    s.onload   = res
    s.onerror  = () => rej(new Error('Impossible de charger Google Identity Services'))
    document.head.appendChild(s)
  })
}

// Initialise le client OAuth (à appeler après loadGIS)
export function initTokenClient(clientId, onSuccess, onError) {
  _clientId    = clientId
  _tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id:      clientId,
    scope:          'https://www.googleapis.com/auth/spreadsheets',
    callback:       (r) => {
      if (r.error) { onError(r.error); return }
      _token       = r.access_token
      _tokenExpiry = Date.now() + (Number(r.expires_in) - 60) * 1000 // 60s buffer
      onSuccess(_token)
    },
    error_callback: (e) => onError(e?.message ?? 'Erreur OAuth'),
  })
}

// Déclenche le popup Google (consentement explicite)
export function requestToken() {
  if (!_tokenClient) throw new Error('Token client non initialisé')
  _tokenClient.requestAccessToken({ prompt: '' })
}

// Auth silencieuse — ne déclenche aucun popup
// Réussit si l'utilisateur a déjà une session Google active avec cet app autorisé
// Échoue (error_callback) si aucune session valide → prévoir le fallback manuel
export function requestTokenSilent() {
  if (!_tokenClient) throw new Error('Token client non initialisé')
  _tokenClient.requestAccessToken({ prompt: 'none' })
}

// Refresh silencieux avec de nouveaux callbacks — réinitialise le client
// Utilise le clientId mémorisé lors du dernier initTokenClient
export function refreshTokenSilent(onSuccess, onError) {
  if (!_clientId || !window.google?.accounts?.oauth2) {
    onError(new Error('GIS non initialisé'))
    return
  }
  initTokenClient(_clientId, onSuccess, onError)
  requestTokenSilent()
}

// Vrai si le token expire dans moins de thresholdMs (défaut : 5 minutes)
export function isTokenExpiringSoon(thresholdMs = 300_000) {
  if (!_token || !_tokenExpiry) return false
  return (_tokenExpiry - Date.now()) < thresholdMs
}

// Retourne le token en cours si valide, null sinon
export function getToken() {
  return _token && Date.now() < _tokenExpiry ? _token : null
}

// Révoque et efface le token
export function revokeToken() {
  if (_token) window.google?.accounts?.oauth2?.revoke?.(_token, () => {})
  _token       = null
  _tokenExpiry = 0
}
