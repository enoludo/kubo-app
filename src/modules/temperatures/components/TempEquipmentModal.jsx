// ─── Modal création / édition d'un équipement ────────────────────────────────
import { useState } from 'react'
import Modal  from '../../../design-system/components/Modal/Modal'
import Button from '../../../design-system/components/Button/Button'
import { COLOR_PALETTE, FrigoIcon, FloconIcon } from '../utils/tempColors.jsx'
import RangeSlider from '../../../design-system/components/RangeSlider/RangeSlider'

const TYPE_OPTIONS = [
  { value: 'positif', label: 'Froid positif', Icon: FrigoIcon },
  { value: 'negatif', label: 'Froid négatif', Icon: FloconIcon },
]

const TYPE_DEFAULTS = {
  positif: { minTemp: 0,   maxTemp: 5,   rangeMin: -10, rangeMax: 20 },
  negatif: { minTemp: -25, maxTemp: -15, rangeMin: -40, rangeMax: 0  },
}


export default function TempEquipmentModal({ equipment, onSave, onArchive, onCancel }) {
  const isEdit = !!equipment

  const initialType = equipment?.type ?? 'positif'

  const [name,           setName]           = useState(equipment?.name       ?? '')
  const [type,           setType]           = useState(initialType)
  const [minTemp,        setMinTemp]        = useState(equipment?.minTemp    ?? TYPE_DEFAULTS[initialType].minTemp)
  const [maxTemp,        setMaxTemp]        = useState(equipment?.maxTemp    ?? TYPE_DEFAULTS[initialType].maxTemp)
  const [rangeMin,       setRangeMin]       = useState(TYPE_DEFAULTS[initialType].rangeMin)
  const [rangeMax,       setRangeMax]       = useState(TYPE_DEFAULTS[initialType].rangeMax)
  const [colorIndex,     setColorIndex]     = useState(equipment?.colorIndex ?? 0)
  const [confirmArchive, setConfirmArchive] = useState(false)

  const palette = COLOR_PALETTE[colorIndex] ?? COLOR_PALETTE[0]
  const isValid = name.trim() !== '' && minTemp < maxTemp

  function handleTypeSelect(value) {
    setType(value)
    const d = TYPE_DEFAULTS[value]
    setMinTemp(d.minTemp)
    setMaxTemp(d.maxTemp)
    setRangeMin(d.rangeMin)
    setRangeMax(d.rangeMax)
  }

  function handleSave() {
    if (!isValid) return
    onSave({ name: name.trim(), type, minTemp, maxTemp, colorIndex })
  }

  // ── Confirmation archivage ─────────────────────────────────────────────────

  if (confirmArchive) {
    return (
      <Modal onClose={onCancel}>
        <div className="modal-emp-form-title">Archiver {equipment.name} ?</div>
        <div className="archive-modal-body">
          Cet équipement n'apparaîtra plus dans le calendrier.
          Ses relevés historiques sont conservés.
        </div>
        <div className="modal-actions">
          <Button variant="default" style={{ flex: 1 }} onClick={() => setConfirmArchive(false)}>
            Retour
          </Button>
          <Button variant="danger" style={{ flex: 2 }} onClick={onArchive}>
            Archiver
          </Button>
        </div>
      </Modal>
    )
  }

  // ── Formulaire principal ───────────────────────────────────────────────────

  return (
    <Modal onClose={onCancel}>

      <div className="modal-emp-form-title">
        {isEdit ? `Modifier ${equipment.name}` : 'Nouvel équipement'}
      </div>

      <div className="modal-form-fields">

        {/* Nom */}
        <div className="modal-field-full">
          <label>Nom de l'équipement</label>
          <input
            type="text"
            placeholder="ex : Chambre froide"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Type de froid */}
        <div className="modal-field-full">
          <label>Type de froid</label>
          <div className="modal-type-selector">
            {TYPE_OPTIONS.map(({ value, label, Icon }) => (
              <button
                key={value}
                className={`modal-type-btn${type === value ? ' active' : ''}`}
                onClick={() => handleTypeSelect(value)}
              >
                <span className="modal-type-icon"><Icon /></span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Plage de température */}
        <div className="modal-field-full">
          <label>Plage de température</label>
          <RangeSlider
            min={rangeMin}
            max={rangeMax}
            valueMin={minTemp}
            valueMax={maxTemp}
            onChange={(min, max) => { setMinTemp(min); setMaxTemp(max) }}
            color={palette.c300}
            step={1}
          />
        </div>

        {/* Couleur */}
        <div className="modal-field-full">
          <label>Couleur</label>
          <div className="modal-color-grid">
            {COLOR_PALETTE.map((c, i) => (
              <button
                key={c.key}
                className={`color-swatch${colorIndex === i ? ' selected' : ''}`}
                style={{ background: c.c300 }}
                onClick={() => setColorIndex(i)}
                aria-label={c.key}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Actions */}
      <div className="modal-actions">
        {isEdit && (
          <Button
            variant="default"
            onClick={() => setConfirmArchive(true)}
            style={{ marginRight: 'auto' }}
          >
            Archiver
          </Button>
        )}
        <Button variant="default" style={{ flex: 1 }} onClick={onCancel}>
          Annuler
        </Button>
        <Button variant="success" style={{ flex: 2 }} onClick={handleSave} disabled={!isValid}>
          {isEdit ? 'Enregistrer' : 'Ajouter'}
        </Button>
      </div>

    </Modal>
  )
}
