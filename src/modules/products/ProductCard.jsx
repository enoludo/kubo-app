// ─── Card produit — grille catalogue ──────────────────────────────────────────

const ALLERGEN_LABEL = {
  'gluten':          'Gluten',
  'lait':            'Lait',
  'oeufs':           'Œufs',
  'fruits-a-coques': 'Fruits à coques',
  'arachides':       'Arachides',
  'soja':            'Soja',
  'poisson':         'Poisson',
  'crustaces':       'Crustacés',
  'celeri':          'Céleri',
  'moutarde':        'Moutarde',
  'sesame':          'Sésame',
  'sulfites':        'SO₂/Sulfites',
  'lupin':           'Lupin',
  'mollusques':      'Mollusques',
}

function AllergenPills({ allergens }) {
  if (!allergens?.length) return null
  return (
    <div className="product-card-allergens">
      {allergens.map(a => (
        <span key={a} className="product-card-allergen">
          {ALLERGEN_LABEL[a] ?? a}
        </span>
      ))}
    </div>
  )
}

export default function ProductCard({ product, onClick }) {
  const minPrice = product.sizes?.length
    ? Math.min(...product.sizes.map(s => s.price))
    : null
  const maxPrice = product.sizes?.length
    ? Math.max(...product.sizes.map(s => s.price))
    : null
  const priceRange = minPrice != null
    ? minPrice === maxPrice
      ? `${minPrice.toFixed(2).replace('.', ',')} €`
      : `${minPrice.toFixed(2).replace('.', ',')} – ${maxPrice.toFixed(2).replace('.', ',')} €`
    : null

  return (
    <button
      className={`product-card${!product.active ? ' product-card--inactive' : ''}`}
      onClick={() => onClick(product)}
      aria-label={`Voir le produit ${product.name}`}
    >
      {/* Photo ou placeholder */}
      <div className="product-card-photo">
        {product.photoUrl
          ? <img src={product.photoUrl} alt={product.name} loading="lazy" />
          : <span className="product-card-photo-placeholder">🥐</span>
        }
        {!product.active && (
          <span className="product-card-inactive-badge">Inactif</span>
        )}
        {product.webflowProductId && (
          <span className="product-card-webflow-badge" title="Synchronisé depuis Webflow">W</span>
        )}
      </div>

      {/* Corps */}
      <div className="product-card-body">
        <span className="product-card-category">{product.category}</span>
        <span className="product-card-name">{product.name}</span>

        {product.description && (
          <span className="product-card-desc">{product.description}</span>
        )}

        <AllergenPills allergens={product.allergens} />

        {product.pregnancySafe === 'no' && (
          <span className="product-card-pregnancy product-card-pregnancy--no"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="10.365" viewBox="0 0 12 10.365">
  <g id="Groupe_145" data-name="Groupe 145" transform="translate(0.074 -0.535)" fill="currentcolor">
    <path id="Tracé_100" data-name="Tracé 100" d="M5.926.535a4.953,4.953,0,0,1,3.1,1.124,4.356,4.356,0,0,1,1.56,2.67A1.721,1.721,0,0,1,10.515,7.7a4.892,4.892,0,0,1-7.5,2.237A4.853,4.853,0,0,1,1.336,7.7,1.721,1.721,0,0,1,1.27,4.328a4.356,4.356,0,0,1,1.56-2.67A4.953,4.953,0,0,1,5.926.535Zm0,9.527A4.032,4.032,0,0,0,9.8,7.188a.419.419,0,0,1,.4-.3.884.884,0,0,0,0-1.767.419.419,0,0,1-.417-.386A3.5,3.5,0,0,0,8.489,2.3a4.1,4.1,0,0,0-2.563-.933A4.1,4.1,0,0,0,3.363,2.3a3.5,3.5,0,0,0-1.3,2.434.419.419,0,0,1-.417.386.884.884,0,1,0,0,1.767.419.419,0,0,1,.4.3A4.032,4.032,0,0,0,5.926,10.062Z" transform="translate(0 0)"/>
    <path id="Tracé_101" data-name="Tracé 101" d="M4.954,3.609A1.536,1.536,0,0,1,3.506,2.584.419.419,0,0,1,4.3,2.3a.7.7,0,1,0,.659-.933.419.419,0,1,1,0-.837,1.537,1.537,0,0,1,0,3.074Z" transform="translate(0.971 0)"/>
    <path id="Tracé_102" data-name="Tracé 102" d="M4.942,7.48a1.905,1.905,0,0,1-1.273-.487.419.419,0,1,1,.558-.624,1.071,1.071,0,0,0,1.43,0,.419.419,0,0,1,.558.624A1.905,1.905,0,0,1,4.942,7.48Z" transform="translate(0.984 1.564)"/>
    <path id="Tracé_103" data-name="Tracé 103" d="M6.353,5.5A1.165,1.165,0,0,1,5.188,4.338a.419.419,0,0,1,.837,0,.327.327,0,1,0,.654,0,.419.419,0,1,1,.837,0A1.164,1.164,0,0,1,6.353,5.5Z" transform="translate(1.437 0.924)"/>
    <path id="Tracé_104" data-name="Tracé 104" d="M3.424,5.5A1.165,1.165,0,0,1,2.26,4.338a.419.419,0,1,1,.837,0,.327.327,0,1,0,.654,0,.419.419,0,1,1,.837,0A1.165,1.165,0,0,1,3.424,5.5Z" transform="translate(0.637 0.924)"/>
  </g>
</svg> Déconseillé enceintes</span>
        )}
        {product.pregnancySafe === 'check' && (
          <span className="product-card-pregnancy product-card-pregnancy--check"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="10.365" viewBox="0 0 12 10.365">
  <g id="Groupe_145" data-name="Groupe 145" transform="translate(0.074 -0.535)" fill="currentcolor">
    <path id="Tracé_100" data-name="Tracé 100" d="M5.926.535a4.953,4.953,0,0,1,3.1,1.124,4.356,4.356,0,0,1,1.56,2.67A1.721,1.721,0,0,1,10.515,7.7a4.892,4.892,0,0,1-7.5,2.237A4.853,4.853,0,0,1,1.336,7.7,1.721,1.721,0,0,1,1.27,4.328a4.356,4.356,0,0,1,1.56-2.67A4.953,4.953,0,0,1,5.926.535Zm0,9.527A4.032,4.032,0,0,0,9.8,7.188a.419.419,0,0,1,.4-.3.884.884,0,0,0,0-1.767.419.419,0,0,1-.417-.386A3.5,3.5,0,0,0,8.489,2.3a4.1,4.1,0,0,0-2.563-.933A4.1,4.1,0,0,0,3.363,2.3a3.5,3.5,0,0,0-1.3,2.434.419.419,0,0,1-.417.386.884.884,0,1,0,0,1.767.419.419,0,0,1,.4.3A4.032,4.032,0,0,0,5.926,10.062Z" transform="translate(0 0)"/>
    <path id="Tracé_101" data-name="Tracé 101" d="M4.954,3.609A1.536,1.536,0,0,1,3.506,2.584.419.419,0,0,1,4.3,2.3a.7.7,0,1,0,.659-.933.419.419,0,1,1,0-.837,1.537,1.537,0,0,1,0,3.074Z" transform="translate(0.971 0)"/>
    <path id="Tracé_102" data-name="Tracé 102" d="M4.942,7.48a1.905,1.905,0,0,1-1.273-.487.419.419,0,1,1,.558-.624,1.071,1.071,0,0,0,1.43,0,.419.419,0,0,1,.558.624A1.905,1.905,0,0,1,4.942,7.48Z" transform="translate(0.984 1.564)"/>
    <path id="Tracé_103" data-name="Tracé 103" d="M6.353,5.5A1.165,1.165,0,0,1,5.188,4.338a.419.419,0,0,1,.837,0,.327.327,0,1,0,.654,0,.419.419,0,1,1,.837,0A1.164,1.164,0,0,1,6.353,5.5Z" transform="translate(1.437 0.924)"/>
    <path id="Tracé_104" data-name="Tracé 104" d="M3.424,5.5A1.165,1.165,0,0,1,2.26,4.338a.419.419,0,1,1,.837,0,.327.327,0,1,0,.654,0,.419.419,0,1,1,.837,0A1.165,1.165,0,0,1,3.424,5.5Z" transform="translate(0.637 0.924)"/>
  </g>
</svg>

 À vérifier</span>
        )}

        {priceRange && (
          <div className="product-card-footer">
            <span className="product-card-price">{priceRange}</span>
          </div>
        )}
      </div>
    </button>
  )
}
