// ─── Modale nouvelle commande ─────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { dateToStr } from '../../utils/date'
import { useProducts } from '../../hooks/useProducts'
import Modal from '../../design-system/components/Modal/Modal'
import Button from '../../design-system/components/Button/Button'
import ProductGrid from './components/ProductGrid'

const PICKUP_SLOTS = (() => {
  const slots = []
  for (let h = 10; h <= 18; h++) {
    for (const m of [0, 30]) {
      if (h === 10 && m === 0) continue
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

function fmtPrice(price) {
  if (price == null) return ''
  return price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function makeCartItem(product, size) {
  return {
    id:        crypto.randomUUID(),
    productId: product.id ?? null,
    label:     product.name,
    size:      size?.label ?? null,
    qty:       1,
    unitPrice: size?.price ?? null,
  }
}

export default function NewOrderModal({ onSave, onCancel, initialDate, initialChannel, initialOrder }) {
  const { activeProducts } = useProducts()
  const today  = dateToStr(new Date())
  const isEdit = !!initialOrder

  const [name,       setName]       = useState(initialOrder?.customer?.name  ?? '')
  const [phone,      setPhone]      = useState(initialOrder?.customer?.phone ?? '')
  const [cart,       setCart]       = useState(
    initialOrder?.items?.length
      ? initialOrder.items.map(item => ({
          id:        crypto.randomUUID(),
          productId: item.productId ?? null,
          label:     item.label     ?? '',
          size:      item.size      ?? null,
          qty:       item.qty       ?? 1,
          unitPrice: item.unitPrice ?? null,
        }))
      : []
  )
  const [totalOverride, setTotalOverride] = useState(
    initialOrder?.totalPrice ? String(initialOrder.totalPrice) : ''
  )
  const [pickupDate, setPickupDate] = useState(initialOrder?.pickupDate ?? initialDate ?? today)
  const [pickupTime, setPickupTime] = useState(initialOrder?.pickupTime ?? '')
  const [paid,       setPaid]       = useState(initialOrder?.paid ?? false)
  const [submitted,  setSubmitted]  = useState(false)

  // ── Total auto-calculé ────────────────────────────────────────────────────
  const computedTotal = cart.reduce((sum, item) => {
    if (item.unitPrice != null && item.qty > 0) return sum + item.unitPrice * item.qty
    return sum
  }, 0)

  // Met à jour l'override uniquement si tous les items ont un prix
  const allPriced = cart.length > 0 && cart.every(i => i.unitPrice != null)
  useEffect(() => {
    if (allPriced) setTotalOverride(computedTotal.toFixed(2))
  }, [computedTotal, allPriced])

  const finalTotal = parseFloat(String(totalOverride).replace(',', '.')) || 0

  const nameInvalid = submitted && !name.trim()
  const cartInvalid = submitted && cart.length === 0

  // ── Panier ────────────────────────────────────────────────────────────────

  function handleAdd(product, size) {
    const item = makeCartItem(product, size)
    setCart(prev => [...prev, item])
    return item
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  function updateQty(id, delta) {
    setCart(prev => prev.map(item =>
      item.id === id
        ? { ...item, qty: Math.min(99, Math.max(1, item.qty + delta)) }
        : item
    ))
  }

  // ── Sauvegarde ────────────────────────────────────────────────────────────

  function handleSave() {
    setSubmitted(true)
    if (!name.trim() || cart.length === 0) return

    onSave({
      ...(isEdit && initialOrder?.id ? { id: initialOrder.id } : {}),
      channel: initialChannel ?? initialOrder?.channel ?? 'boutique',
      customer: { name: name.trim(), phone: phone.trim() || null },
      items: cart.map(item => ({
        productId: item.productId ?? null,
        label:     item.label,
        size:      item.size  ?? null,
        qty:       Math.max(1, Number(item.qty) || 1),
        unitPrice: item.unitPrice ?? null,
      })),
      totalPrice: finalTotal,
      pickupDate,
      pickupTime: pickupTime || null,
      paid,
      note: null,
    })
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <Modal size="xl" innerScroll onClose={onCancel}>

      <div className="nom-layout">

        {/* ══ COLONNE GAUCHE — grille produits ══ */}
        <div className="nom-left-col">
          <div className="nom-col-header">
            <span className="nom-col-title">
              {isEdit ? 'Modifier la commande' : 'Nouvelle commande'}
            </span>
            <span className="nom-col-date">{fmtDateLabel(pickupDate)}</span>
          </div>
          <ProductGrid products={activeProducts} onAdd={handleAdd} />
        </div>

        {/* ══ COLONNE DROITE — panier + infos ══ */}
        <div className="nom-right-col">

          {/* ── En-tête panier ── */}
          <div className="nom-cart-header">
            <span className="nom-cart-title">Panier</span>
            {cart.length > 0 && (
              <span className="nom-cart-badge">{cart.length}</span>
            )}
          </div>

          {/* ── Client ── */}
          <div className="nom-client-section">
            <div className={`nom-client-field${nameInvalid ? ' nom-field-invalid' : ''}`}>
              <label className="nom-field-label">Nom du client *</label>
              <input
                type="text"
                className="nom-field-input"
                placeholder="Nom du client"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="nom-client-field">
              <label className="nom-field-label">Téléphone</label>
              <input
                type="tel"
                className="nom-field-input"
                placeholder="06 00 00 00 00"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* ── Liste items panier ── */}
          <div className="nom-cart-list">
            {cart.length === 0 ? (
              <div className={`nom-cart-empty${cartInvalid ? ' nom-cart-empty--error' : ''}`}>
                {cartInvalid
                  ? 'Ajoutez au moins un produit.'
                  : "Tap sur un produit pour l'ajouter"}
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="nom-cart-row">
                  <div className="nom-cart-row-info">
                    <span className="nom-cart-row-name">{item.label}</span>
                    {item.size && (
                      <span className="nom-cart-row-size">{item.size}</span>
                    )}
                  </div>
                  <div className="nom-cart-row-right">
                    <div className="nom-cart-qty">
                      <button
                        type="button"
                        className="nom-cart-qty-btn"
                        onClick={() => updateQty(item.id, -1)}
                        disabled={item.qty <= 1}
                      >−</button>
                      <span className="nom-cart-qty-val">{item.qty}</span>
                      <button
                        type="button"
                        className="nom-cart-qty-btn"
                        onClick={() => updateQty(item.id, 1)}
                        disabled={item.qty >= 99}
                      >+</button>
                    </div>
                    {item.unitPrice != null && (
                      <span className="nom-cart-row-price">
                        {fmtPrice(item.unitPrice * item.qty)}
                      </span>
                    )}
                    <button
                      type="button"
                      className="nom-cart-row-remove"
                      onClick={() => removeFromCart(item.id)}
                      aria-label="Retirer du panier"
                    >×</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Total ── */}
          <div className="nom-total-bar">
            <span className="nom-total-label">Total</span>
            <div className="nom-total-input-wrap">
              <input
                type="number"
                className="nom-total-input"
                min="0"
                step="0.01"
                value={totalOverride}
                onChange={e => setTotalOverride(e.target.value)}
                placeholder="0,00"
              />
              <span className="nom-total-euro">€</span>
            </div>
          </div>

          {/* ── Retrait + paiement ── */}
          <div className="nom-order-details">
            <div className="nom-pickup-row">
              <div className="nom-client-field">
                <label className="nom-field-label">Retrait le</label>
                <input
                  type="date"
                  className="nom-field-input"
                  value={pickupDate}
                  onChange={e => setPickupDate(e.target.value)}
                />
              </div>
              <div className="nom-client-field">
                <label className="nom-field-label">À</label>
                <select
                  className="nom-field-input"
                  value={pickupTime}
                  onChange={e => setPickupTime(e.target.value)}
                >
                  <option value="">-- Heure --</option>
                  {PICKUP_SLOTS.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              className={`nom-paid-toggle${paid ? ' nom-paid-toggle--paid' : ' nom-paid-toggle--unpaid'}`}
              onClick={() => setPaid(v => !v)}
            >
              {paid ? 'Payée' : 'Non payée'}
            </button>
          </div>

          {/* ── Actions ── */}
          <div className="nom-actions">
            <Button variant="default" style={{ flex: 1 }} onClick={onCancel}>Annuler</Button>
            <Button variant="success" style={{ flex: 2 }} onClick={handleSave}>
              {isEdit ? 'Enregistrer les modifications' : 'Enregistrer'}
            </Button>
          </div>

        </div>
      </div>

    </Modal>
  )
}
