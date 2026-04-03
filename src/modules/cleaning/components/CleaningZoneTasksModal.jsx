// ─── Modal gestion des tâches d'une zone ──────────────────────────────────────
import { useState } from 'react'
import Modal  from '../../../design-system/components/Modal/Modal'
import Button from '../../../design-system/components/Button/Button'

const FREQ_LABELS = {
  daily:     'Quotidien',
  weekly:    'Hebdo',
  monthly:   'Mensuel',
  quarterly: 'Trimestriel',
}

export default function CleaningZoneTasksModal({
  zone,
  tasks,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
  onClose,
}) {
  const [mode,     setMode]     = useState('view')   // 'view' | 'edit'
  const [editRows, setEditRows] = useState([])

  // ── Transition vers l'édition ─────────────────────────────────────────────

  function enterEdit() {
    setEditRows(tasks.map(t => ({
      id:         t.id,
      name:       t.name,
      frequency:  t.frequency,
      active:     t.active,
      toDelete:   false,
      confirmDel: false,
    })))
    setMode('edit')
  }

  function cancelEdit() {
    setMode('view')
    setEditRows([])
  }

  // ── Sauvegarde ────────────────────────────────────────────────────────────

  function saveEdit() {
    editRows.filter(r => r.toDelete && r.id).forEach(r => onDeleteTask(r.id))

    editRows
      .filter(r => !r.toDelete && r.id)
      .forEach(r => {
        const original = tasks.find(t => t.id === r.id)
        if (original && r.name.trim() && r.name.trim() !== original.name) {
          onUpdateTask(r.id, { name: r.name.trim() })
        }
      })

    editRows
      .filter(r => !r.id && !r.toDelete && r.name.trim())
      .forEach(r => onAddTask({ name: r.name.trim(), zone: zone.id, frequency: 'daily' }))

    setMode('view')
    setEditRows([])
  }

  // ── Mutations édition ─────────────────────────────────────────────────────

  function updateRowName(idx, value) {
    setEditRows(prev => prev.map((r, i) => i === idx ? { ...r, name: value } : r))
  }

  function toggleConfirmDel(idx) {
    setEditRows(prev => prev.map((r, i) => i === idx ? { ...r, confirmDel: !r.confirmDel } : r))
  }

  function confirmDelete(idx) {
    setEditRows(prev => prev.map((r, i) => i === idx ? { ...r, toDelete: true, confirmDel: false } : r))
  }

  function addRow() {
    setEditRows(prev => [...prev, {
      id: null, name: '', frequency: 'daily', active: true, toDelete: false, confirmDel: false,
    }])
  }

  // ── Mode consultation ─────────────────────────────────────────────────────

  if (mode === 'view') {
    return (
      <Modal size="lg" scrollBody onClose={onClose}>

        <div className="cln-zone-modal-header">
          <span
            className="cln-modal-zone-badge"
            style={{ background: zone.bgToken, color: zone.token }}
          >
            {zone.icon}
            {zone.label}
          </span>
          <span className="cln-zone-modal-title">Tâches</span>
        </div>

        {tasks.length === 0 ? (
          <div className="cln-modal-empty">Aucune tâche pour cette zone.</div>
        ) : (
          <div className="cln-zone-task-list">
            {tasks.map(task => (
              <div
                key={task.id}
                className={`cln-zone-task-row${!task.active ? ' cln-zone-task-row--inactive' : ''}`}
              >
                <span className="cln-zone-task-name">{task.name}</span>
                <div className="cln-zone-task-meta">
                  <span className="cln-freq-badge">{FREQ_LABELS[task.frequency] ?? task.frequency}</span>
                  {task.duration_min && (
                    <span className="cln-zone-task-duration">~{task.duration_min} min</span>
                  )}
                  {!task.active && (
                    <span className="cln-inactive-badge">Inactif</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: 'var(--space-lg)' }}>
          <Button variant="default" style={{ flex: 1 }} onClick={onClose}>Fermer</Button>
          <Button variant="primary" style={{ flex: 1 }} onClick={enterEdit}>Modifier</Button>
        </div>

      </Modal>
    )
  }

  // ── Mode édition ──────────────────────────────────────────────────────────

  const visibleRows = editRows
    .map((r, i) => ({ ...r, _idx: i }))
    .filter(r => !r.toDelete)

  return (
    <Modal size="lg" scrollBody onClose={cancelEdit}>

      <div className="cln-zone-modal-header">
        <span
          className="cln-modal-zone-badge"
          style={{ background: zone.bgToken, color: zone.token }}
        >
          {zone.icon}
          {zone.label}
        </span>
        <span className="cln-zone-modal-title">Modifier les tâches</span>
      </div>

      <div className="cln-zone-edit-list">
        {visibleRows.map(row => (
          <div key={row._idx} className="cln-zone-edit-row">
            <input
              type="text"
              className="cln-step-input"
              value={row.name}
              onChange={e => updateRowName(row._idx, e.target.value)}
              placeholder="Nom de la tâche"
            />
            {row.confirmDel ? (
              <div className="cln-zone-edit-confirm">
                <span className="cln-zone-confirm-label">Supprimer ?</span>
                <button
                  type="button"
                  className="cln-zone-confirm-yes"
                  onClick={() => confirmDelete(row._idx)}
                >
                  Oui
                </button>
                <button
                  type="button"
                  className="cln-zone-confirm-no"
                  onClick={() => toggleConfirmDel(row._idx)}
                >
                  Non
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="cln-step-remove"
                onClick={() => toggleConfirmDel(row._idx)}
                aria-label="Supprimer cette tâche"
              >×</button>
            )}
          </div>
        ))}

        <button
          type="button"
          className="add-trigger add-trigger--labeled cln-zone-add-btn"
          onClick={addRow}
        >
          + Ajouter une tâche
        </button>
      </div>

      <div className="modal-actions" style={{ marginTop: 'var(--space-lg)' }}>
        <Button variant="default" style={{ flex: 1 }} onClick={cancelEdit}>Annuler</Button>
        <Button variant="success" style={{ flex: 2 }} onClick={saveEdit}>Enregistrer</Button>
      </div>

    </Modal>
  )
}
