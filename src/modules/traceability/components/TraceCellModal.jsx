// ─── Modal — réceptions d'un fournisseur pour un jour ─────────────────────────
import Modal  from '../../../design-system/components/Modal/Modal'
import Button from '../../../design-system/components/Button/Button'
import { getCategoryById, getCategoryTokens } from '../../../data/categories'

const STATUS_META = {
  compliant:     { label: 'Conforme',     color: 'var(--tr-status-compliant-text)',     bg: 'var(--tr-status-compliant-bg)'     },
  non_compliant: { label: 'Non conforme', color: 'var(--tr-status-non-compliant-text)', bg: 'var(--tr-status-non-compliant-bg)' },
  pending:       { label: 'En attente',   color: 'var(--tr-status-pending-text)',       bg: 'var(--tr-status-pending-bg)'       },
}

function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function fmtDateShort(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function TraceCellModal({ supplier, dateStr, receptions, onAddReception, onEditReception, onClose }) {
  const tokens   = getCategoryTokens(supplier.category)
  const catLabel = getCategoryById(supplier.category)?.label ?? supplier.category

  const initials = supplier.name
    .split(' ')
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')

  return (
    <Modal onClose={onClose} size="sm" scrollBody>

      {/* ── Header ── */}
      <div className="tr-modal-header">
        <div className="tr-zone-profile">
          <div className="tr-zone-avatar" style={{ backgroundColor: tokens.badge }}>
            {initials}
          </div>
          <div className="tr-zone-identity">
            <span className="tr-zone-title">{supplier.name}</span>
            <span className="tr-zone-subtitle">{catLabel}</span>
          </div>
        </div>
        <div className="tr-modal-date">{fmtDate(dateStr)}</div>
      </div>

      {/* ── Liste réceptions ── */}
      {receptions.length === 0 ? (
        <p className="tr-modal-empty">Aucune réception saisie pour ce jour.</p>
      ) : (
        <div className="tr-rec-list">
          {receptions.map(rec => {
            const meta         = STATUS_META[rec.conformity] ?? STATUS_META.pending
            const productCount = rec.products?.length ?? 0
            return (
              <div key={rec.id} className="tr-rec-row">
                <div className="tr-rec-status-col">
                  <span
                    className="tr-rec-status-pill"
                    style={{ backgroundColor: meta.bg, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                </div>
                <div className="tr-rec-info">
                  <span className="tr-rec-product-count">
                    {productCount === 0 ? 'Aucun produit' : `${productCount} produit${productCount > 1 ? 's' : ''}`}
                  </span>
                  {rec.notes && (
                    <span className="tr-rec-note">{rec.notes}</span>
                  )}
                </div>
                <button
                  className="tr-rec-edit-btn"
                  onClick={() => onEditReception(rec)}
                  aria-label="Modifier cette réception"
                >
                  Modifier
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="modal-actions">
        <Button variant="default" onClick={onAddReception}>
          + Réception
        </Button>
        <Button variant="default" onClick={onClose}>
          Fermer
        </Button>
      </div>

    </Modal>
  )
}
