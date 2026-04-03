// ─── Formulaire création / édition d'un fournisseur ───────────────────────────
import { useState } from 'react'
import Modal  from '../../../design-system/components/Modal/Modal'
import Button from '../../../design-system/components/Button/Button'
import { CATEGORIES, getCategoryTokens } from '../../../data/categories'

export default function TraceSupplierForm({ supplier, onSave, onDelete, onClose }) {
  const isEdit = !!supplier

  const [name,     setName]     = useState(supplier?.name     ?? '')
  const [category, setCategory] = useState(supplier?.category ?? CATEGORIES[0].id)
  const [contact,  setContact]  = useState(supplier?.contact  ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const tokens   = getCategoryTokens(category)
  const initials = name
    .split(' ')
    .map(w => w[0]?.toUpperCase() ?? '')
    .filter(Boolean)
    .slice(0, 2)
    .join('') || '?'

  function handleSave() {
    if (!name.trim()) return
    onSave({
      name:     name.trim(),
      category,
      contact:  contact.trim() || null,
    })
  }

  return (
    <Modal onClose={onClose} size="sm">

      {/* ── Header ── */}
      <div className="tr-zone-profile">
        <div className="tr-zone-avatar" style={{ backgroundColor: tokens.badge }}>
          {initials}
        </div>
        <div className="tr-zone-identity">
          <span className="tr-zone-title">
            {isEdit ? supplier.name : 'Nouveau fournisseur'}
          </span>
          <span className="tr-zone-subtitle">
            {isEdit ? 'Modifier les informations' : 'Ajouter un fournisseur'}
          </span>
        </div>
      </div>

      {/* ── Champs ── */}
      <div className="modal-form-fields">

        <div className="modal-field-full">
          <label>Nom *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="ex : Moulins du Boulou"
            autoFocus
          />
        </div>

        <div className="modal-field-full">
          <label>Catégorie *</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className="modal-field-full">
          <label>Contact <span className="tr-form-optional">(optionnel)</span></label>
          <input
            type="text"
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder="Téléphone, email…"
          />
        </div>

      </div>

      {/* ── Actions ── */}
      {isEdit && confirmDelete ? (
        <div className="modal-actions">
          <span className="tr-confirm-label">Supprimer ce fournisseur et toutes ses réceptions ?</span>
          <button className="tr-confirm-yes" onClick={() => onDelete(supplier.id)}>Oui</button>
          <button className="tr-confirm-no"  onClick={() => setConfirmDelete(false)}>Annuler</button>
        </div>
      ) : (
        <div className="modal-actions">
          {isEdit && (
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Supprimer
            </Button>
          )}
          <div style={{ flex: 1 }} />
          <Button variant="default" onClick={onClose}>Annuler</Button>
          <Button variant="success" onClick={handleSave} disabled={!name.trim()}>
            Enregistrer
          </Button>
        </div>
      )}

    </Modal>
  )
}
