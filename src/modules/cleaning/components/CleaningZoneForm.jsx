// ─── Formulaire création / édition de zone de nettoyage ──────────────────────
import { useState } from 'react'
import Modal  from '../../../design-system/components/Modal/Modal'
import Button from '../../../design-system/components/Button/Button'
import { COLOR_PALETTE } from '../utils/cleaningZones.jsx'

const FREQUENCIES = [
  { value: 'daily',      label: 'Quotidienne' },
  { value: 'weekly',     label: 'Hebdomadaire' },
  { value: 'regularly',  label: 'Régulièrement' },
  { value: 'monthly',    label: 'Mensuelle' },
  { value: 'quarterly',  label: 'Trimestrielle' },
  { value: 'semiannual', label: 'Semestrielle' },
]

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

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

function emptyTask() {
  return {
    _key:         crypto.randomUUID(),
    name:         '',
    frequency:    'daily',
    dayOfWeek:    1,
    cycleStart:   1,
    protocol:     [{ text: '', product: '' }],
    duration_min: 15,
    active:       true,
  }
}

function normalizeProtocol(protocol) {
  if (!protocol?.length) return [{ text: '', product: '' }]
  return protocol.map(s => typeof s === 'string' ? { text: s, product: '' } : s)
}

function TaskForm({ task, index, onChange, onRemove }) {
  function set(key, value) {
    onChange({ ...task, [key]: value })
  }

  function updateStep(i, field, value) {
    const protocol = task.protocol.map((s, idx) => idx === i ? { ...s, [field]: value } : s)
    onChange({ ...task, protocol })
  }

  function addStep() {
    onChange({ ...task, protocol: [...task.protocol, { text: '', product: '' }] })
  }

  function removeStep(i) {
    onChange({ ...task, protocol: task.protocol.filter((_, idx) => idx !== i) })
  }

  function stepDuration(delta) {
    set('duration_min', Math.min(DURATION_MAX, Math.max(DURATION_MIN, task.duration_min + delta)))
  }

  return (
    <div className="czf-task-item">
      <div className="czf-task-header">
        <span className="czf-task-num">Tâche {index + 1}</span>
        <button
          type="button"
          className="czf-task-remove"
          onClick={onRemove}
          aria-label="Supprimer cette tâche"
        >×</button>
      </div>

      <div className="modal-form-fields">

        {/* Nom */}
        <div className="modal-field-full">
          <label>Nom *</label>
          <input
            type="text"
            placeholder="ex : Désinfecter le pétrin"
            value={task.name}
            onChange={e => set('name', e.target.value)}
          />
        </div>

        {/* Fréquence */}
        <div className="nom-row-2col">
          <div className="modal-field-full">
            <label>Fréquence</label>
            <select value={task.frequency} onChange={e => set('frequency', e.target.value)}>
              {FREQUENCIES.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          {task.frequency === 'weekly' && (
            <div className="modal-field-full">
              <label>Jour</label>
              <select value={task.dayOfWeek} onChange={e => set('dayOfWeek', Number(e.target.value))}>
                {DAYS_OF_WEEK.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          )}
          {task.frequency === 'semiannual' && (
            <div className="modal-field-full">
              <label>Début du cycle</label>
              <select value={task.cycleStart ?? 1} onChange={e => set('cycleStart', Number(e.target.value))}>
                {MONTHS_FR.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Protocole */}
        <div className="modal-field-full">
          <label>Protocole</label>
          <div className="cln-protocol-steps">
            {task.protocol.map((step, i) => (
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
                  {task.protocol.length > 1 && (
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
              + Étape
            </button>
          </div>
        </div>

        {/* Durée + actif */}
        <div className="czf-task-bottom">
          <div className="modal-field-full">
            <label>Durée</label>
            <div className="qty-stepper">
              <button
                type="button"
                className="qty-btn"
                onClick={() => stepDuration(-DURATION_STEP)}
                disabled={task.duration_min <= DURATION_MIN}
              >−</button>
              <span className="qty-value cln-duration-value">{task.duration_min} min</span>
              <button
                type="button"
                className="qty-btn"
                onClick={() => stepDuration(DURATION_STEP)}
                disabled={task.duration_min >= DURATION_MAX}
              >+</button>
            </div>
          </div>
          <label className="nom-checkbox-label czf-active-label">
            <input
              type="checkbox"
              checked={task.active}
              onChange={e => set('active', e.target.checked)}
            />
            Active
          </label>
        </div>

      </div>
    </div>
  )
}

export default function CleaningZoneForm({ zone, tasks: initialTasks, onSave, onDelete, onClose }) {
  const isEdit = !!zone

  const [name,      setName]      = useState(zone?.name  ?? '')
  const [color,     setColor]     = useState(zone?.color ?? 'blue')
  const [tasks,     setTasks]     = useState(() => {
    if (isEdit && initialTasks?.length > 0) {
      return initialTasks.map(t => ({
        ...t,
        _key:       t.id ?? crypto.randomUUID(),
        protocol:   normalizeProtocol(t.protocol),
        cycleStart: t.cycleStart ?? 1,
      }))
    }
    return [emptyTask()]
  })
  const [submitted,  setSubmitted]  = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const nameInvalid = submitted && !name.trim()

  function updateTask(index, updated) {
    setTasks(prev => prev.map((t, i) => i === index ? updated : t))
  }

  function addTask() {
    setTasks(prev => [...prev, emptyTask()])
  }

  function removeTask(index) {
    setTasks(prev => prev.filter((_, i) => i !== index))
  }

  function handleSave() {
    setSubmitted(true)
    if (!name.trim()) return

    const validTasks = tasks.filter(t => t.name.trim())
    console.log('[cln] handleSave déclenché', { name, color, validTasks })
    onSave(
      { name: name.trim(), color },
      validTasks.map(t => ({
        ...(t.id ? { id: t.id } : {}),
        name:         t.name.trim(),
        frequency:    t.frequency,
        dayOfWeek:    t.frequency === 'weekly'     ? t.dayOfWeek  : null,
        cycleStart:   t.frequency === 'semiannual' ? t.cycleStart : null,
        protocol:     t.protocol.filter(s => s.text.trim()).map(s => ({
          text:    s.text.trim(),
          product: s.product.trim() || null,
        })),
        duration_min: t.duration_min,
        active:       t.active,
      }))
    )
  }

  // ── Confirmation suppression zone ──────────────────────────────────────────

  if (confirmDel) {
    return (
      <Modal onClose={onClose}>
        <div className="modal-emp-form-title">Supprimer cette zone ?</div>
        <div className="cln-confirm-body">
          Toutes les tâches et relevés associés seront supprimés. Cette action est irréversible.
        </div>
        <div className="modal-actions">
          <Button variant="default" style={{ flex: 1 }} onClick={() => setConfirmDel(false)}>
            Retour
          </Button>
          <Button variant="danger" style={{ flex: 2 }} onClick={() => onDelete(zone.id)}>
            Supprimer la zone
          </Button>
        </div>
      </Modal>
    )
  }

  // ── Formulaire principal ───────────────────────────────────────────────────

  return (
    <Modal size="lg" scrollBody onClose={onClose}>

      <div className="modal-emp-form-title">
        {isEdit ? 'Modifier la zone' : 'Nouvelle zone'}
      </div>

      <div className="modal-form-fields">

        {/* Nom de la zone */}
        <div className={`modal-field-full${nameInvalid ? ' nom-field-invalid' : ''}`}>
          <label>Nom de la zone *</label>
          <input
            type="text"
            placeholder="ex : Laboratoire"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Couleur */}
        <div className="modal-field-full">
          <label>Couleur</label>
          <div className="czf-color-palette">
            {COLOR_PALETTE.map(c => (
              <button
                key={c.key}
                type="button"
                className={`czf-color-swatch${color === c.key ? ' czf-color-swatch--selected' : ''}`}
                style={{ background: c.token }}
                onClick={() => setColor(c.key)}
                aria-label={c.key}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Section tâches */}
      <div className="czf-tasks-section">
        <div className="czf-tasks-label">Tâches</div>
        <div className="czf-tasks-list">
          {tasks.map((task, i) => (
            <TaskForm
              key={task._key}
              task={task}
              index={i}
              onChange={updated => updateTask(i, updated)}
              onRemove={() => removeTask(i)}
            />
          ))}
        </div>
        <button
          type="button"
          className="add-trigger add-trigger--labeled czf-add-task-btn"
          onClick={addTask}
        >
          + Ajouter une tâche
        </button>
      </div>

      {/* Actions */}
      <div className="modal-actions">
        {isEdit && (
          <Button
            variant="danger"
            onClick={() => setConfirmDel(true)}
            style={{ marginRight: 'auto' }}
          >
            Supprimer
          </Button>
        )}
        <Button variant="default" style={{ flex: 1 }} onClick={onClose}>Annuler</Button>
        <Button variant="success" style={{ flex: 2 }} onClick={handleSave}>
          {isEdit ? 'Enregistrer' : 'Créer la zone'}
        </Button>
      </div>

    </Modal>
  )
}
