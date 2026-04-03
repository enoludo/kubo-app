// ─── Modal validation des tâches d'une zone pour un jour ─────────────────────
import { useState } from 'react'
import Modal  from '../../../design-system/components/Modal/Modal'
import Button from '../../../design-system/components/Button/Button'
import teamData from '../../planning/data/team.json'

const activeTeam = teamData.filter(e => !e.archived)
const teamById   = Object.fromEntries(activeTeam.map(e => [e.id, e]))

function fmtDayTitle(dateStr) {
  const s = new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function fmtTime(isoStr) {
  const d = new Date(isoStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ── Carte d'une tâche ────────────────────────────────────────────────────────

function TaskCard({ task, record, onMarkDone, onUnmark }) {
  const [authorId, setAuthorId] = useState('')
  const [note,     setNote]     = useState('')

  const isDone = task.status === 'done'
  const isLate = task.status === 'late'

  function handleMarkDone() {
    onMarkDone(task.id, authorId || null, note.trim() || null)
  }

  return (
    <div className={`cln-task-card${isLate ? ' cln-task-card--late' : ''}${isDone ? ' cln-task-card--done' : ''}`}>

      {/* ── En-tête tâche ── */}
      <div className="cln-task-card-header">
        <span className="cln-task-card-name">{task.name}</span>
        {task.duration_min && (
          <span className="cln-task-card-duration">~{task.duration_min} min</span>
        )}
      </div>

      {/* ── Protocole ── */}
      {task.protocol?.length > 0 && (
        <ol className="cln-task-protocol">
          {task.protocol.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}

      {/* ── Produit ── */}
      {task.product && (
        <div className="cln-task-product">
          <span className="cln-task-product-label">Produit :</span> {task.product}
        </div>
      )}

      {/* ── Validation ── */}
      {isDone ? (
        <div className="cln-validate-done">
          <span className="cln-done-badge">✓ Fait</span>
          {record?.authorId && teamById[record.authorId] && (
            <span className="cln-done-by">
              par {teamById[record.authorId].name}
              {record.completedAt && ` à ${fmtTime(record.completedAt)}`}
            </span>
          )}
          {record?.note && (
            <span className="cln-done-note">{record.note}</span>
          )}
          <button className="cln-unmark-btn" onClick={onUnmark}>
            Annuler
          </button>
        </div>
      ) : (
        <div className="cln-validate-section">
          <select
            className="field-input"
            value={authorId}
            onChange={e => setAuthorId(e.target.value)}
            aria-label="Validé par"
          >
            <option value="">— Validé par —</option>
            {activeTeam.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <input
            type="text"
            className="field-input"
            placeholder="Note (optionnel)"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <Button variant="success" onClick={handleMarkDone}>
            Marquer comme fait
          </Button>
        </div>
      )}

    </div>
  )
}

// ── Modal principale ──────────────────────────────────────────────────────────

export default function CleaningTaskModal({
  zone,
  dateStr,
  tasks,
  getRecordForDay,
  markDone,
  unmarkDone,
  onClose,
}) {
  return (
    <Modal size="lg" scrollBody onClose={onClose}>

      {/* ── Header ── */}
      <div className="cln-modal-header">
        <div className="cln-zone-profile">
          <div
            className="cln-zone-avatar"
            style={{ background: zone.token, color: 'var(--color-white)' }}
          >
            {zone.icon ?? zone.initials}
          </div>
          <div className="cln-zone-identity">
            <span className="cln-zone-title">{zone.label}</span>
            <span className="cln-zone-subtitle">
              {tasks.length} tâche{tasks.length !== 1 ? 's' : ''} planifiée{tasks.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <span className="cln-modal-date">{fmtDayTitle(dateStr)}</span>
      </div>

      {/* ── Liste des tâches ── */}
      {tasks.length === 0 ? (
        <div className="cln-modal-empty">Aucune tâche prévue ce jour.</div>
      ) : (
        <div className="cln-task-list">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              record={getRecordForDay(task.id, dateStr)}

              onMarkDone={(taskId, authorId, note) => markDone(taskId, dateStr, authorId, note)}
              onUnmark={() => unmarkDone(task.id, dateStr)}
            />
          ))}
        </div>
      )}

      {/* ── Fermeture ── */}
      <div className="modal-actions" style={{ marginTop: 'var(--space-lg)' }}>
        <Button variant="default" style={{ flex: 1 }} onClick={onClose}>Fermer</Button>
      </div>

    </Modal>
  )
}
