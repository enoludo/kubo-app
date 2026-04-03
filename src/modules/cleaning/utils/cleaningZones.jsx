// ─── Définition des zones de nettoyage ───────────────────────────────────────

// ── Palette de couleurs disponibles ──────────────────────────────────────────

export const COLOR_PALETTE = [
  { key: 'blue',   token: 'var(--color-blue-300)',   bgToken: 'var(--color-blue-100)',   pillToken: 'var(--color-blue-200)'   },
  { key: 'violet', token: 'var(--color-violet-300)', bgToken: 'var(--color-violet-100)', pillToken: 'var(--color-violet-200)' },
  { key: 'orange', token: 'var(--color-orange-300)', bgToken: 'var(--color-orange-100)', pillToken: 'var(--color-orange-200)' },
  { key: 'green',  token: 'var(--color-green-300)',  bgToken: 'var(--color-green-100)',  pillToken: 'var(--color-green-200)'  },
  { key: 'yellow', token: 'var(--color-yellow-300)', bgToken: 'var(--color-yellow-100)', pillToken: 'var(--color-yellow-200)' },
  { key: 'red',    token: 'var(--color-red-300)',    bgToken: 'var(--color-red-100)',    pillToken: 'var(--color-red-200)'    },
]

export function getColorByKey(key) {
  return COLOR_PALETTE.find(c => c.key === key) ?? COLOR_PALETTE[0]
}

/** Convertit une zone stockée (id, name, color) en objet d'affichage complet. */
export function resolveZone(zone) {
  const color = getColorByKey(zone.color)
  return {
    id:        zone.id,
    label:     zone.name,
    token:     color.token,
    bgToken:   color.bgToken,
    pillToken: color.pillToken,
    icon:      null,          // zones dynamiques : pas d'icône SVG, initiales à la place
    initials:  zone.name.slice(0, 2).toUpperCase(),
  }
}

// ── Zones initiales (compatibilité IDs existants) ─────────────────────────────

export const INITIAL_ZONES = [
  { id: 'laboratoire', name: 'Laboratoire', color: 'blue'   },
  { id: 'froid',       name: 'Froid',       color: 'violet' },
  { id: 'cuisson',     name: 'Cuisson',     color: 'orange' },
  { id: 'vente',       name: 'Vente',       color: 'green'  },
  { id: 'sols',        name: 'Sols & Murs', color: 'yellow' },
  { id: 'sanitaires',  name: 'Sanitaires',  color: 'red'    },
]

// Rétrocompatibilité — utilisé si quelque chose importe encore ZONES
export const ZONES = INITIAL_ZONES.map(resolveZone)

export function getZone(id) {
  return ZONES.find(z => z.id === id) ?? null
}
