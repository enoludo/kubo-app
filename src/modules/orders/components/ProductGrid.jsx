// ─── Grille de sélection produit ──────────────────────────────────────────────
import { useState } from 'react'

function getInitials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

function fmtPrice(price) {
  if (price == null) return ''
  return price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

// ── Card produit ──────────────────────────────────────────────────────────────

function ProductCard({ product, onAdd }) {
  const [expanded, setExpanded] = useState(false)
  const [added,    setAdded]    = useState(false)

  const sizes = (product.sizes ?? [])
    .slice()
    .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))

  const basePrice = sizes[0]?.price ?? null

  function flashAdded() {
    setAdded(true)
    setTimeout(() => setAdded(false), 600)
  }

  function handleTap() {
    if (sizes.length <= 1) {
      const item = onAdd(product, sizes[0] ?? null)
      console.log('[panier] produit ajouté:', item)
      flashAdded()
    } else {
      setExpanded(v => !v)
    }
  }

  function handleSizeTap(e, size) {
    e.stopPropagation()
    const item = onAdd(product, size)
    console.log('[panier] produit ajouté:', item)
    setExpanded(false)
    flashAdded()
  }

  const cardClass = [
    'nom-product-card',
    expanded ? 'nom-product-card--expanded' : '',
    added    ? 'nom-product-card--added'    : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={cardClass} onClick={handleTap} role="button" tabIndex={0}>

      {/* Photo ou initiales */}
      <div className="nom-card-visual">
        {product.photoUrl ? (
          <img src={product.photoUrl} alt={product.name} className="nom-card-img" />
        ) : (
          <div className="nom-card-initials">{getInitials(product.name)}</div>
        )}
      </div>

      {/* Nom + prix */}
      <div className="nom-card-info">
        <span className="nom-card-name">{product.name}</span>
        {basePrice != null && (
          <span className="nom-card-price">
            {sizes.length > 1 ? `dès ${fmtPrice(basePrice)}` : fmtPrice(basePrice)}
          </span>
        )}
      </div>

      {/* Tailles — animées par grid-row */}
      {sizes.length > 1 && (
        <div
          className={`nom-size-list-wrap${expanded ? ' nom-size-list-wrap--open' : ''}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="nom-size-list-inner">
            <div className="nom-size-list">
              {sizes.map(size => (
                <button
                  key={size.id ?? size.label}
                  type="button"
                  className="nom-size-btn"
                  onClick={e => handleSizeTap(e, size)}
                  tabIndex={expanded ? 0 : -1}
                >
                  <span className="nom-size-label">{size.label}</span>
                  {size.price != null && (
                    <span className="nom-size-price">{fmtPrice(size.price)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Mini-formulaire saisie manuelle ───────────────────────────────────────────

function FreeInputForm({ onAdd, onClose }) {
  const [label,     setLabel]     = useState('')
  const [size,      setSize]      = useState('')
  const [unitPrice, setUnitPrice] = useState('')

  function handleAdd() {
    if (!label.trim()) return
    const item = onAdd(
      { id: null, name: label.trim(), sizes: [], photoUrl: null },
      { label: size.trim() || null, price: unitPrice !== '' ? parseFloat(String(unitPrice).replace(',', '.')) : null }
    )
    console.log('[panier] produit ajouté:', item)
    setLabel('')
    setSize('')
    setUnitPrice('')
    onClose()
  }

  return (
    <div className="nom-free-form">
      <input
        type="text"
        className="nom-free-field"
        placeholder="Nom du produit"
        value={label}
        onChange={e => setLabel(e.target.value)}
        autoFocus
      />
      <input
        type="text"
        className="nom-free-field"
        placeholder="Taille (optionnel)"
        value={size}
        onChange={e => setSize(e.target.value)}
      />
      <div className="nom-free-price-row">
        <input
          type="number"
          className="nom-free-field nom-free-field--price"
          placeholder="0,00"
          min="0"
          step="0.01"
          value={unitPrice}
          onChange={e => setUnitPrice(e.target.value)}
        />
        <span className="nom-free-euro">€</span>
      </div>
      <div className="nom-free-actions">
        <button type="button" className="nom-free-cancel" onClick={onClose}>
          Annuler
        </button>
        <button
          type="button"
          className="nom-free-add"
          onClick={handleAdd}
          disabled={!label.trim()}
        >
          Ajouter
        </button>
      </div>
    </div>
  )
}

// ── Grille principale ─────────────────────────────────────────────────────────

export default function ProductGrid({ products, onAdd }) {
  const [freeOpen, setFreeOpen] = useState(false)

  return (
    <div className="nom-grid-col">

      {freeOpen ? (
        <FreeInputForm onAdd={onAdd} onClose={() => setFreeOpen(false)} />
      ) : (
        <button
          type="button"
          className="add-trigger add-trigger--labeled nom-manual-btn"
          onClick={() => setFreeOpen(true)}
        >
          + Saisie manuelle
        </button>
      )}

      <div className="nom-product-grid">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAdd={onAdd}
          />
        ))}
      </div>

    </div>
  )
}
