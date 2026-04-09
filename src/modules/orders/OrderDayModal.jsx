// ─── Modal "Commandes du jour" ─────────────────────────────────────────────────
import Modal     from '../../design-system/components/Modal/Modal'
import OrderCard from '../../design-system/components/OrderCard/OrderCard'

function fmtDayTitle(date) {
  const s = date.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
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
