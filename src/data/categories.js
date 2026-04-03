// ─── Catégories fournisseurs — source de vérité ────────────────────────────
// Lié aux tokens --tr-cat-* dans traceability-tokens.css
// UI d'édition prévue au sprint 3-4.

export const CATEGORIES = [
  { id: 'flour',     label: 'Farines & Céréales',  colorKey: 'flour'     },
  { id: 'dairy',     label: 'Produits laitiers',   colorKey: 'dairy'     },
  { id: 'eggs',      label: 'Œufs',                colorKey: 'eggs'      },
  { id: 'fruits',    label: 'Fruits & Légumes',    colorKey: 'fruits'    },
  { id: 'packaging', label: 'Emballages',          colorKey: 'packaging' },
  { id: 'cleaning',  label: 'Entretien & Hygiène', colorKey: 'cleaning'  },
  { id: 'beverages', label: 'Boissons & Sirops',   colorKey: 'beverages' },
  { id: 'other',     label: 'Autres',              colorKey: 'other'     },
]

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}

/** Retourne les tokens CSS pour une catégorie donnée */
export function getCategoryTokens(categoryId) {
  const cat = getCategoryById(categoryId)
  const k   = cat.colorKey
  return {
    bg:    `var(--tr-cat-${k}-bg)`,
    pill:  `var(--tr-cat-${k}-pill)`,
    badge: `var(--tr-cat-${k}-badge)`,
  }
}
