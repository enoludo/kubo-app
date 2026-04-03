// ─── Formulaire création / édition d'une réception ────────────────────────────
import { useState } from 'react'
import Modal  from '../../../design-system/components/Modal/Modal'
import Button from '../../../design-system/components/Button/Button'
import { getCategoryById, getCategoryTokens } from '../../../data/categories'

const CONFORMITY_OPTIONS = [
  { value: 'compliant',     label: 'Conforme',     color: 'var(--tr-status-compliant-text)',     bg: 'var(--tr-status-compliant-bg)'     },
  { value: 'non_compliant', label: 'Non conforme', color: 'var(--tr-status-non-compliant-text)', bg: 'var(--tr-status-non-compliant-bg)' },
  { value: 'pending',       label: 'En attente',   color: 'var(--tr-status-pending-text)',       bg: 'var(--tr-status-pending-bg)'       },
]

function emptyProduct() {
  return { _key: crypto.randomUUID(), name: '', quantity: '', lot: '', dlc: '' }
}

function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function TraceReceptionForm({ supplier, dateStr, reception, onSave, onDelete, onClose }) {
  const isEdit = !!reception
  const tokens = getCategoryTokens(supplier.category)

  const initials = supplier.name
    .split(' ')
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')

  const [conformity,   setConformity]   = useState(reception?.conformity  ?? 'pending')
  const [temperature,  setTemperature]  = useState(reception?.temperature != null ? String(reception.temperature) : '')
  const [notes,        setNotes]        = useState(reception?.notes        ?? '')
  const [products,     setProducts]     = useState(
    reception?.products?.length
      ? reception.products.map(p => ({ _key: crypto.randomUUID(), ...p }))
      : [emptyProduct()]
  )
  const [confirmDelete, setConfirmDelete] = useState(false)

  // ── Produits helpers ────────────────────────────────────────────────────────

  function updateProduct(key, field, value) {
    setProducts(prev => prev.map(p => p._key === key ? { ...p, [field]: value } : p))
  }

  function addProduct() {
    setProducts(prev => [...prev, emptyProduct()])
  }

  function removeProduct(key) {
    setProducts(prev => prev.filter(p => p._key !== key))
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  function handleSave() {
    const cleanProducts = products
      .filter(p => p.name.trim())
      .map(({ _key, ...rest }) => ({
        name:     rest.name.trim(),
        quantity: rest.quantity.trim() || null,
        lot:      rest.lot.trim()      || null,
        dlc:      rest.dlc.trim()      || null,
      }))

    onSave({
      supplierId:  supplier.id,
      date:        dateStr,
      conformity,
      temperature: temperature.trim() !== '' ? Number(temperature) : null,
      products:    cleanProducts,
      notes:       notes.trim(),
    })
  }

  return (
    <Modal onClose={onClose} size="md" scrollBody>

      {/* ── Header ── */}
      <div className="tr-modal-header">
        <div className="tr-zone-profile">
          <div className="tr-zone-avatar" style={{ backgroundColor: tokens.badge }}>
            {initials}
          </div>
          <div className="tr-zone-identity">
            <span className="tr-zone-title">{supplier.name}</span>
            <span className="tr-zone-subtitle">{isEdit ? 'Modifier la réception' : 'Nouvelle réception'}</span>
          </div>
        </div>
        <div className="tr-modal-date">{fmtDate(dateStr)}</div>
      </div>

      {/* ── Conformité ── */}
      <div className="tr-form-section">
        <label className="tr-form-label">Conformité</label>
        <div className="tr-conformity-btns">
          {CONFORMITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`tr-conformity-btn${conformity === opt.value ? ' tr-conformity-btn--active' : ''}`}
              style={conformity === opt.value ? { backgroundColor: opt.bg, color: opt.color } : {}}
              onClick={() => setConformity(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Température ── */}
      <div className="tr-form-section">
        <label className="tr-form-label">Température à la réception <span className="tr-form-optional">(optionnel)</span></label>
        <div className="tr-temp-row">
          <input
            type="number"
            className="tr-temp-input"
            value={temperature}
            onChange={e => setTemperature(e.target.value)}
            placeholder="—"
            step="0.1"
          />
          <span className="tr-temp-unit">°C</span>
        </div>
      </div>

      {/* ── Produits ── */}
      <div className="tr-form-section">
        <label className="tr-form-label">Produits reçus</label>
        <div className="tr-product-list">
          {products.map((p, i) => (
            <div key={p._key} className="tr-product-item">
              <div className="tr-product-item-header">
                <span className="tr-product-num">Produit {i + 1}</span>
                {products.length > 1 && (
                  <button
                    type="button"
                    className="tr-product-remove"
                    onClick={() => removeProduct(p._key)}
                    aria-label="Supprimer ce produit"
                  >×</button>
                )}
              </div>
              <div className="modal-form-fields">
                <div className="modal-field-full">
                  <label>Désignation *</label>
                  <input
                    type="text"
                    value={p.name}
                    onChange={e => updateProduct(p._key, 'name', e.target.value)}
                    placeholder="ex : Farine T55"
                  />
                </div>
                <div className="tr-product-row-3">
                  <div className="modal-field-full">
                    <label>Quantité</label>
                    <input
                      type="text"
                      value={p.quantity}
                      onChange={e => updateProduct(p._key, 'quantity', e.target.value)}
                      placeholder="ex : 25 kg"
                    />
                  </div>
                  <div className="modal-field-full">
                    <label>N° lot</label>
                    <input
                      type="text"
                      value={p.lot}
                      onChange={e => updateProduct(p._key, 'lot', e.target.value)}
                      placeholder="ex : L2403A"
                    />
                  </div>
                  <div className="modal-field-full">
                    <label>DLC / DDM</label>
                    <input
                      type="date"
                      value={p.dlc ?? ''}
                      onChange={e => updateProduct(p._key, 'dlc', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="tr-add-product-btn"
          onClick={addProduct}
        >
          + Ajouter un produit
        </button>
      </div>

      {/* ── Notes ── */}
      <div className="tr-form-section">
        <label className="tr-form-label">Notes / Anomalies <span className="tr-form-optional">(optionnel)</span></label>
        <textarea
          className="tr-notes-input"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Décrire les anomalies ou observations…"
          rows={3}
        />
      </div>

      {/* ── Actions ── */}
      {isEdit && confirmDelete ? (
        <div className="modal-actions">
          <span className="tr-confirm-label">Supprimer cette réception ?</span>
          <button className="tr-confirm-yes" onClick={() => onDelete(reception.id)}>Oui</button>
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
          <Button variant="success" onClick={handleSave}>Enregistrer</Button>
        </div>
      )}

    </Modal>
  )
}
