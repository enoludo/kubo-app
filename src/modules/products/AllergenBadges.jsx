// ─── Badges allergènes — 14 allergènes EU ────────────────────────────────────
// Deux modes : 'pills' (compact, pour les cards) et 'full' (modal, avec absents)

export const ALLERGENS_EU = [
  { id: 'gluten',          label: 'Gluten',         emoji: '🌾' },
  { id: 'crustaces',       label: 'Crustacés',      emoji: '🦐' },
  { id: 'oeufs',           label: 'Œufs',           emoji: '🥚' },
  { id: 'poisson',         label: 'Poisson',        emoji: '🐟' },
  { id: 'arachides',       label: 'Arachides',      emoji: '🥜' },
  { id: 'soja',            label: 'Soja',           emoji: '🫘' },
  { id: 'lait',            label: 'Lait',           emoji: '🥛' },
  { id: 'fruits-a-coques', label: 'Fruits à coques',emoji: '🌰' },
  { id: 'celeri',          label: 'Céleri',         emoji: '🥬' },
  { id: 'moutarde',        label: 'Moutarde',       emoji: '🟡' },
  { id: 'sesame',          label: 'Sésame',         emoji: '⚪' },
  { id: 'sulfites',        label: 'SO₂ / Sulfites', emoji: '🍷' },
  { id: 'lupin',           label: 'Lupin',          emoji: '🌼' },
  { id: 'mollusques',      label: 'Mollusques',     emoji: '🦪' },
]

// ── Mode complet (onglet Allergènes de la fiche produit) ──────────────────────
export function AllergenBadgesFull({ allergens = [] }) {
  const present = new Set(allergens)
  const hasAny  = present.size > 0

  return (
    <div className="allergen-full">
      {!hasAny && (
        <p className="allergen-full-none">Aucun allergène déclaré pour ce produit.</p>
      )}

      {hasAny && (
        <>
          <p className="allergen-full-title">Allergènes présents</p>
          <div className="allergen-full-present">
            {ALLERGENS_EU.filter(a => present.has(a.id)).map(a => (
              <span key={a.id} className="allergen-badge allergen-badge--present">
                <span className="allergen-badge-emoji">{a.emoji}</span>
                <span className="allergen-badge-label">{a.label}</span>
              </span>
            ))}
          </div>
        </>
      )}

      <p className="allergen-full-title allergen-full-title--absent">Absents / non déclarés</p>
      <div className="allergen-full-absent">
        {ALLERGENS_EU.filter(a => !present.has(a.id)).map(a => (
          <span key={a.id} className="allergen-badge allergen-badge--absent">
            <span className="allergen-badge-emoji">{a.emoji}</span>
            <span className="allergen-badge-label">{a.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Mode compact (déjà dans ProductCard) ─────────────────────────────────────
export function AllergenPillsCompact({ allergens = [] }) {
  if (!allergens.length) return null
  const labelMap = Object.fromEntries(ALLERGENS_EU.map(a => [a.id, a.label]))
  return (
    <div className="allergen-pills-compact">
      {allergens.map(id => (
        <span key={id} className="product-card-allergen">
          {labelMap[id] ?? id}
        </span>
      ))}
    </div>
  )
}
