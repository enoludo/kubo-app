// ─── Modale nouveau brunch (samedi) ───────────────────────────────────────────
import { useState, useEffect } from 'react'
import Modal from '../../design-system/components/Modal/Modal'
import Button from '../../design-system/components/Button/Button'
import { fetchBrunchPrices } from '../../services/webflowAdapter'

const BRUNCH_TIMES = ['10h30', '12h00', '13h30']

function fmtDateLabel(dateStr) {
  const s = new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function fmtPrice(p) {
  return p.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function BrunchModal({ onSave, onCancel, initialDate }) {
  const [name,        setName]        = useState('')
  const [phone,       setPhone]       = useState('')
  const [nbPersons,   setNbPersons]   = useState(2)
  const [time,        setTime]        = useState('10h30')
  const [paid,        setPaid]        = useState(false)
  const [submitted,   setSubmitted]   = useState(false)
  const [brunchPrices, setBrunchPrices] = useState({})

  useEffect(() => {
    fetchBrunchPrices().then(setBrunchPrices).catch(() => {})
  }, [])

  const unitPrice  = brunchPrices[time] ?? null
  const totalPrice = unitPrice != null ? unitPrice * Math.max(1, nbPersons) : 0

  const nameInvalid = submitted && !name.trim()

  function handleSave() {
    setSubmitted(true)
    if (!name.trim()) return

    onSave({
      channel:     'brunch',
      customer:    { name: name.trim(), phone: phone.trim() || null },
      items:       [{ label: 'Brunch', size: null, qty: Math.max(1, nbPersons), unitPrice }],
      totalPrice,
      pickupDate:  initialDate,
      pickupTime:  time,
      paid,
      note:        null,
    })
  }

  return (
    <Modal onClose={onCancel} scrollBody>

        <div className="modal-emp-form-title">Nouveau brunch</div>
        <div className="modal-date">{fmtDateLabel(initialDate)}</div>

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

          {/* Nombre de personnes + Heure */}
          <div className="nom-row-2col">
            <div className="modal-field-full">
              <label>Nombre de personnes</label>
              <input
                type="number"
                min="1"
                placeholder="Nb de personnes"
                value={nbPersons}
                onChange={e => setNbPersons(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <div className="modal-field-full">
              <label>Heure</label>
              <select value={time} onChange={e => setTime(e.target.value)}>
                {BRUNCH_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Prix */}
          {unitPrice != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) var(--space-md)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-md)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{fmtPrice(unitPrice)} / pers</span>
              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Total : {fmtPrice(totalPrice)}</span>
            </div>
          )}

          {/* Payé */}
          <label className="nom-checkbox-label">
            <input
              type="checkbox"
              checked={paid}
              onChange={e => setPaid(e.target.checked)}
            />
            Brunch payé
          </label>

        </div>

        {/* Actions */}
        <div className="modal-actions" style={{ marginTop: 'var(--space-lg)' }}>
          <Button variant="default" style={{ flex: 1 }} onClick={onCancel}>Annuler</Button>
          <Button variant="success" style={{ flex: 2 }} onClick={handleSave}>Enregistrer</Button>
        </div>

    </Modal>
  )
}
