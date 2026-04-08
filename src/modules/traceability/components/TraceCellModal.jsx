// ─── Modal — produits livrés d'un fournisseur pour un jour ────────────────────
import Modal  from '../../../design-system/components/Modal/Modal'
import Button from '../../../design-system/components/Button/Button'
import { getSupplierColors } from '../utils/traceabilityColors'

const STATUS_META = {
  compliant:     { label: 'Conforme',     color: 'var(--tr-status-compliant-text)',     bg: 'var(--tr-status-compliant-bg)'     },
  non_compliant: { label: 'Non conforme', color: 'var(--tr-status-non-compliant-text)', bg: 'var(--tr-status-non-compliant-bg)' },
}

function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function fmtDlc(dlc) {
  if (!dlc) return null
  const [y, m, d] = dlc.split('-')
  return `${d}/${m}/${y}`
}

export default function TraceCellModal({ supplier, dateStr, deliveries, onAddDelivery, onEditDelivery, onClose }) {
  const colors   = getSupplierColors(supplier)
  const initials = supplier.name
    .split(' ')
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')

  return (
    <Modal onClose={onClose} scrollBody>

      {/* ── Header ── */}
      <div className="tr-modal-header">
        <div className="tr-zone-profile">
          <div className="tr-zone-avatar" style={{ backgroundColor: colors.badgeColor }}>
            {initials}
          </div>
          <div className="tr-zone-identity">
            <span className="tr-zone-title">{supplier.name}</span>
            {supplier.contact && (
              <span className="tr-zone-subtitle">{supplier.contact}</span>
            )}
          </div>
        </div>
        <button
          className="add-trigger add-trigger--labeled tr-modal-add-rec-btn"
          onClick={onAddDelivery}
        >
          + Produit livré
        </button>
      </div>

      <div className="tr-modal-date">{fmtDate(dateStr)}</div>

      {/* ── Liste produits ── */}
      {deliveries.length === 0 ? (
        <p className="tr-modal-empty">Aucun produit livré ce jour.</p>
      ) : (
        <div className="tr-rec-list">
          {deliveries.map(d => {
            const meta = STATUS_META[d.conformity] ?? STATUS_META.compliant
            return (
              <div key={d.id} className="tr-rec-row" style={{ backgroundColor: colors.bgColor }}>
                <div className="tr-rec-status-col">
                  <span className="tr-rec-status-pill"
                    style={{ backgroundColor: meta.bg, color: meta.color }}>
                    {meta.label}
                  </span>
                </div>
                <div className="tr-rec-info">
                  <span className="tr-rec-product-count">{d.productName}</span>
                  <span className="tr-rec-meta">
                    {[d.weight, d.dlc ? `DLC ${fmtDlc(d.dlc)}` : null].filter(Boolean).join(' · ')}
                  </span>
                  {d.nonConformityNote && (
                    <span className="tr-rec-note">{d.nonConformityNote}</span>
                  )}
                </div>
                <button
                  className="tr-rec-edit-btn"
                  onClick={() => onEditDelivery(d)}
                  aria-label="Modifier ce produit livré"
                >
                  Modifier
                </button>
              </div>
            )
          })}
        </div>
      )}


    </Modal>
  )
}
