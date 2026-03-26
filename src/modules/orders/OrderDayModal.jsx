// ─── Modal "Commandes du jour" ─────────────────────────────────────────────────
import { useState } from 'react'
import ArchiveModal from '../planning/components/ArchiveModal'
import Modal from '../../design-system/components/Modal/Modal'
import Button from '../../design-system/components/Button/Button'

const CHANNEL_LABEL = { web: 'Site web', boutique: 'Boutique', brunch: 'Brunch' }

function fmtPrice(p) {
  return p.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function fmtDayTitle(date) {
  const s = date.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ── Icônes ─────────────────────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

// ── Carte commande ─────────────────────────────────────────────────────────────

function isWebflowOrder(order) {
  return order.channel === 'web' || (order.channel === 'brunch' && order.brunchSource === 'web')
}

function OrderCard({ order, onEdit, onDelete, getProduct }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const canEdit   = !order.paid && !isWebflowOrder(order)
  const canDelete = !isWebflowOrder(order)

  return (
    <>
      {confirmDelete && (
        <ArchiveModal
          employee={{ name: order.customer.name }}
          mode="delete"
          title={`Supprimer la commande de ${order.customer.name} ?`}
          body="Cette action est irréversible."
          confirmLabel="Supprimer"
          onConfirm={() => onDelete(order.id)}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      <div className="odm-card">
      {/* 1 : Badge canal + badge paiement */}
      <div className="odm-card-meta">
        <span className={`odm-badge odm-badge--${order.channel}`}>
          {CHANNEL_LABEL[order.channel]}
        </span>
        {order.channel !== 'web' && (
          <span className={`odm-badge ${order.paid ? 'odm-badge--paid' : 'odm-badge--unpaid'}`}>
            {order.paid ? 'Payé' : 'Non payé'}
          </span>
        )}
      </div>

      {/* 2+3 : Nom client | Prix total */}
      <div className="odm-card-row1">
        <span className="odm-card-name">{order.customer.name}</span>
        {!!order.totalPrice && (
          <span className="odm-card-total-amount">{fmtPrice(order.totalPrice)}</span>
        )}
      </div>

      {/* 4 : Contact (téléphone + email) */}
      {(order.customer.phone || order.customer.email) && (
        <div className="odm-card-contact-block">
          {order.customer.phone && (
            <a
              href={`tel:${order.customer.phone.replace(/\s/g, '')}`}
              className="order-detail-contact--link odm-card-contact"
              onClick={e => e.stopPropagation()}
            >
              {order.customer.phone}
            </a>
          )}
          {order.customer.email && (
            <a
              href={`mailto:${order.customer.email}`}
              className="order-detail-contact--link odm-card-contact"
              onClick={e => e.stopPropagation()}
            >
              {order.customer.email}
            </a>
          )}
        </div>
      )}

      {/* 5 : Liste des produits */}
      <div className="odm-card-products">
        {order.items.map((item, i) => {
          const product  = item.productId ? getProduct?.(item.productId) : null
          const photoUrl = product?.photoUrl ?? null
          return (
            <div key={i} className="odm-item">
              <div className="odm-item-photo">
                {photoUrl
                  ? <img src={photoUrl} alt={item.label} />
                  : <span className="odm-item-photo-placeholder">🍰</span>
                }
              </div>
              <div className="odm-item-content">
                <div className="odm-item-top">
                  <span className="odm-item-name">{item.label}</span>
                  <span className="odm-item-qty">× {item.qty}</span>
                </div>
                {item.size && <div className="odm-item-size">{item.size}</div>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Heure de retrait */}
      <div className="odm-card-time">Retrait à {order.pickupTime}</div>

      {/* Note */}
      {order.note && (
        <div className="odm-card-note">
          <span className="odm-card-note-label">Note</span>
          <span className="odm-card-note-text">{order.note}</span>
        </div>
      )}

      {/* 6 : Actions */}
      {(canEdit || canDelete) && (
        <div className="odm-card-actions">
          {canEdit && (
            <Button variant="default" className="odm-card-edit" onClick={() => onEdit(order)}>
              <PencilIcon /> Modifier
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" className="odm-card-delete" onClick={() => setConfirmDelete(true)}>
              Supprimer
            </Button>
          )}
        </div>
      )}
      </div>
    </>
  )
}

// ── Modal principale ───────────────────────────────────────────────────────────

export default function OrderDayModal({ date, orders, onNewOrder, onNewBrunch, onEdit, onDelete, onClose, getProduct }) {
  const isSaturday = date.getDay() === 6

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d     = new Date(date); d.setHours(0, 0, 0, 0)
  const isPast = d < today

  return (
    <Modal onClose={onClose} size="lg" className="odm">

        {/* ── Header ── */}
        <div className="odm-header">
          <div className="odm-header-left">
            <h2 className="modal-emp-name">{fmtDayTitle(date)}</h2>
            {orders.length > 0 && (
              <span className="odm-count-badge">
                {orders.length} commande{orders.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="odm-header-btns">
            {!isPast && isSaturday && (
              <button className="som-btn som-btn--brunch" onClick={() => onNewBrunch(date)}>
                + Brunch
              </button>
            )}
            {!isPast && (
              <button className="som-btn" onClick={() => onNewOrder(date, null)}>
                + Nouvelle commande
              </button>
            )}
          </div>
        </div>

        {/* ── Corps scrollable ── */}
        <div className="odm-body">
          {orders.length === 0 ? (
            <p className="odm-empty">Aucune commande ce jour.</p>
          ) : (
            orders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onEdit={onEdit}
                onDelete={onDelete}
                getProduct={getProduct}
              />
            ))
          )}
        </div>

    </Modal>
  )
}
