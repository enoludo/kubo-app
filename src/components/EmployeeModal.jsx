import { useState } from 'react'

export const PASTEL_COLORS = [
  '#F5A7B8', '#A7C4F5', '#A8D5B5', '#C5B4E8',
  '#F5CFA7', '#F5E6A7', '#A7E8E8', '#F5B8A7',
]

export function makeInitials(name) {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2) || '?'
}

export default function EmployeeModal({ employee, onSave, onCancel }) {
  const [name,  setName]  = useState(employee?.name  ?? '')
  const [role,  setRole]  = useState(employee?.role  ?? '')
  const [email, setEmail] = useState(employee?.email ?? '')
  const [color, setColor] = useState(employee?.color ?? PASTEL_COLORS[0])

  const isEdit   = !!employee
  const initials = makeInitials(name)

  function handleSave() {
    if (!name.trim()) return
    onSave({ name: name.trim(), role: role.trim(), email: email.trim(), color, initials })
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        <div className="modal-emp-form-title">
          {isEdit ? "Modifier l'employé" : 'Nouvel employé'}
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
        </div>

        <div className="modal-color-label">Couleur</div>
        <div className="modal-color-grid">
          {PASTEL_COLORS.map(c => (
            <button
              key={c}
              className={`color-swatch${color === c ? ' selected' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        {/* Aperçu */}
        <div className="modal-emp-preview">
          <div className="modal-avatar" style={{ background: color, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div className="modal-emp-name">{name || 'Prénom Nom'}</div>
            <div className="modal-emp-role">{role || 'Poste / rôle'}</div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="modal-cancel" onClick={onCancel}>Annuler</button>
          <button
            className="modal-confirm"
            style={{ background: color }}
            onClick={handleSave}
            disabled={!name.trim()}
          >
            {isEdit ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>

      </div>
    </div>
  )
}
