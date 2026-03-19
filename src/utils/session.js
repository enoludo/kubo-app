// ─── Persistance sessionStorage ───────────────────────────────────────────────
// sessionStorage : vit le temps de l'onglet navigateur (pas localStorage)
// Clés stables pour shifts + team

const KEYS = {
  shifts: 'kubo_shifts',
  team:   'kubo_team',
}

export function sessionSave(key, data) {
  try { sessionStorage.setItem(KEYS[key], JSON.stringify(data)) } catch {}
}

export function sessionLoad(key) {
  try {
    const raw = sessionStorage.getItem(KEYS[key])
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function sessionClear() {
  try { Object.values(KEYS).forEach(k => sessionStorage.removeItem(k)) } catch {}
}

export function sessionHasData() {
  try { return Object.values(KEYS).some(k => sessionStorage.getItem(k) !== null) } catch { return false }
}
