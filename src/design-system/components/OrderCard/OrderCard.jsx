// ─── OrderCard — Carte commande partagée ──────────────────────────────────────
import { useState }   from 'react'
import ArchiveModal   from '../../../modules/planning/components/ArchiveModal'
import Button         from '../Button/Button'
import './OrderCard.css'

const CHANNEL_LABEL = { web: 'Site web', boutique: 'Boutique', brunch: 'Brunch' }

function fmtPrice(p) {
  return p.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function isWebflowOrder(order) {
  return order.channel === 'web' || (order.channel === 'brunch' && order.brunchSource === 'web')
}

function channelLabel(order) {
  if (order.channel === 'brunch') {
    return order.brunchSource === 'web' ? 'Brunch web' : 'Brunch boutique'
  }
  return CHANNEL_LABEL[order.channel] ?? order.channel
}

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

export default function OrderCard({ order, onEdit, onDelete, getProduct }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const canEdit   = !!onEdit   && order.paymentStatus !== 'paid' && !isWebflowOrder(order)
  const canDelete = !!onDelete && !isWebflowOrder(order)

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

      <div className="ocard">

        {/* Badges canal + paiement */}
        <div className="ocard-meta">
          <span className={`ocard-badge ocard-badge--${order.channel}`}>
            {channelLabel(order)}
          </span>
          {!isWebflowOrder(order) && (() => {
            const status = order.paymentStatus ?? (order.paid ? 'paid' : 'unpaid')
            if (status === 'partial') {
              const remaining = Math.max(0, (order.totalPrice ?? 0) - (order.paidAmount ?? 0))
              return (
                <span className="ocard-badge ocard-badge--partial">
                  Reste : {fmtPrice(remaining)}
                </span>
              )
            }
            return (
              <span className={`ocard-badge ocard-badge--${status}`}>
                {status === 'paid' ? 'Payé' : 'Non payé'}
              </span>
            )
          })()}
        </div>

        {/* Nom client + montant total */}
        <div className="ocard-row1">
          <span className="ocard-name">{order.customer?.name}</span>
          {!!order.totalPrice && (
            <span className="ocard-amount">{fmtPrice(order.totalPrice)}</span>
          )}
        </div>

        {/* Contact */}
        {(order.customer?.phone || order.customer?.email) && (
          <div className="ocard-contact-block">
            {order.customer.phone && (
              <a
                href={`tel:${order.customer.phone.replace(/\s/g, '')}`}
                className="ocard-contact-link"
                onClick={e => e.stopPropagation()}
              >
                {order.customer.phone}
              </a>
            )}
            {order.customer.email && (
              <a
                href={`mailto:${order.customer.email}`}
                className="ocard-contact-link"
                onClick={e => e.stopPropagation()}
              >
                {order.customer.email}
              </a>
            )}
          </div>
        )}

        {/* Produits */}
        {order.items?.length > 0 && (
          <div className="ocard-products">
            {order.items.map((item, i) => {
              const product  = item.productId ? getProduct?.(item.productId) : null
              const photoUrl = product?.photoUrl ?? null
              return (
                <div key={i} className="ocard-item">
                  {order.channel !== 'brunch' && (
                    <div className="ocard-item-photo">
                      {photoUrl
                        ? <img src={photoUrl} alt={item.label} />
                        : <span className="ocard-item-photo-placeholder">🍰</span>
                      }
                    </div>
                  )}
                  <div className="ocard-item-content">
                    <div className="ocard-item-top">
                      <span className="ocard-item-name">{item.label}</span>
                      <span className="ocard-item-qty">× {item.qty}</span>
                    </div>
                    {item.size && <div className="ocard-item-size">{item.size}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Heure de retrait */}
        {order.pickupTime && (
          <div className="ocard-time">Retrait à {order.pickupTime}</div>
        )}

        {/* Note */}
        {order.note && (
          <div className="ocard-note">
            <span className="ocard-note-label">Note</span>
            <span className="ocard-note-text">{order.note}</span>
          </div>
        )}

        {/* Actions */}
        {(canEdit || canDelete) && (
          <div className="ocard-actions">
            {canEdit && (
              <Button variant="default" className="ocard-btn-edit" onClick={() => onEdit(order)}>
                <PencilIcon /> Modifier
              </Button>
            )}
            {canDelete && (
              <Button variant="danger" className="ocard-btn-delete" onClick={() => setConfirmDelete(true)}>
                Supprimer
              </Button>
            )}
          </div>
        )}

      </div>
    </>
  )
}
