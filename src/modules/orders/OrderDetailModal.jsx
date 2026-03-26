// ─── Modale détail commande ────────────────────────────────────────────────────
import { useState } from 'react'
import Modal from '../../design-system/components/Modal/Modal'
import Button from '../../design-system/components/Button/Button'

const CHANNEL_LABEL = { web: 'Site web', boutique: 'Boutique', brunch: 'Brunch' }

function fmtPrice(p) {
  return p.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function fmtDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

const ALLERGEN_EMOJI = {
  gluten: '🌾', crustaces: '🦐', oeufs: '🥚', poisson: '🐟', arachides: '🥜',
  soja: '🫘', lait: '🥛', fruits_coque: '🌰', celeri: '🌿', moutarde: '🟡',
  sesame: '🌻', sulfites: '🍷', lupin: '🌼', mollusques: '🦑',
}

export default function OrderDetailModal({ order, getProduct, onDelete, onClose }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (confirmDelete) {
    return (
      <Modal onClose={onClose}>
        <div className="modal-emp-form-title">Supprimer cette commande ?</div>
        <div className="archive-modal-body">
          La commande de <strong>{order.customer.name}</strong> sera définitivement supprimée.
        </div>
        <div className="modal-actions">
          <Button variant="default" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>Retour</Button>
          <Button variant="danger" style={{ flex: 2 }} onClick={() => { onDelete(order.id); onClose() }}>
            Supprimer
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose} className="modal--order-detail">

        {/* ── En-tête : canal + statut + fermer ── */}
        <div className="order-detail-header">
          <div className="order-detail-badges">
            <span className={`order-pill order-pill--${order.channel}`}>
              <span className="order-pill-dot" />
              <span className="order-pill-text">{CHANNEL_LABEL[order.channel]}</span>
            </span>
          </div>
        </div>

        {/* ── Client ── */}
        <div className="order-detail-customer">
          <div className="order-detail-name">{order.customer.name}</div>
          {order.customer.phone && (
            <a className="order-detail-contact order-detail-contact--link" href={`tel:${order.customer.phone.replace(/\s/g, '')}`}>
              {order.customer.phone}
            </a>
          )}
          {order.customer.email && (
            <a className="order-detail-contact order-detail-contact--link" href={`mailto:${order.customer.email}`}>
              {order.customer.email}
            </a>
          )}
        </div>

        {/* ── Retrait ── */}
        <div className="order-detail-pickup">
          <div className="order-detail-pickup-date">{fmtDate(order.pickupDate)}</div>
          <div className="order-detail-pickup-time">Retrait à {order.pickupTime}</div>
        </div>

        <div className="sep" style={{ margin: 'var(--gap) 0' }} />

        {/* ── Articles ── */}
        <div className="order-detail-items">
          <div className="order-detail-items-header">
            <span>Produit</span>
            <span>Qté</span>
            <span>P.U.</span>
            <span>Total</span>
          </div>
          {order.items.map((item, i) => {
            const product = item.productId && getProduct ? getProduct(item.productId) : null
            const allergens = product?.allergens ?? []
            const dlc = product?.dlcDays != null ? `DLC : ${product.dlcDays}j` : null
            return (
              <div key={i} className="order-detail-item order-detail-item--with-product">
                <span className="order-detail-item-label">
                  {item.label}{item.size ? ` — ${item.size}` : ''}
                </span>
                <span className="order-detail-item-meta">× {item.qty}</span>
                <span className="order-detail-item-meta">{fmtPrice(item.unitPrice)}</span>
                <span className="order-detail-item-sub">{fmtPrice(item.qty * item.unitPrice)}</span>
                {(allergens.length > 0 || dlc) && (
                  <div className="order-detail-item-product">
                    {allergens.length > 0 && (
                      <span className="order-detail-allergens">
                        {allergens.map(a => (
                          <span key={a} className="order-detail-allergen-pill" title={a}>
                            {ALLERGEN_EMOJI[a] ?? '⚠️'} {a}
                          </span>
                        ))}
                      </span>
                    )}
                    {dlc && <span className="order-detail-dlc">{dlc}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="sep" style={{ margin: 'var(--gap) 0' }} />

        {/* ── Total ── */}
        <div className="order-detail-total">
          <span>Total</span>
          <span>{fmtPrice(order.totalPrice)}</span>
        </div>

        {/* ── Note ── */}
        {order.note && (
          <div className="order-detail-note">
            <span className="order-detail-note-label">Note</span>
            <span className="order-detail-note-text">{order.note}</span>
          </div>
        )}

        {/* ── Suppression ── */}
        <div className="modal-destructive-actions">
          <button
            className="modal-destructive-btn modal-destructive-btn--delete"
            onClick={() => setConfirmDelete(true)}
          >
            Supprimer la commande
          </button>
        </div>

    </Modal>
  )
}
