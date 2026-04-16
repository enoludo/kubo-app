// ─── Formulaire création / édition d'une pièce ───────────────────────────────
// Hiérarchie : Pièce > Zone > Sous-zone > Tâche
import { useState } from 'react'
import Modal  from '../../../design-system/components/Modal/Modal'
import Button from '../../../design-system/components/Button/Button'
import Toggle from '../../../design-system/components/Toggle/Toggle'
import '../../../design-system/components/Toggle/Toggle.css'
import { COLOR_PALETTE } from '../utils/cleaningZones.jsx'

const FREQUENCIES = [
  { value: 'daily',      label: 'Quotidien' },
  { value: 'weekly',     label: 'Hebdomadaire' },
  { value: 'monthly',    label: 'Mensuel' },
  { value: 'quarterly',  label: 'Trimestriel' },
  { value: 'semiannual', label: 'Semestriel' },
]

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
]

const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
]

function emptyTask() {
  return {
    _key:       crypto.randomUUID(),
    id:         null,
    name:       '',
    product:    '',
    dosage:     '',
    frequency:  'daily',
    dayOfWeek:  1,
    cycleStart: 1,
    active:     true,
  }
}

function emptySubzone() {
  return {
    _key:   crypto.randomUUID(),
    id:     null,
    name:   '',
    active: true,
    tasks:  [],
  }
}

function emptyZone() {
  return {
    _key:     crypto.randomUUID(),
    id:       null,
    name:     '',
    active:   true,
    open:     true,
    tasks:    [],
    subzones: [],
  }
}

// ── TaskRow ───────────────────────────────────────────────────────────────────

function TaskRow({ task, onChange, onRemove }) {
  function set(key, value) { onChange({ ...task, [key]: value }) }

  return (
    <div className="crf-task-block">
      <div className="crf-task-header">
        <input
          type="text"
          className="crf-task-name"
          placeholder="Nom de la tâche *"
          value={task.name}
          onChange={e => set('name', e.target.value)}
        />
        <button type="button" className="crf-remove-btn" onClick={onRemove} aria-label="Supprimer la tâche">×</button>
      </div>

      <div className="crf-task-fields">

        <div className="crf-row-2col">
          <input
            type="text"
            className="crf-input"
            placeholder="Produit (optionnel)"
            value={task.product}
            onChange={e => set('product', e.target.value)}
          />
          <input
            type="text"
            className="crf-input"
            placeholder="Dosage (optionnel)"
            value={task.dosage}
            onChange={e => set('dosage', e.target.value)}
          />
        </div>

        <div className="crf-row-2col">
          <select
            className="crf-input"
            value={task.frequency}
            onChange={e => set('frequency', e.target.value)}
          >
            {FREQUENCIES.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          {task.frequency === 'weekly' && (
            <select
              className="crf-input"
              value={task.dayOfWeek}
              onChange={e => set('dayOfWeek', Number(e.target.value))}
            >
              {DAYS_OF_WEEK.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          )}

          {task.frequency === 'semiannual' && (
            <select
              className="crf-input"
              value={task.cycleStart}
              onChange={e => set('cycleStart', Number(e.target.value))}
            >
              {MONTHS_FR.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          )}
        </div>

        <Toggle
          checked={task.active}
          onChange={val => set('active', val)}
          label="Tâche active"
        />

      </div>
    </div>
  )
}

// ── SubzoneBlock ──────────────────────────────────────────────────────────────

function SubzoneBlock({ subzone, onChange, onRemove }) {
  function set(key, v) { onChange({ ...subzone, [key]: v }) }
  function addTask()              { set('tasks', [...subzone.tasks, emptyTask()]) }
  function updateTask(i, updated) { set('tasks', subzone.tasks.map((t, j) => j === i ? updated : t)) }
  function removeTask(i)          { set('tasks', subzone.tasks.filter((_, j) => j !== i)) }

  return (
    <div className="crf-subzone-block">
      <div className="crf-subzone-header">
        <input
          type="text"
          className="crf-zone-name"
          placeholder="Nom de la sous-zone"
          value={subzone.name}
          onChange={e => set('name', e.target.value)}
        />
        <button type="button" className="crf-remove-btn" onClick={onRemove} aria-label="Supprimer la sous-zone">×</button>
      </div>

      <div className="crf-tasks-list">
        {subzone.tasks.map((t, i) => (
          <TaskRow
            key={t._key}
            task={t}
            onChange={updated => updateTask(i, updated)}
            onRemove={() => removeTask(i)}
          />
        ))}
        <button
          type="button"
          className="add-trigger add-trigger--labeled crf-add-btn"
          onClick={addTask}
        >
          + Tâche
        </button>
      </div>
    </div>
  )
}

// ── ZoneBlock ─────────────────────────────────────────────────────────────────

function ZoneBlock({ zone, onChange, onRemove }) {
  function set(key, v) { onChange({ ...zone, [key]: v }) }
  function addTask()                   { set('tasks', [...zone.tasks, emptyTask()]) }
  function updateTask(i, updated)      { set('tasks', zone.tasks.map((t, j) => j === i ? updated : t)) }
  function removeTask(i)               { set('tasks', zone.tasks.filter((_, j) => j !== i)) }
  function addSubzone()                { set('subzones', [...zone.subzones, emptySubzone()]) }
  function updateSubzone(i, updated)   { set('subzones', zone.subzones.map((s, j) => j === i ? updated : s)) }
  function removeSubzone(i)            { set('subzones', zone.subzones.filter((_, j) => j !== i)) }

  const taskCount = zone.tasks.length + zone.subzones.reduce((n, sz) => n + sz.tasks.length, 0)

  return (
    <div className={`crf-zone-block${zone.open ? ' crf-zone-block--open' : ''}`}>

      <div className="crf-zone-header">
        <button
          type="button"
          className="crf-zone-chevron"
          onClick={() => set('open', !zone.open)}
          aria-expanded={zone.open}
          aria-label={zone.open ? 'Réduire' : 'Développer'}
        >
          {zone.open ? '▴' : '▾'}
        </button>

        <input
          type="text"
          className="crf-zone-name"
          placeholder="Nom de la zone"
          value={zone.name}
          onChange={e => set('name', e.target.value)}
        />

        {!zone.open && taskCount > 0 && (
          <span className="crf-zone-count">{taskCount} tâche{taskCount !== 1 ? 's' : ''}</span>
        )}

        <button type="button" className="crf-remove-btn" onClick={onRemove} aria-label="Supprimer la zone">×</button>
      </div>

      {zone.open && (
        <div className="crf-zone-body">

          <div className="crf-tasks-list">
            {zone.tasks.map((t, i) => (
              <TaskRow
                key={t._key}
                task={t}
                onChange={updated => updateTask(i, updated)}
                onRemove={() => removeTask(i)}
              />
            ))}
            <button
              type="button"
              className="add-trigger add-trigger--labeled crf-add-btn"
              onClick={addTask}
            >
              + Tâche
            </button>
          </div>

          {zone.subzones.length > 0 && (
            <div className="crf-subzones-list">
              {zone.subzones.map((sz, i) => (
                <SubzoneBlock
                  key={sz._key}
                  subzone={sz}
                  onChange={updated => updateSubzone(i, updated)}
                  onRemove={() => removeSubzone(i)}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            className="add-trigger add-trigger--labeled crf-add-btn crf-add-subzone"
            onClick={addSubzone}
          >
            + Sous-zone
          </button>

        </div>
      )}
    </div>
  )
}

// ── Formulaire principal ──────────────────────────────────────────────────────

export default function CleaningRoomForm({
  room,
  zones: initialZones,
  subzones: initialSubzones,
  tasks: initialTasks,
  onSave,
  onDelete,
  onClose,
}) {
  const isEdit = !!room

  const [name,       setName]       = useState(room?.name  ?? '')
  const [color,      setColor]      = useState(room?.color ?? 'blue')
  const [zones,      setZones]      = useState(() => buildInitialZones())
  const [submitted,  setSubmitted]  = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const nameInvalid = submitted && !name.trim()

  function buildInitialZones() {
    if (!isEdit || !initialZones?.length) return []
    return initialZones.map(z => ({
      _key:     z.id,
      id:       z.id,
      name:     z.name,
      active:   z.active ?? true,
      open:     false,
      tasks: (initialTasks ?? [])
        .filter(t => t.zoneId === z.id)
        .map(t => ({
          _key:       t.id,
          id:         t.id,
          name:       t.name,
          product:    t.product    ?? '',
          dosage:     t.dosage     ?? '',
          frequency:  t.frequency  ?? 'daily',
          dayOfWeek:  t.dayOfWeek  ?? 1,
          cycleStart: t.cycleStart ?? 1,
          active:     t.active     ?? true,
        })),
      subzones: (initialSubzones ?? [])
        .filter(s => s.zoneId === z.id)
        .map(s => ({
          _key:   s.id,
          id:     s.id,
          name:   s.name,
          active: s.active ?? true,
          tasks: (initialTasks ?? [])
            .filter(t => t.subzoneId === s.id)
            .map(t => ({
              _key:       t.id,
              id:         t.id,
              name:       t.name,
              product:    t.product    ?? '',
              dosage:     t.dosage     ?? '',
              frequency:  t.frequency  ?? 'daily',
              dayOfWeek:  t.dayOfWeek  ?? 1,
              cycleStart: t.cycleStart ?? 1,
              active:     t.active     ?? true,
            })),
        })),
    }))
  }

  function addZone()                    { setZones(prev => [...prev, emptyZone()]) }
  function updateZone(i, updated)       { setZones(prev => prev.map((z, j) => j === i ? updated : z)) }
  function removeZone(i)                { setZones(prev => prev.filter((_, j) => j !== i)) }

  function handleSave() {
    setSubmitted(true)
    if (!name.trim()) return
    onSave({ name: name.trim(), color }, zones)
  }

  // ── Confirmation suppression ──────────────────────────────────────────────

  if (confirmDel) {
    return (
      <Modal onClose={onClose}>
        <div className="modal-emp-form-title">Supprimer cette pièce ?</div>
        <div className="cln-confirm-body">
          Toutes les zones, tâches et relevés associés seront supprimés. Cette action est irréversible.
        </div>
        <div className="modal-actions">
          <Button variant="default" style={{ flex: 1 }} onClick={() => setConfirmDel(false)}>Retour</Button>
          <Button variant="danger"  style={{ flex: 2 }} onClick={() => onDelete(room.id)}>Supprimer la pièce</Button>
        </div>
      </Modal>
    )
  }

  // ── Formulaire ────────────────────────────────────────────────────────────

  return (
    <Modal size="lg" scrollBody onClose={onClose}>

      <div className="modal-emp-form-title">
        {isEdit ? 'Modifier la pièce' : 'Nouvelle pièce'}
      </div>

      <div className="modal-form-fields">

        <div className={`modal-field-full${nameInvalid ? ' nom-field-invalid' : ''}`}>
          <label>Nom de la pièce *</label>
          <input
            type="text"
            placeholder="ex : Laboratoire"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

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

      {/* ── Section zones ── */}
      <div className="crf-zones-section">
        <div className="crf-section-header">
          <span className="czf-tasks-label">Zones</span>
          <button
            type="button"
            className="add-trigger add-trigger--labeled"
            onClick={addZone}
          >
            + Ajouter une zone
          </button>
        </div>

        {zones.length === 0 && (
          <div className="cln-modal-empty">
            Aucune zone — ajoutez-en une pour définir les tâches.
          </div>
        )}

        <div className="crf-zones-list">
          {zones.map((zone, i) => (
            <ZoneBlock
              key={zone._key}
              zone={zone}
              onChange={updated => updateZone(i, updated)}
              onRemove={() => removeZone(i)}
            />
          ))}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="modal-actions">
        {isEdit && (
          <Button variant="danger" onClick={() => setConfirmDel(true)} style={{ marginRight: 'auto' }}>
            Supprimer
          </Button>
        )}
        <Button variant="default" style={{ flex: 1 }} onClick={onClose}>Annuler</Button>
        <Button variant="success" style={{ flex: 2 }} onClick={handleSave}>
          {isEdit ? 'Enregistrer' : 'Créer la pièce'}
        </Button>
      </div>

    </Modal>
  )
}
