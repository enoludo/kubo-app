// ─── Modale détail commande ────────────────────────────────────────────────────
import { useState } from 'react'

const CHANNEL_LABEL = { web: 'Site web', boutique: 'Boutique', brunch: 'Brunch' }

function fmtPrice(p) {
  return p.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function fmtDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function OrderDetailModal({ order, onDelete, onClose }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (confirmDelete) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-emp-form-title">Supprimer cette commande ?</div>
          <div className="archive-modal-body">
            La commande de <strong>{order.customer.name}</strong> sera définitivement supprimée.
          </div>
          <div className="modal-actions">
            <button className="btn-secondary modal-cancel" onClick={() => setConfirmDelete(false)}>Retour</button>
            <button className="btn-danger modal-delete" onClick={() => { onDelete(order.id); onClose() }}>
              Supprimer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--order-detail" onClick={e => e.stopPropagation()}>

        {/* ── En-tête : canal + statut + fermer ── */}
        <div className="order-detail-header">
          <div className="order-detail-badges">
            <span className={`order-pill order-pill--${order.channel}`}>
              <span className="order-pill-dot" />
              <span className="order-pill-text">{CHANNEL_LABEL[order.channel]}</span>
            </span>
          </div>
          <button className="order-detail-close" onClick={onClose} aria-label="Fermer">✕</button>
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
          {order.items.map((item, i) => (
            <div key={i} className="order-detail-item">
              <span className="order-detail-item-label">
                {item.label}{item.size ? ` — ${item.size}` : ''}
              </span>
              <span className="order-detail-item-meta">× {item.qty}</span>
              <span className="order-detail-item-meta">{fmtPrice(item.unitPrice)}</span>
              <span className="order-detail-item-sub">{fmtPrice(item.qty * item.unitPrice)}</span>
            </div>
          ))}
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

      </div>
    </div>
  )
}
