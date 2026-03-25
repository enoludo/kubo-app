// ─── Mini-modal de choix — samedi vide ────────────────────────────────────────
import Modal from '../../design-system/components/Modal/Modal'

export default function SaturdayChoiceModal({ date, onNewOrder, onNewBrunch, onClose }) {
  const s = date.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const title = s.charAt(0).toUpperCase() + s.slice(1)

  return (
    <Modal onClose={onClose}>
      <div className="modal-emp-form-title">Que souhaitez-vous créer ?</div>
      <div className="modal-date">{title}</div>

      <div className="som-choices">
        <button className="som-btn" onClick={onNewOrder}>
          + Nouvelle commande
        </button>
        <button className="som-btn som-btn--brunch" onClick={onNewBrunch}>
          + Nouveau brunch
        </button>
      </div>
    </Modal>
  )
}
