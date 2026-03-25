// ─── Modale nouvelle commande (boutique) ──────────────────────────────────────
import { useState, useEffect } from 'react'
import { dateToStr } from '../../utils/date'
import { useProducts } from '../../hooks/useProducts'
import Modal from '../../design-system/components/Modal/Modal'

const PICKUP_SLOTS = (() => {
  const slots = []
  for (let h = 10; h <= 18; h++) {
    for (const m of [0, 30]) {
      if (h === 10 && m === 0) continue  // commence à 10:30
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
})()

function fmtDateLabel(dateStr) {
  const s = new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function makeRow(mode = 'catalogue') {
  return {
    id:        crypto.randomUUID(),
    mode,               // 'catalogue' | 'libre'
    productId: null,
    label:     '',
    size:      '',
    qty:       1,
    unitPrice: null,
  }
}

function initRow(item) {
  return {
    id:        crypto.randomUUID(),
    mode:      item.productId ? 'catalogue' : 'libre',
    productId: item.productId ?? null,
    label:     item.label     ?? '',
    size:      item.size      ?? '',
    qty:       item.qty       ?? 1,
    unitPrice: item.unitPrice ?? null,
  }
}

export default function NewOrderModal({ onSave, onCancel, initialDate, initialChannel, initialOrder }) {
  const { activeProducts, getById } = useProducts()
  const noProducts = activeProducts.length === 0
  const defaultMode = noProducts ? 'libre' : 'catalogue'

  const today  = dateToStr(new Date())
  const isEdit = !!initialOrder

  const [name,       setName]       = useState(initialOrder?.customer?.name  ?? '')
  const [phone,      setPhone]      = useState(initialOrder?.customer?.phone ?? '')
  const [rows,       setRows]       = useState(
    initialOrder?.items?.length
      ? initialOrder.items.map(initRow)
      : [makeRow(defaultMode)]
  )
  const [totalPrice, setTotalPrice] = useState(initialOrder?.totalPrice ?? '')
  const [pickupDate, setPickupDate] = useState(initialOrder?.pickupDate ?? initialDate ?? today)
  const [pickupTime, setPickupTime] = useState(initialOrder?.pickupTime ?? '')
  const [paid,       setPaid]       = useState(initialOrder?.paid ?? false)
  const [submitted,  setSubmitted]  = useState(false)

  // ── Auto-calcul du total ──────────────────────────────────────────────────
  useEffect(() => {
    const computed = rows.reduce((sum, r) => {
      if (r.unitPrice != null && r.qty > 0) return sum + r.unitPrice * r.qty
      return sum
    }, 0)
    if (computed > 0) setTotalPrice(computed.toFixed(2))
  }, [rows])

  const nameInvalid = submitted && !name.trim()
  const rowsInvalid = submitted && !rows.some(r => r.label.trim())

  // ── CRUD lignes ───────────────────────────────────────────────────────────

  function addRow() {
    setRows(prev => [...prev, makeRow(defaultMode)])
  }

  function removeRow(id) {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  function updateRow(id, changes) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...changes } : r))
  }

  // ── Sélection produit catalogue ───────────────────────────────────────────

  function handleProductSelect(rowId, productId) {
    if (!productId) {
      updateRow(rowId, { productId: null, label: '', size: '', unitPrice: null })
      return
    }
    const product = getById(productId)
    if (!product) return
    const firstSize = product.sizes?.slice().sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0]
    updateRow(rowId, {
      productId,
      label:     product.name,
      size:      firstSize?.label ?? '',
      unitPrice: firstSize?.price ?? null,
    })
  }

  function handleSizeSelect(rowId, sizeLabel, rowProductId) {
    const product = rowProductId ? getById(rowProductId) : null
    const size    = product?.sizes?.find(s => s.label === sizeLabel)
    updateRow(rowId, {
      size:      sizeLabel,
      unitPrice: size?.price ?? null,
    })
  }

  // ── Bascule mode catalogue ↔ libre ────────────────────────────────────────

  function toggleMode(rowId, currentMode) {
    if (currentMode === 'catalogue' && noProducts) return
    updateRow(rowId, {
      mode:      currentMode === 'catalogue' ? 'libre' : 'catalogue',
      productId: null,
      label:     '',
      size:      '',
      unitPrice: null,
    })
  }

  // ── Sauvegarde ────────────────────────────────────────────────────────────

  function handleSave() {
    setSubmitted(true)

    const validRows = rows.filter(r => r.label.trim())
    if (!name.trim() || validRows.length === 0) return

    onSave({
      ...(isEdit && initialOrder?.id ? { id: initialOrder.id } : {}),
      channel: initialChannel ?? initialOrder?.channel ?? 'boutique',
      customer: { name: name.trim(), phone: phone.trim() || null },
      items: validRows.map(r => ({
        productId: r.productId ?? null,
        label:     r.label.trim(),
        size:      r.size?.trim() || null,
        qty:       Math.max(1, Number(r.qty) || 1),
        unitPrice: r.unitPrice ?? null,
      })),
      totalPrice: parseFloat(String(totalPrice).replace(',', '.')) || 0,
      pickupDate,
      pickupTime: pickupTime || null,
      paid,
      note: null,
    })
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <Modal onClose={onCancel} scrollBody>

        <div className="modal-emp-form-title">{isEdit ? 'Modifier la commande' : 'Nouvelle commande'}</div>
        <div className="modal-date">{fmtDateLabel(pickupDate)}</div>

        <div className="modal-form-fields">

          {/* Nom */}
          <div className={`modal-field-full${nameInvalid ? ' nom-field-invalid' : ''}`}>
            <label>Nom du client *</label>
            <input
              type="text"
              placeholder="Nom du client"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Téléphone */}
          <div className="modal-field-full">
            <label>Téléphone</label>
            <input
              type="tel"
              placeholder="06 00 00 00 00"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

        </div>

        {/* ── Produits ── */}
        <div className="nom-products">
          <span className={`field-label nom-section-label${rowsInvalid ? ' nom-section-label--invalid' : ''}`}>
            Produits *
          </span>

          <div className="nom-product-rows">
            {rows.map(row => {
              const isCatalogue = row.mode === 'catalogue'
              const product = row.productId ? getById(row.productId) : null
              const sizes   = (product?.sizes ?? []).slice().sort((a, b) => (a.price ?? 0) - (b.price ?? 0))

              return (
                <div key={row.id} className="nom-product-card">

                  {/* ── En-tête : toggle mode ── */}
                  <div className="nom-card-header">
                    <button
                      type="button"
                      className={`nom-mode-toggle${isCatalogue ? ' nom-mode-toggle--catalogue' : ' nom-mode-toggle--libre'}`}
                      onClick={() => toggleMode(row.id, row.mode)}
                      disabled={noProducts && !isCatalogue}
                    >
                      {isCatalogue ? 'Saisie libre' : 'Choisir dans le catalogue'}
                    </button>
                  </div>

                  {/* ── Corps : sélecteurs ou saisie libre ── */}
                  <div className="nom-card-body">

                    {isCatalogue ? (
                      /* ── Mode catalogue ── */
                      <>
                        <select
                          value={row.productId ?? ''}
                          onChange={e => handleProductSelect(row.id, e.target.value)}
                          className="nom-product-select"
                        >
                          <option value="">
                            {noProducts ? 'Aucun produit disponible' : '— Choisir un produit —'}
                          </option>
                          {activeProducts.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>

                        {product && sizes.length > 0 && (
                          <select
                            value={row.size}
                            onChange={e => handleSizeSelect(row.id, e.target.value, row.productId)}
                            className="nom-size-select"
                          >
                            {sizes.map(s => (
                              <option key={s.id} value={s.label}>
                                {s.label} — {s.price} €
                              </option>
                            ))}
                          </select>
                        )}

                        {row.unitPrice != null && (
                          <div className="nom-unit-price">
                            {row.unitPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            <span className="nom-unit-price-label"> / unité</span>
                          </div>
                        )}
                      </>
                    ) : (
                      /* ── Mode saisie libre ── */
                      <>
                        <input
                          type="text"
                          placeholder="Nom du produit"
                          value={row.label}
                          onChange={e => updateRow(row.id, { label: e.target.value })}
                          className="nom-libre-name"
                        />
                        <div className="nom-libre-meta">
                          <input
                            type="text"
                            placeholder="Taille (optionnel)"
                            value={row.size}
                            onChange={e => updateRow(row.id, { size: e.target.value })}
                            className="nom-libre-size"
                          />
                          <div className="nom-libre-price-wrap">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0,00"
                              value={row.unitPrice ?? ''}
                              onChange={e => updateRow(row.id, {
                                unitPrice: e.target.value !== '' ? parseFloat(e.target.value) : null
                              })}
                              className="nom-libre-price"
                            />
                            <span className="nom-libre-euro">€</span>
                          </div>
                        </div>
                      </>
                    )}

                  </div>

                  {/* ── Pied : quantité + supprimer ── */}
                  <div className="nom-card-footer">
                    <div className="qty-stepper">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => updateRow(row.id, { qty: Math.max(1, row.qty - 1) })}
                        disabled={row.qty <= 1}
                      >−</button>
                      <input
                        type="number"
                        className="qty-value"
                        min="1"
                        max="99"
                        value={row.qty}
                        onChange={e => updateRow(row.id, { qty: Math.min(99, Math.max(1, Number(e.target.value) || 1)) })}
                      />
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => updateRow(row.id, { qty: Math.min(99, row.qty + 1) })}
                        disabled={row.qty >= 99}
                      >+</button>
                    </div>

                    {rows.length > 1 && (
                      <button
                        className="nom-row-remove"
                        onClick={() => removeRow(row.id)}
                        type="button"
                        aria-label="Supprimer ce produit"
                      >×</button>
                    )}
                  </div>

                </div>
              )
            })}
          </div>

          <button
            className="tv-add-employee-btn nom-add-row add-trigger add-trigger--labeled"
            onClick={addRow}
            type="button"
          >
            + Ajouter un produit
          </button>
        </div>

        <div className="modal-form-fields" style={{ marginTop: 12 }}>

          {/* Prix total */}
          <div className="modal-field-full">
            <label>Prix total (€)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={totalPrice}
              onChange={e => setTotalPrice(e.target.value)}
              className="nom-input-right"
            />
          </div>

          {/* Date + heure */}
          <div className="nom-row-2col">
            <div className="modal-field-full">
              <label>Jour de retrait</label>
              <input
                type="date"
                value={pickupDate}
                onChange={e => setPickupDate(e.target.value)}
              />
            </div>
            <div className="modal-field-full">
              <label>Heure de retrait</label>
              <select
                value={pickupTime}
                onChange={e => setPickupTime(e.target.value)}
              >
                <option value="">-- Heure de retrait --</option>
                {PICKUP_SLOTS.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payée */}
          <label className="nom-checkbox-label">
            <input
              type="checkbox"
              checked={paid}
              onChange={e => setPaid(e.target.checked)}
            />
            Commande payée
          </label>

        </div>

        {/* Actions */}
        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="btn-secondary modal-cancel" onClick={onCancel}>Annuler</button>
          <button
            className="btn-primary"
            style={{ background: 'var(--planning-shift-rest-color)', color: 'var(--text)' }}
            onClick={handleSave}
          >
            {isEdit ? 'Enregistrer les modifications' : 'Enregistrer'}
          </button>
        </div>

    </Modal>
  )
}
