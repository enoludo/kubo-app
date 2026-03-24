// ─── Fiche produit — modal plein écran avec onglets ──────────────────────────
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AllergenBadgesFull } from './AllergenBadges'
import RecipeStepList from './RecipeStepList'
import SizeTable from './SizeTable'

const TABS = [
  { id: 'infos',      label: 'Infos'       },
  { id: 'recette',    label: 'Recette'     },
  { id: 'production', label: 'Production'  },
  { id: 'allergenes', label: 'Allergènes'  },
  { id: 'cout',       label: 'Coût'        },
]

function formatDuration(min) {
  if (!min) return '—'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h} h ${m} min` : `${h} h`
}

// ── Onglet Infos ──────────────────────────────────────────────────────────────
function TabInfos({ product }) {
  return (
    <div className="product-detail-tab-content">
      <SizeTable sizes={product.sizes} showCost={false} />

      <div className="sep" style={{ margin: '20px 0' }} />

      {product.description && (
        <div className="product-detail-section">
          <p className="product-detail-section-label field-label">Description</p>
          <p className="product-detail-text">{product.description}</p>
        </div>
      )}

      {product.internalNotes && (
        <div className="product-detail-section">
          <p className="product-detail-section-label field-label">Notes internes</p>
          <p className="product-detail-text product-detail-text--note">{product.internalNotes}</p>
        </div>
      )}
    </div>
  )
}

// ── Onglet Recette ────────────────────────────────────────────────────────────
function TabRecette({ product }) {
  return (
    <div className="product-detail-tab-content">
      {product.ingredients?.length > 0 && (
        <div className="product-detail-section">
          <p className="product-detail-section-label field-label">Ingrédients</p>
          <ul className="product-ingredient-list">
            {product.ingredients.map(ing => (
              <li key={ing.id} className="product-ingredient-item">
                <span className="product-ingredient-name">{ing.name}</span>
                <span className="product-ingredient-qty">{ing.quantity} {ing.unit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="sep" style={{ margin: '20px 0' }} />

      <div className="product-detail-section">
        <p className="product-detail-section-label field-label">Étapes</p>
        <RecipeStepList steps={product.recipeSteps} />
      </div>
    </div>
  )
}

// ── Onglet Production ─────────────────────────────────────────────────────────
function TabProduction({ product }) {
  const advanceLabel = {
    0: 'Jour J',
    1: 'Veille (J-1)',
    2: '2 jours avant (J-2)',
    3: '3 jours avant (J-3)',
  }

  return (
    <div className="product-detail-tab-content">
      <div className="product-detail-section">
        <p className="product-detail-section-label field-label">Temps de fabrication</p>
        <div className="product-detail-info-grid">
          <div className="product-detail-info-item">
            <span className="product-detail-info-key">Temps total</span>
            <span className="product-detail-info-val product-detail-info-val--highlight">
              {formatDuration(product.totalProductionTimeMin)}
            </span>
          </div>
          <div className="product-detail-info-item">
            <span className="product-detail-info-key">Temps de repos</span>
            <span className="product-detail-info-val">{formatDuration(product.restTimeMin)}</span>
          </div>
          <div className="product-detail-info-item">
            <span className="product-detail-info-key">Préparation anticipée</span>
            <span className="product-detail-info-val">
              {product.advancePrepDays != null
                ? advanceLabel[product.advancePrepDays] ?? `J-${product.advancePrepDays}`
                : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="sep" style={{ margin: '20px 0' }} />

      <div className="product-detail-section">
        <p className="product-detail-section-label field-label">Conservation</p>
        <div className="product-detail-info-grid">
          <div className="product-detail-info-item">
            <span className="product-detail-info-key">Conditions de stockage</span>
            <span className="product-detail-info-val">{product.storageConditions ?? '—'}</span>
          </div>
          <div className="product-detail-info-item">
            <span className="product-detail-info-key">DLC après fabrication</span>
            <span className="product-detail-info-val product-detail-info-val--highlight">
              {product.shelfLifeHours != null
                ? product.shelfLifeHours < 24
                  ? `${product.shelfLifeHours} h`
                  : `${Math.round(product.shelfLifeHours / 24)} jour${product.shelfLifeHours >= 48 ? 's' : ''}`
                : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Onglet Allergènes ─────────────────────────────────────────────────────────
const PREGNANCY_CONFIG = {
  yes:   { icon: '✅', label: 'Compatible sans restriction connue',  className: 'product-detail-pregnancy--yes'   },
  check: { icon: '⚠️', label: 'À vérifier selon la préparation',    className: 'product-detail-pregnancy--check' },
  no:    { icon: '❌', label: 'Déconseillé pendant la grossesse',    className: 'product-detail-pregnancy--no'   },
}

function TabAllergenes({ product }) {
  const preg = PREGNANCY_CONFIG[product.pregnancySafe] ?? PREGNANCY_CONFIG.check

  return (
    <div className="product-detail-tab-content">
      <AllergenBadgesFull allergens={product.allergens} />

      <div className="sep" style={{ margin: '20px 0' }} />

      <div className="product-detail-section">
        <p className="product-detail-section-label field-label">Femmes enceintes</p>
        <div className={`product-detail-pregnancy ${preg.className}`}>
          <span className="product-detail-pregnancy-icon">{preg.icon}</span>
          <div className="product-detail-pregnancy-body">
            <span className="product-detail-pregnancy-label">{preg.label}</span>
            {product.pregnancyNote && (
              <span className="product-detail-pregnancy-note">{product.pregnancyNote}</span>
            )}
          </div>
        </div>
      </div>

      {product.sanitaryNotes && (
        <>
          <div className="sep" style={{ margin: '20px 0' }} />
          <div className="product-detail-section">
            <p className="product-detail-section-label field-label">Notes sanitaires</p>
            <p className="product-detail-text product-detail-text--note">{product.sanitaryNotes}</p>
          </div>
        </>
      )}
    </div>
  )
}

// ── Onglet Coût ───────────────────────────────────────────────────────────────
function TabCout({ product }) {
  return (
    <div className="product-detail-tab-content">
      <SizeTable sizes={product.sizes} showCost={true} />

      <div className="product-detail-cost-note">
        La marge est calculée automatiquement : (prix − coût) ÷ prix × 100
      </div>
    </div>
  )
}

// ── Modal principale ──────────────────────────────────────────────────────────
export default function ProductDetailModal({ product, onClose, onEdit, onDelete }) {
  const [activeTab,  setActiveTab]  = useState('infos')
  const [confirmDel, setConfirmDel] = useState(false)

  const canDelete = !product?.webflowProductId

  if (!product) return null

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

  const modal = (
    <div className="modal-overlay product-detail-overlay" onClick={onClose}>
      <div
        className="product-detail-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
      >
        {/* En-tête */}
        <div className="product-detail-header">
          <div className="product-detail-header-photo">
            {product.photoUrl
              ? <img src={product.photoUrl} alt={product.name} />
              : <span className="product-detail-header-placeholder">🥐</span>
            }
          </div>
          <div className="product-detail-header-info">
            <span className="product-detail-header-category">{product.category}</span>
            <h2 className="product-detail-header-name">{product.name}</h2>
            {priceRange && (
              <span className="product-detail-header-price">{priceRange}</span>
            )}
            <div className="product-detail-header-tags">
              {!product.active && (
                <span className="product-detail-header-tag product-detail-header-tag--inactive">Inactif</span>
              )}
            </div>
          </div>
          <div className="product-detail-header-actions">
            {onEdit && (
              <button className="btn-secondary product-detail-edit-btn" onClick={() => onEdit(product)}>
                Modifier
              </button>
            )}
            <button className="product-detail-close" onClick={onClose} aria-label="Fermer">
              ✕
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="product-detail-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`product-detail-tab${activeTab === tab.id ? ' product-detail-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="product-detail-body">
          {activeTab === 'infos'      && <TabInfos       product={product} />}
          {activeTab === 'recette'    && <TabRecette     product={product} />}
          {activeTab === 'production' && <TabProduction  product={product} />}
          {activeTab === 'allergenes' && <TabAllergenes  product={product} />}
          {activeTab === 'cout'       && <TabCout        product={product} />}
        </div>

        {/* Footer suppression */}
        {canDelete && onDelete && (
          <div className="product-detail-footer">
            {!confirmDel ? (
              <button
                className="btn-danger product-detail-delete-btn"
                onClick={() => setConfirmDel(true)}
              >
                Supprimer
              </button>
            ) : (
              <div className="product-detail-confirm-del">
                <span className="product-detail-confirm-msg">
                  Supprimer <strong>{product.name}</strong> ? Cette action est irréversible.
                </span>
                <div className="product-detail-confirm-actions">
                  <button className="btn-secondary" onClick={() => setConfirmDel(false)}>
                    Annuler
                  </button>
                  <button className="btn-danger" onClick={() => onDelete(product.id)}>
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
