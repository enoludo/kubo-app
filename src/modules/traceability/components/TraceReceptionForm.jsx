// ─── Formulaire création / édition d'une réception ────────────────────────────
import { useState, useRef } from 'react'
import Modal  from '../../../design-system/components/Modal/Modal'
import Button from '../../../design-system/components/Button/Button'
import { getSupplierColors } from '../utils/traceabilityColors'

const CONFORMITY_OPTIONS = [
  { value: 'compliant',     label: 'Conforme',     color: 'var(--tr-status-compliant-text)',     bg: 'var(--tr-status-compliant-bg)'     },
  { value: 'non_compliant', label: 'Non conforme', color: 'var(--tr-status-non-compliant-text)', bg: 'var(--tr-status-non-compliant-bg)' },
]

const TEMP_DEFAULT  = 3.5
const TEMP_STEP     = 0.5
const TEMP_WARN_MAX = 8     // au-dessus → alerte chaîne du froid
const TEMP_WARN_MIN = -30   // en dessous → alerte

function emptyProduct() {
  return { _key: crypto.randomUUID(), name: '', qty: 1, unit: '', lot: '', dlc: '', photo_url: null }
}

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

// ── Sous-composant : photo pour un produit ────────────────────────────────────

function ProductPhoto({ photoUrl, productName, supplier, dateStr, onUploaded, onRemove }) {
  const inputRef                      = useRef(null)
  const [uploading,    setUploading]  = useState(false)
  const [uploadError,  setUploadError] = useState(null)
  const [pendingFile,  setPendingFile] = useState(null)

  async function doUpload(file) {
    setUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('dateStr', dateStr)
      formData.append('supplierName', supplier.name)
      formData.append('productName', productName.trim() || 'produit')
      formData.append('categoryLabel', supplier.name)
      const res = await fetch('/api/upload-photo', { method: 'POST', body: formData })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur upload')
      const { url } = await res.json()
      onUploaded(url)
      setPendingFile(null)
    } catch (err) {
      setPendingFile(file)
      setUploadError(err.message ?? "Échec de l'upload")
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    doUpload(file)
    e.target.value = ''
  }

  if (photoUrl) {
    return (
      <div className="tr-photo-container">
        <img src={photoUrl} alt="Étiquette" className="tr-photo-thumb"
          onClick={() => window.open(photoUrl, '_blank')} />
        <button type="button" className="tr-photo-remove" onClick={onRemove} aria-label="Supprimer la photo">×</button>
      </div>
    )
  }

  return (
    <div className="tr-photo-upload">
      <input ref={inputRef} type="file" accept="image/*" capture="environment"
        className="tr-photo-input" onChange={handleFileChange} aria-hidden="true" />
      {uploading ? (
        <div className="tr-upload-status">
          <span className="tr-upload-spinner" aria-hidden="true" />
          <span className="tr-upload-label">Upload en cours…</span>
        </div>
      ) : uploadError ? (
        <div className="tr-upload-error">
          <span className="tr-upload-error-msg">{uploadError}</span>
          <button type="button" className="tr-upload-retry" onClick={() => pendingFile && doUpload(pendingFile)}>Réessayer</button>
        </div>
      ) : (
        <button type="button" className="tr-photo-btn" onClick={() => inputRef.current?.click()}>
          📷 Photo étiquette
        </button>
      )}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function TraceReceptionForm({ supplier, dateStr, reception, onSave, onDelete, onClose }) {
  const isEdit = !!reception
  const colors  = getSupplierColors(supplier)

  const initials = supplier.name
    .split(' ')
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')

  const [conformity,    setConformity]    = useState(reception?.conformity  ?? 'compliant')
  const [temperature,   setTemperature]   = useState(reception?.temperature ?? TEMP_DEFAULT)
  const [notes,         setNotes]         = useState(reception?.notes ?? '')
  const [errors,        setErrors]        = useState({})
  const [products,      setProducts]      = useState(
    reception?.products?.length
      ? reception.products.map(p => ({
          _key:      crypto.randomUUID(),
          name:      p.name      ?? '',
          qty:       p.qty       ?? 1,
          unit:      p.unit      ?? '',
          lot:       p.lot       ?? '',
          dlc:       p.dlc       ?? '',
          photo_url: p.photo_url ?? null,
        }))
      : [emptyProduct()]
  )
  const [confirmDelete, setConfirmDelete] = useState(false)

  const tempWarn = temperature > TEMP_WARN_MAX || temperature < TEMP_WARN_MIN

  // ── Produits helpers ────────────────────────────────────────────────────────

  function updateProduct(key, field, value) {
    setProducts(prev => prev.map(p => p._key === key ? { ...p, [field]: value } : p))
    // Efface l'erreur du champ dès que l'utilisateur saisit
    setErrors(prev => {
      const next = { ...prev }
      delete next[`${key}-${field}`]
      return next
    })
  }
  function addProduct()    { setProducts(prev => [...prev, emptyProduct()]) }
  function removeProduct(key) { setProducts(prev => prev.filter(p => p._key !== key)) }

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate() {
    const errs = {}
    products.forEach(p => {
      if (!p.name.trim()) errs[`${p._key}-name`] = 'Champ requis'
      if (!p.unit.trim()) errs[`${p._key}-unit`] = 'Champ requis'
      if (!p.dlc.trim())  errs[`${p._key}-dlc`]  = 'Champ requis'
    })
    return errs
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    const cleanProducts = products
      .filter(p => p.name.trim())
      .map(({ _key, ...rest }) => ({
        name:      rest.name.trim(),
        qty:       rest.qty,
        unit:      rest.unit.trim() || null,
        lot:       rest.lot.trim()  || null,
        dlc:       rest.dlc.trim()  || null,
        photo_url: rest.photo_url   || null,
      }))

    onSave({
      supplierId:  supplier.id,
      date:        dateStr,
      conformity,
      temperature,
      products:    cleanProducts,
      notes:       notes.trim(),
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

      {/* ── Température — stepper ── */}
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
          {tempWarn && (
            <span className="tr-temp-warn">⚠️ Hors plage chaîne du froid</span>
          )}
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
                  <button type="button" className="tr-product-remove"
                    onClick={() => removeProduct(p._key)} aria-label="Supprimer ce produit">×</button>
                )}
              </div>

              <div className="modal-form-fields">
                <div className="modal-field-full">
                  <label>Désignation *</label>
                  <input type="text" value={p.name} 
                    onChange={e => updateProduct(p._key, 'name', e.target.value)}
                    placeholder="ex : Farine T55" />
                  {errors[`${p._key}-name`] && (
                    <span className="tr-field-error">{errors[`${p._key}-name`]}</span>
                  )}
                </div>

                {/* Volume/Poids + Quantité stepper */}
                <div className="tr-product-qty-row">
                  <div className="modal-field-full">
                    <label>Volume / Poids *</label>
                    <input type="text" value={p.unit ?? ''}
                      onChange={e => updateProduct(p._key, 'unit', e.target.value)}
                      placeholder="ex: 500g, 1L, 250ml" />
                    {errors[`${p._key}-unit`] && (
                      <span className="tr-field-error">{errors[`${p._key}-unit`]}</span>
                    )}
                  </div>
                  <div className="tr-product-qty-field">
                    <label>Quantité</label>
                    <Stepper
                      value={p.qty}
                      onChange={v => updateProduct(p._key, 'qty', v)}
                      min={1}
                      step={1}
                    />
                  </div>
                </div>

                <div className="tr-product-row-2">
                  <div className="modal-field-full">
                    <label>N° lot</label>
                    <input type="text" value={p.lot ?? ''}
                      onChange={e => updateProduct(p._key, 'lot', e.target.value)}
                      placeholder="ex : L2403A" />
                  </div>
                  <div className="modal-field-full">
                    <label>DLC / DDM *</label>
                    <input type="date" value={p.dlc ?? ''}
                      onChange={e => updateProduct(p._key, 'dlc', e.target.value)} />
                    {errors[`${p._key}-dlc`] && (
                      <span className="tr-field-error">{errors[`${p._key}-dlc`]}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Photo étiquette */}
              <ProductPhoto
                photoUrl={p.photo_url}
                productName={p.name}
                supplier={supplier}
                dateStr={dateStr}
                onUploaded={url => updateProduct(p._key, 'photo_url', url)}
                onRemove={() => updateProduct(p._key, 'photo_url', null)}
              />
            </div>
          ))}
        </div>
        <button type="button" className="tr-add-product-btn" onClick={addProduct}>
          + Ajouter un produit
        </button>
      </div>

      {/* ── Notes ── */}
      <div className="tr-form-section">
        <label className="tr-form-label">Notes / Anomalies <span className="tr-form-optional">(optionnel)</span></label>
        <textarea className="tr-notes-input" value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Décrire les anomalies ou observations…" rows={3} />
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
