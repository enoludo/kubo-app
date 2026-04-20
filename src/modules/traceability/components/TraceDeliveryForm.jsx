// ─── Formulaire création / édition d'un produit livré ────────────────────────
import { useState, useRef, useEffect } from 'react'
import Modal  from '../../../design-system/components/Modal/Modal'
import Button from '../../../design-system/components/Button/Button'
import { getSupplierColors } from '../utils/traceabilityColors'

const CONFORMITY_OPTIONS = [
  { value: 'compliant',     label: 'Conforme',     color: 'var(--tr-status-compliant-text)',     bg: 'var(--tr-status-compliant-bg)'     },
  { value: 'non_compliant', label: 'Non conforme', color: 'var(--tr-status-non-compliant-text)', bg: 'var(--tr-status-non-compliant-bg)' },
]

const TEMP_DEFAULT  = 3.5
const TEMP_STEP     = 0.5
const TEMP_WARN_MAX = 8
const TEMP_WARN_MIN = -30

function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

// ── Stepper générique ─────────────────────────────────────────────────────────

function Stepper({ value, onChange, min, max, step, format, warn }) {
  function dec() { onChange(Math.max(min ?? -Infinity, parseFloat((value - step).toFixed(10)))) }
  function inc() { onChange(Math.min(max ?? Infinity,  parseFloat((value + step).toFixed(10)))) }
  return (
    <div className="tr-stepper">
      <button type="button" className="tr-stepper-btn" onClick={dec} aria-label="Diminuer">−</button>
      <span className={`tr-stepper-value${warn ? ' tr-stepper-value--warn' : ''}`}>
        {format ? format(value) : value}
      </span>
      <button type="button" className="tr-stepper-btn" onClick={inc} aria-label="Augmenter">+</button>
    </div>
  )
}

// ── Autocomplete désignation ──────────────────────────────────────────────────

function Autocomplete({ value, onChange, suggestions, hasError, placeholder }) {
  const [open, setOpen]   = useState(false)
  const wrapRef           = useRef(null)

  const filtered = value.trim().length === 0 ? [] : suggestions
    .filter(s => s.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 5)

  useEffect(() => {
    setOpen(filtered.length > 0)
  }, [value, filtered.length])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [])

  function select(name) {
    onChange(name)
    setOpen(false)
  }

  return (
    <div className="tr-autocomplete-wrap" ref={wrapRef}>
      <input
        type="text"
        value={value}
        style={hasError ? { border: '1px solid var(--color-danger)' } : undefined}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && (
        <ul className="tr-autocomplete-list">
          {filtered.map(name => (
            <li key={name}
              className="tr-autocomplete-item"
              onMouseDown={e => { e.preventDefault(); select(name) }}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}


// ── Composant principal ───────────────────────────────────────────────────────

export default function TraceDeliveryForm({ supplier, dateStr, delivery, suggestions = [], onSave, onDelete, onClose }) {
  const isEdit = !!delivery
  const colors = getSupplierColors(supplier)

  const initials = supplier.name
    .split(' ')
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')

  const [productName,       setProductName]       = useState(delivery?.productName       ?? '')
  const [qty,               setQty]               = useState(delivery?.qty               ?? 1)
  const [weight,            setWeight]            = useState(delivery?.weight            ?? '')
  const [lot,               setLot]               = useState(delivery?.lot               ?? '')
  const [dlc,               setDlc]               = useState(delivery?.dlc               ?? '')
  const [temperature,       setTemperature]       = useState(delivery?.temperature       ?? TEMP_DEFAULT)
  const [conformity,        setConformity]        = useState(delivery?.conformity        ?? 'compliant')
  const [nonConformityNote, setNonConformityNote] = useState(delivery?.nonConformityNote ?? '')
  const [errors,            setErrors]            = useState({})
  const [confirmDelete,     setConfirmDelete]     = useState(false)

  const tempWarn = temperature > TEMP_WARN_MAX || temperature < TEMP_WARN_MIN

  function clearError(field) {
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  function validate() {
    const errs = {}
    if (!productName.trim()) errs.productName = true
    if (!weight.trim())      errs.weight      = true
    if (!dlc.trim())         errs.dlc         = true
    return errs
  }

  function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    onSave({
      supplierId:         supplier.id,
      date:               dateStr,
      productName:        productName.trim(),
      qty,
      weight:             weight.trim(),
      lot:                lot.trim() || null,
      dlc,
      temperature,
      conformity,
      nonConformityNote:  nonConformityNote.trim() || null,
    })
  }

  return (
    <Modal onClose={onClose} size="md" scrollBody>

      {/* ── Header ── */}
      <div className="tr-modal-header">
        <div className="tr-zone-profile">
          <div className="tr-zone-avatar" style={{ backgroundColor: colors.badgeColor }}>
            {initials}
          </div>
          <div className="tr-zone-identity">
            <span className="tr-zone-title">{supplier.name}</span>
            <span className="tr-zone-subtitle">
              {isEdit ? 'Modifier le produit livré' : 'Nouveau produit livré'}
            </span>
          </div>
        </div>
      </div>
      <div className="tr-modal-date">{fmtDate(dateStr)}</div>

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

      {/* ── Champs produit ── */}
      <div className="tr-form-section">
        <div className="modal-form-fields">

          <div className="modal-field-full">
            <label>Désignation *</label>
            <Autocomplete
              value={productName}
              onChange={v => { setProductName(v); clearError('productName') }}
              suggestions={suggestions}
              hasError={!!errors.productName}
              placeholder="ex : Farine T55"
            />
          </div>

          <div className="tr-product-qty-row">
            <div className="modal-field-full">
              <label>Poids / Volume *</label>
              <input type="text" value={weight}
                style={errors.weight ? { border: '1px solid var(--color-danger)' } : undefined}
                onChange={e => { setWeight(e.target.value); clearError('weight') }}
                placeholder="ex : 25 kg, 5 L" />
            </div>
            <div className="tr-product-qty-field">
              <label>Quantité</label>
              <Stepper
                value={qty}
                onChange={setQty}
                min={1}
                step={1}
              />
            </div>
          </div>

          <div className="tr-product-row-2">
            <div className="modal-field-full">
              <label>N° lot</label>
              <input type="text" value={lot}
                onChange={e => setLot(e.target.value)}
                placeholder="ex : L2403A" />
            </div>
            <div className="modal-field-full">
              <label>DLC / DDM *</label>
              <input type="date" value={dlc}
                style={errors.dlc ? { border: '1px solid var(--color-danger)' } : undefined}
                onChange={e => { setDlc(e.target.value); clearError('dlc') }} />
            </div>
          </div>

        </div>
      </div>

      {/* ── Température ── */}
      <div className="tr-form-section">
        <label className="tr-form-label">Température à la réception</label>
        <div className="tr-temp-stepper-row">
          <Stepper
            value={temperature}
            onChange={setTemperature}
            step={TEMP_STEP}
            format={v => `${v.toFixed(1)} °C`}
            warn={tempWarn}
          />
          {tempWarn && <span className="tr-temp-warn">⚠️ Hors plage chaîne du froid</span>}
        </div>
      </div>

      {/* ── Note non-conformité ── */}
      {conformity === 'non_compliant' && (
        <div className="tr-form-section">
          <label className="tr-form-label">Note d'anomalie <span className="tr-form-optional">(optionnel)</span></label>
          <textarea className="tr-notes-input" value={nonConformityNote}
            onChange={e => setNonConformityNote(e.target.value)}
            placeholder="Décrire l'anomalie constatée…" rows={3} />
        </div>
      )}

      {/* ── Actions ── */}
      {isEdit && confirmDelete ? (
        <div className="modal-actions">
          <span className="tr-confirm-label">Supprimer ce produit livré ?</span>
          <button className="tr-confirm-yes" onClick={() => onDelete(delivery.id)}>Oui</button>
          <button className="tr-confirm-no"  onClick={() => setConfirmDelete(false)}>Annuler</button>
        </div>
      ) : (
        <div className="modal-actions">
          {isEdit && (
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>Supprimer</Button>
          )}
          <div style={{ flex: 1 }} />
          <Button variant="default" onClick={onClose}>Annuler</Button>
          <Button variant="success" onClick={handleSave}>Enregistrer</Button>
        </div>
      )}

    </Modal>
  )
}
