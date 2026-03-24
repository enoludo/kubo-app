// ─── Catalogue produits — grille avec filtres ─────────────────────────────────
import { useState, useMemo } from 'react'
import ProductCard from './ProductCard'

// ── Barre de filtres ──────────────────────────────────────────────────────────

function FilterBar({ search, onSearch, category, onCategory, showInactive, onToggleInactive, categories, onAdd }) {
  return (
    <div className="products-filter-bar">

      {/* Gauche : toggle inactifs */}
      <button
        className={`products-filter-toggle${showInactive ? ' products-filter-toggle--active' : ''}`}
        onClick={onToggleInactive}
        aria-pressed={showInactive}
      >
        {showInactive ? 'Masquer inactifs' : 'Afficher inactifs'}
      </button>

      {/* Centre : recherche + catégorie */}
      <div className="products-filter-center">
        <input
          className="products-filter-search field-input"
          type="search"
          placeholder="Rechercher…"
          value={search}
          onChange={e => onSearch(e.target.value)}
          aria-label="Rechercher un produit"
        />
        <select
          className="products-filter-select field-input"
          value={category}
          onChange={e => onCategory(e.target.value)}
          aria-label="Filtrer par catégorie"
        >
          <option value="">Toutes catégories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Droite : nouveau produit */}
      <button
        className="add-trigger add-trigger--labeled"
        onClick={onAdd}
      >
        + Nouveau produit
      </button>

    </div>
  )
}

// ── Catalogue principal ────────────────────────────────────────────────────────

export default function ProductsCatalog({ products, categories, onProductClick, onAdd }) {
  const [search,       setSearch]       = useState('')
  const [category,     setCategory]     = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const filtered = useMemo(() => {
    let list = showInactive ? products : products.filter(p => p.active)
    if (category) list = list.filter(p => p.category === category)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      )
    }
    return list
  }, [products, search, category, showInactive])

  return (
    <div className="products-catalog">
      <FilterBar
        search={search}       onSearch={setSearch}
        category={category}   onCategory={setCategory}
        showInactive={showInactive} onToggleInactive={() => setShowInactive(v => !v)}
        categories={categories}
        onAdd={onAdd}
      />

      <div className="products-scroll">
        {filtered.length === 0 ? (
          <div className="products-catalog-empty">
            <span>Aucun produit trouvé.</span>
          </div>
        ) : (
          <div className="products-grid">
            {filtered.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onClick={onProductClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
