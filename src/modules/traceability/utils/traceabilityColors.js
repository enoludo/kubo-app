// ─── Palette couleurs fournisseurs — Traçabilité ──────────────────────────────
// Même logique que tempColors.jsx (Températures) :
//   colorIndex 0-5 → primitif design-tokens.css
//   -100 = fond cellule passée    (bgColor)
//   -200 = fond pill conforme     (pillColor)
//   -300 = fond avatar carte      (badgeColor)

export const SUPPLIER_COLOR_PALETTE = [
  { key: 'blue',   bgColor: 'var(--color-blue-100)',   pillColor: 'var(--color-blue-200)',   badgeColor: 'var(--color-blue-300)'   },
  { key: 'green',  bgColor: 'var(--color-green-100)',  pillColor: 'var(--color-green-200)',  badgeColor: 'var(--color-green-300)'  },
  { key: 'yellow', bgColor: 'var(--color-yellow-100)', pillColor: 'var(--color-yellow-200)', badgeColor: 'var(--color-yellow-300)' },
  { key: 'orange', bgColor: 'var(--color-orange-100)', pillColor: 'var(--color-orange-200)', badgeColor: 'var(--color-orange-300)' },
  { key: 'violet', bgColor: 'var(--color-violet-100)', pillColor: 'var(--color-violet-200)', badgeColor: 'var(--color-violet-300)' },
  { key: 'red',    bgColor: 'var(--color-red-100)',    pillColor: 'var(--color-red-200)',    badgeColor: 'var(--color-red-300)'    },
]

export function getSupplierColors(supplier) {
  return SUPPLIER_COLOR_PALETTE[supplier.colorIndex ?? 0] ?? SUPPLIER_COLOR_PALETTE[0]
}
