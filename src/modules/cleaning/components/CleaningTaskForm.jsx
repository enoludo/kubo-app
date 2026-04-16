// ─── Formulaire création / édition d'une tâche de nettoyage ──────────────────
import { useState } from 'react'
import Modal  from '../../../design-system/components/Modal/Modal'
import Button  from '../../../design-system/components/Button/Button'
import Toggle  from '../../../design-system/components/Toggle/Toggle'
import '../../../design-system/components/Toggle/Toggle.css'
import { resolveZone, INITIAL_ZONES } from '../utils/cleaningZones.jsx'

// CleaningTaskForm attend une prop optionnelle `zones` (tableau raw depuis useCleaning).
// Si absente, repli sur INITIAL_ZONES.

const FREQUENCIES = [
  { value: 'daily',       label: 'Quotidienne' },
  { value: 'weekly',      label: 'Hebdomadaire' },
  { value: 'regularly',   label: 'Régulièrement' },
  { value: 'monthly',     label: 'Mensuelle' },
  { value: 'quarterly',   label: 'Trimestrielle' },
  { value: 'semiannual',  label: 'Semestrielle' },
]

// Ordre lundi-dimanche pour l'affichage (dayOfWeek suit getDay() : 0=dim)
const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
]

const DURATION_STEP = 5
const DURATION_MIN  = 5
const DURATION_MAX  = 240

export default function CleaningTaskForm({ task, zones: zonesProp, onSave, onDelete, onCancel }) {
  const resolvedZones = (zonesProp ?? INITIAL_ZONES).map(resolveZone)
  const isEdit = !!task

  const [name,        setName]        = useState(task?.name        ?? '')
  const [zone,        setZone]        = useState(task?.zone        ?? 'laboratoire')
  const [frequency,   setFrequency]   = useState(task?.frequency   ?? 'daily')
  const [dayOfWeek,   setDayOfWeek]   = useState(task?.dayOfWeek   ?? 1)
  const [protocol,    setProtocol]    = useState(() => {
    const raw = task?.protocol ?? []
    if (!raw.length) return [{ text: '', product: '' }]
    return raw.map(s => typeof s === 'string' ? { text: s, product: '' } : s)
  })
  const [duration,    setDuration]    = useState(task?.duration_min ?? 15)
  const [cycleStart,  setCycleStart]  = useState(task?.cycleStart  ?? 1)
  const [active,      setActive]      = useState(task?.active      ?? true)
  const [submitted,   setSubmitted]   = useState(false)
  const [confirmDel,  setConfirmDel]  = useState(false)

  const nameInvalid = submitted && !name.trim()

  // ── Protocole ──────────────────────────────────────────────────────────────

  function updateStep(i, field, value) {
    setProtocol(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  function addStep() {
    setProtocol(prev => [...prev, { text: '', product: '' }])
  }

  function removeStep(i) {
    setProtocol(prev => prev.filter((_, idx) => idx !== i))
  }

  // ── Durée stepper ──────────────────────────────────────────────────────────

  function stepDuration(delta) {
    setDuration(d => Math.min(DURATION_MAX, Math.max(DURATION_MIN, d + delta)))
  }

  // ── Sauvegarde ─────────────────────────────────────────────────────────────

  function handleSave() {
    setSubmitted(true)
    if (!name.trim()) return

    onSave({
      ...(isEdit && task?.id ? { id: task.id } : {}),
      name:         name.trim(),
      zone,
      frequency,
      dayOfWeek:    frequency === 'weekly' ? dayOfWeek : null,
      cycleStart:   frequency === 'semiannual' ? cycleStart : null,
      protocol:     protocol.filter(s => s.text.trim()).map(s => ({
        text:    s.text.trim(),
        product: s.product.trim() || null,
      })),
      duration_min: duration,
      active,
    })
  }

  // ── Confirmation suppression ───────────────────────────────────────────────

  if (confirmDel) {
    return (
      <Modal onClose={onCancel}>
        <div className="modal-emp-form-title">Supprimer cette tâche ?</div>
        <div className="cln-confirm-body">
          Les relevés associés seront également supprimés. Cette action est irréversible.
        </div>
        <div className="modal-actions">
          <Button variant="default" style={{ flex: 1 }} onClick={() => setConfirmDel(false)}>
            Retour
          </Button>
          <Button variant="danger" style={{ flex: 2 }} onClick={() => onDelete(task.id)}>
            Supprimer
          </Button>
        </div>
      </Modal>
    )
  }

  // ── Formulaire principal ───────────────────────────────────────────────────

  return (
    <Modal size="lg" scrollBody onClose={onCancel}>

      <div className="modal-emp-form-title">
        {isEdit ? 'Modifier la tâche' : 'Nouvelle tâche'}
      </div>

      <div className="modal-form-fields">

        {/* Nom */}
        <div className={`modal-field-full${nameInvalid ? ' nom-field-invalid' : ''}`}>
          <label>Nom de la tâche *</label>
          <input
            type="text"
            placeholder="ex : Désinfecter le pétrin"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Zone + Fréquence */}
        <div className="nom-row-2col">
          <div className="modal-field-full">
            <label>Zone</label>
            <select value={zone} onChange={e => setZone(e.target.value)}>
              {resolvedZones.map(z => (
                <option key={z.id} value={z.id}>{z.label}</option>
              ))}
            </select>
          </div>
          <div className="modal-field-full">
            <label>Fréquence</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value)}>
              {FREQUENCIES.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Jour de la semaine — uniquement si hebdomadaire */}
        {frequency === 'weekly' && (
          <div className="modal-field-full">
            <label>Jour de la semaine</label>
            <select value={dayOfWeek} onChange={e => setDayOfWeek(Number(e.target.value))}>
              {DAYS_OF_WEEK.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Mois de début de cycle — uniquement si semestrielle */}
        {frequency === 'semiannual' && (
          <div className="modal-field-full">
            <label>Début du cycle</label>
            <select value={cycleStart} onChange={e => setCycleStart(Number(e.target.value))}>
              {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
                .map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
            </select>
          </div>
        )}

        {/* Protocole */}
        <div className="modal-field-full">
          <label>Protocole</label>
          <div className="cln-protocol-steps">
            {protocol.map((step, i) => (
              <div key={i} className="cln-step-block">
                <div className="cln-step-row">
                  <span className="cln-step-num">{i + 1}.</span>
                  <input
                    type="text"
                    className="cln-step-input"
                    placeholder={`Étape ${i + 1}`}
                    value={step.text}
                    onChange={e => updateStep(i, 'text', e.target.value)}
                  />
                  {protocol.length > 1 && (
                    <button
                      type="button"
                      className="cln-step-remove"
                      onClick={() => removeStep(i)}
                      aria-label="Supprimer cette étape"
                    >×</button>
                  )}
                </div>
                <input
                  type="text"
                  className="cln-step-product"
                  placeholder="Produit & dosage (optionnel)"
                  value={step.product}
                  onChange={e => updateStep(i, 'product', e.target.value)}
                />
              </div>
            ))}
            <button
              type="button"
              className="cln-step-add add-trigger add-trigger--labeled"
              onClick={addStep}
            >
              + Ajouter une étape
            </button>
          </div>
        </div>

        {/* Durée (stepper) */}
        <div className="modal-field-full">
          <label>Durée estimée</label>
          <div className="cln-duration-row">
            <div className="qty-stepper">
              <button
                type="button"
                className="qty-btn"
                onClick={() => stepDuration(-DURATION_STEP)}
                disabled={duration <= DURATION_MIN}
              >−</button>
              <span className="qty-value cln-duration-value">{duration} min</span>
              <button
                type="button"
                className="qty-btn"
                onClick={() => stepDuration(DURATION_STEP)}
                disabled={duration >= DURATION_MAX}
              >+</button>
            </div>
          </div>
        </div>

        {/* Actif */}
        <Toggle
          checked={active}
          onChange={setActive}
          label="Tâche active"
        />

      </div>

      {/* Actions */}
      <div className="modal-actions" style={{ marginTop: 'var(--space-lg)' }}>
        {isEdit && (
          <Button
            variant="danger"
            onClick={() => setConfirmDel(true)}
            style={{ marginRight: 'auto' }}
          >
            Supprimer
          </Button>
        )}
        <Button variant="default" style={{ flex: 1 }} onClick={onCancel}>Annuler</Button>
        <Button variant="success" style={{ flex: 2 }} onClick={handleSave}>
          {isEdit ? 'Enregistrer' : 'Créer la tâche'}
        </Button>
      </div>

    </Modal>
  )
}
