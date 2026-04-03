import { useState } from 'react'
import Modal from '../../../design-system/components/Modal/Modal'
import Button from '../../../design-system/components/Button/Button'

export function makeInitials(name) {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2) || '?'
}

export default function EmployeeModal({ employee, onSave, onCancel, onArchive, onDelete }) {
  const isEdit = !!employee

  const [name,               setName]               = useState(employee?.name     ?? '')
  const [role,               setRole]               = useState(employee?.role     ?? '')
  const [email,              setEmail]              = useState(employee?.email    ?? '')
  const [contract,           setContract]           = useState(employee?.contract ?? 35)
  const [balanceSign,        setBalanceSign]        = useState((employee?.startBalance ?? 0) >= 0 ? '+' : '-')
  const [balanceHours,       setBalanceHours]       = useState(Math.abs(employee?.startBalance ?? 0))
  const [confirmMode,        setConfirmMode]        = useState(null) // null | 'archive' | 'delete'

  const initials = makeInitials(name)

  function handleSave() {
    if (!name.trim()) return
    const startBalance = balanceSign === '+' ? balanceHours : -balanceHours
    onSave({
      name:         name.trim(),
      role:         role.trim(),
      email:        email.trim(),
      contract:     Math.max(1, Math.min(60, contract || 35)),
      initials,
      startBalance,
    })
  }

  // ── Confirmation: archive ────────────────────────────────────────────────
  if (confirmMode === 'archive') {
    const firstName = employee.name.split(' ')[0]
    return (
      <Modal onClose={onCancel}>
        <div className="modal-emp-form-title">Archiver {firstName} ?</div>
        <div className="archive-modal-body">Il n'apparaîtra plus dans le planning actif.</div>
        <div className="modal-actions">
          <Button variant="default" style={{ flex: 1 }} onClick={() => setConfirmMode(null)}>Retour</Button>
          <Button variant="danger" style={{ flex: 2 }} onClick={onArchive}>Archiver</Button>
        </div>
      </Modal>
    )
  }

  // ── Confirmation: delete ─────────────────────────────────────────────────
  if (confirmMode === 'delete') {
    const firstName = employee.name.split(' ')[0]
    return (
      <Modal onClose={onCancel}>
        <div className="modal-emp-form-title">Supprimer définitivement {firstName} ?</div>
        <div className="archive-modal-body">
          Tous ses shifts seront également supprimés. Cette action est irréversible.
        </div>
        <div className="modal-actions">
          <Button variant="default" style={{ flex: 1 }} onClick={() => setConfirmMode(null)}>Retour</Button>
          <Button variant="danger" style={{ flex: 2 }} onClick={onDelete}>Supprimer définitivement</Button>
        </div>
      </Modal>
    )
  }

  // ── Main form ────────────────────────────────────────────────────────────
  return (
    <Modal onClose={onCancel}>
        <div className="modal-emp-form-title">
          {isEdit ? 'Modifier le profil' : 'Nouvel employé'}
        </div>

        <div className="modal-form-fields">
          <div className="modal-field-full">
            <label>Prénom et nom</label>
            <input
              type="text"
              placeholder="ex : Marie Leblanc"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="modal-field-full">
            <label>Poste / rôle</label>
            <input
              type="text"
              placeholder="ex : Chef Pâtissière"
              value={role}
              onChange={e => setRole(e.target.value)}
            />
          </div>
          <div className="modal-field-full">
            <label>Email</label>
            <input
              type="email"
              placeholder="ex : marie@kubo-patisserie.fr"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="modal-field-full">
            <label>Heures contractuelles / semaine</label>
            <div className="modal-field-with-suffix">
              <input
                type="number"
                min="1"
                max="60"
                value={contract}
                onChange={e => setContract(Number(e.target.value))}
              />
              <span className="modal-field-suffix">h</span>
            </div>
          </div>
          <div className="modal-field-full">
            <label>{isEdit ? 'Ajustement du solde cumulé' : 'Solde de départ'}</label>
            <div className="modal-field-balance-row">
              <select value={balanceSign} onChange={e => setBalanceSign(e.target.value)}>
                <option value="+">En avance (+)</option>
                <option value="-">En retard (−)</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.5"
                value={balanceHours}
                onChange={e => setBalanceHours(Math.max(0, Number(e.target.value)))}
              />
              <span className="modal-field-suffix">h</span>
            </div>
          </div>
        </div>

        {/* Aperçu */}
        <div className="modal-emp-preview">
          <div className="modal-avatar" style={{ flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div className="modal-emp-name">{name || 'Prénom Nom'}</div>
            <div className="text-meta modal-emp-role">{role || 'Poste / rôle'}</div>
          </div>
        </div>

        {/* Primary actions */}
        <div className="modal-actions">
          <Button variant="default" style={{ flex: 1 }} onClick={onCancel}>Annuler</Button>
          <Button
            variant="success"
            style={{ flex: 2 }}
            onClick={handleSave}
            disabled={!name.trim()}
          >
            {isEdit ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </div>

        {/* Destructive actions — edit mode only */}
        {isEdit && (
          <div className="modal-destructive-actions">
            {!employee.archived && (
              <button className="modal-destructive-btn modal-destructive-btn--archive" onClick={() => setConfirmMode('archive')}>
                Archiver
              </button>
            )}
            <button className="modal-destructive-btn modal-destructive-btn--delete" onClick={() => setConfirmMode('delete')}>
              Supprimer
            </button>
          </div>
        )}

    </Modal>
  )
}
