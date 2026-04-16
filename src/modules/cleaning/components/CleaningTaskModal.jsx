// ─── Modal validation des tâches d'une pièce pour un jour ────────────────────
import { useState } from 'react'
import Modal  from '../../../design-system/components/Modal/Modal'
import Button from '../../../design-system/components/Button/Button'
import Toggle from '../../../design-system/components/Toggle/Toggle'
import '../../../design-system/components/Toggle/Toggle.css'
import teamData from '../../planning/data/team.json'

const activeTeam = teamData.filter(e => !e.archived)
const teamById   = Object.fromEntries(activeTeam.map(e => [e.id, e]))

function fmtTime(isoStr) {
  const d = new Date(isoStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ── Carte d'une tâche ────────────────────────────────────────────────────────

function TaskCard({ task, record, onMarkDone, onUnmark }) {
  const [authorId, setAuthorId] = useState('')
  const [note,     setNote]     = useState('')

  const isDone = !!record
  const isLate = task.status === 'late'

  function handleMarkDone() {
    onMarkDone(task.id, authorId || null, note.trim() || null)
  }

  return (
    <div className={`cln-task-card${isLate ? ' cln-task-card--late' : ''}${isDone ? ' cln-task-card--done' : ''}`}>

      {/* ── En-tête tâche ── */}
      <div className="cln-task-card-header">
        <span className="cln-task-card-name">{task.name}</span>
      </div>

      {/* ── Produit / dosage ── */}
      {(task.product || task.dosage) && (
        <div className="cln-task-product">
          {task.product && <span>{task.product}</span>}
          {task.product && task.dosage && <span className="cln-task-product-sep">—</span>}
          {task.dosage  && <span className="cln-task-dosage">{task.dosage}</span>}
        </div>
      )}

      {/* ── Protocole ── */}
      {task.protocol?.length > 0 && (
        <ol className="cln-task-protocol">
          {task.protocol.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}

      {/* ── Champs validation (état "À faire" seulement) ── */}
      {!isDone && (
        <div className="cln-validate-section">
          <select
            className="field-input"
            value={authorId}
            onChange={e => setAuthorId(e.target.value)}
            aria-label="Validé par"
          >
            <option value="">Fait par</option>
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
        </div>
      )}

      {/* ── Toggle statut ── */}
      <Toggle
        checked={isDone}
        onChange={val => val ? handleMarkDone() : onUnmark()}
        label={isDone ? 'Fait' : 'À faire'}
      />

      {/* ── Info validation (état "Fait") ── */}
      {isDone && (record?.authorId || record?.note) && (
        <div className="cln-validate-done">
          {record.authorId && teamById[record.authorId] && (
            <span className="cln-done-by">
              par {teamById[record.authorId].name}
              {record.completedAt && ` à ${fmtTime(record.completedAt)}`}
            </span>
          )}
          {record?.note && (
            <span className="cln-done-note">{record.note}</span>
          )}
        </div>
      )}

    </div>
  )
}

// ── Groupe de tâches (zone ou sous-zone) ─────────────────────────────────────

function TaskGroup({ label, tasks, dateStr, getRecordForDay, onMarkDone, onUnmark }) {
  if (!tasks.length) return null
  return (
    <div className="cln-task-group">
      <div className="cln-task-group-label">{label}</div>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          record={getRecordForDay(task.id, dateStr)}
          onMarkDone={(taskId, authorId, note) => onMarkDone(taskId, dateStr, authorId, note)}
          onUnmark={() => onUnmark(task.id, dateStr)}
        />
      ))}
    </div>
  )
}

// ── Modal principale ──────────────────────────────────────────────────────────

export default function CleaningTaskModal({
  room,
  dateStr,
  tasks,
  zones,
  subzones,
  getRecordForDay,
  markDone,
  unmarkDone,
  onClose,
}) {
  // Grouper les tâches par zone puis sous-zone
  const roomZones = zones.filter(z => z.roomId === room.id)

  const groups = []
  for (const zone of roomZones) {
    const zoneTasks = tasks.filter(t => t.zoneId === zone.id)
    if (zoneTasks.length) groups.push({ label: zone.name, tasks: zoneTasks })

    const zoneSubzones = subzones.filter(s => s.zoneId === zone.id)
    for (const sz of zoneSubzones) {
      const szTasks = tasks.filter(t => t.subzoneId === sz.id)
      if (szTasks.length) groups.push({ label: `${zone.name} · ${sz.name}`, tasks: szTasks })
    }
  }

  // Tâches non rattachées à une zone connue (sécurité)
  const knownTaskIds = new Set(groups.flatMap(g => g.tasks.map(t => t.id)))
  const orphans      = tasks.filter(t => !knownTaskIds.has(t.id))
  if (orphans.length) groups.push({ label: 'Autres', tasks: orphans })

  const totalCount = tasks.length

  function fmtDayTitle(ds) {
    const s = new Date(ds + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  return (
    <Modal size="lg" scrollBody onClose={onClose}>

      {/* ── Header ── */}
      <div className="cln-modal-header">
        <div className="cln-zone-profile">
          <div
            className="cln-zone-avatar"
            style={{ background: room.token, color: 'var(--color-white)' }}
          >
            {room.icon ?? room.initials}
          </div>
          <div className="cln-zone-identity">
            <span className="cln-zone-title">{room.label}</span>
            <span className="cln-zone-subtitle">
              {totalCount} tâche{totalCount !== 1 ? 's' : ''} planifiée{totalCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <span className="cln-modal-date">{fmtDayTitle(dateStr)}</span>
      </div>

      {/* ── Liste des tâches ── */}
      {totalCount === 0 ? (
        <div className="cln-modal-empty">Aucune tâche prévue ce jour.</div>
      ) : (
        <div className="cln-task-list">
          {groups.map((g, i) => (
            <TaskGroup
              key={i}
              label={g.label}
              tasks={g.tasks}
              dateStr={dateStr}
              getRecordForDay={getRecordForDay}
              onMarkDone={markDone}
              onUnmark={unmarkDone}
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
