// ─── Modal détail pièce — accordion zones > sous-zones > tâches ───────────────
import { useState } from 'react'
import Modal  from '../../../design-system/components/Modal/Modal'
import Button from '../../../design-system/components/Button/Button'
import { resolveZone } from '../utils/cleaningZones.jsx'

const FREQ_LABELS = {
  daily:      'Quotidien',
  weekly:     'Hebdomadaire',
  monthly:    'Mensuel',
  quarterly:  'Trimestriel',
  semiannual: 'Semestriel',
}

const DAY_LABELS   = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS_FR    = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

function freqDetail(task) {
  if (task.frequency === 'weekly' && task.dayOfWeek != null)
    return `${FREQ_LABELS.weekly} — ${DAY_LABELS[task.dayOfWeek]}`
  if (task.frequency === 'semiannual' && task.cycleStart != null)
    return `${FREQ_LABELS.semiannual} — ${MONTHS_FR[(task.cycleStart - 1) % 12]}`
  return FREQ_LABELS[task.frequency] ?? task.frequency
}

// ── Ligne tâche ───────────────────────────────────────────────────────────────

function TaskRow({ task }) {
  const [open, setOpen] = useState(false)
  const hasDetail = task.protocol?.length > 0 || task.product || task.dosage

  return (
    <div className={`czd-task-row${!task.active ? ' czd-item--inactive' : ''}`}>
      <button
        type="button"
        className="czd-task-row-header"
        onClick={() => hasDetail && setOpen(v => !v)}
        aria-expanded={open}
        style={{ cursor: hasDetail ? 'pointer' : 'default' }}
      >
        <span className="czd-item-name">{task.name}</span>
        <div className="czd-item-meta">
          <span className="cln-freq-badge">{freqDetail(task)}</span>
          {!task.active && <span className="cln-inactive-badge">inactif</span>}
        </div>
        {hasDetail && (
          <span className="czd-chevron" aria-hidden="true">{open ? '▴' : '▾'}</span>
        )}
      </button>

      {open && hasDetail && (
        <div className="czd-task-row-body">
          {(task.product || task.dosage) && (
            <div className="czd-detail-section">
              <div className="czd-detail-label">Produit</div>
              <div className="cln-task-product">
                {task.product && <span>{task.product}</span>}
                {task.product && task.dosage && <span className="cln-task-product-sep"> — </span>}
                {task.dosage  && <span>{task.dosage}</span>}
              </div>
            </div>
          )}
          {task.protocol?.filter(s => s.trim()).length > 0 && (
            <div className="czd-detail-section">
              <div className="czd-detail-label">Protocole</div>
              <ol className="cln-task-protocol">
                {task.protocol.filter(s => s.trim()).map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Bloc sous-zone ────────────────────────────────────────────────────────────

function SubzoneSection({ subzone, tasks }) {
  const active = tasks.filter(t => t.active)
  if (!tasks.length) return null
  return (
    <div className="czd-subzone-section">
      <div className="czd-subzone-label">
        {subzone.name}
        {!subzone.active && <span className="cln-inactive-badge">inactif</span>}
        <span className="czd-count">{active.length} tâche{active.length !== 1 ? 's' : ''}</span>
      </div>
      {tasks.map(t => <TaskRow key={t.id} task={t} />)}
    </div>
  )
}

// ── Bloc zone ─────────────────────────────────────────────────────────────────

function ZoneSection({ zone, subzones, tasks }) {
  const [open, setOpen] = useState(true)
  const zoneTasks    = tasks.filter(t => t.zoneId === zone.id)
  const zoneSubzones = subzones.filter(s => s.zoneId === zone.id)
  const allTasks     = [
    ...zoneTasks,
    ...zoneSubzones.flatMap(s => tasks.filter(t => t.subzoneId === s.id)),
  ]
  const activeCount  = allTasks.filter(t => t.active).length

  return (
    <div className={`czd-zone-section${!zone.active ? ' czd-item--inactive' : ''}`}>
      <button
        type="button"
        className="czd-zone-section-header"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <span className="czd-zone-section-name">{zone.name}</span>
        <span className="czd-count">{activeCount} tâche{activeCount !== 1 ? 's' : ''} active{activeCount !== 1 ? 's' : ''}</span>
        {!zone.active && <span className="cln-inactive-badge">inactif</span>}
        <span className="czd-chevron" aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="czd-zone-section-body">
          {zoneTasks.map(t => <TaskRow key={t.id} task={t} />)}
          {zoneSubzones.map(sz => (
            <SubzoneSection
              key={sz.id}
              subzone={sz}
              tasks={tasks.filter(t => t.subzoneId === sz.id)}
            />
          ))}
          {!zoneTasks.length && !zoneSubzones.length && (
            <div className="cln-modal-empty" style={{ padding: 'var(--space-sm) 0' }}>
              Aucune tâche dans cette zone.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Modal principale ──────────────────────────────────────────────────────────

export default function CleaningRoomDetailModal({ room, zones, subzones, tasks, onEdit, onClose }) {
  const resolved    = resolveZone(room)
  const roomZones   = zones.filter(z => z.roomId === room.id)
  const activeCount = tasks.filter(t => t.active).length

  return (
    <Modal size="lg" scrollBody onClose={onClose}>

      {/* En-tête */}
      <div className="cln-zone-modal-header">
        <div className="cln-zone-profile">
          <div
            className="cln-zone-avatar"
            style={{ background: resolved.token, color: 'var(--color-white)' }}
          >
            {resolved.initials}
          </div>
          <div className="cln-zone-identity">
            <span className="cln-zone-title">{resolved.label}</span>
            <span className="cln-zone-subtitle">
              {roomZones.length} zone{roomZones.length !== 1 ? 's' : ''} · {activeCount} tâche{activeCount !== 1 ? 's' : ''} active{activeCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <Button variant="default" style={{ marginLeft: 'auto', flexShrink: 0 }} onClick={onEdit}>
          Modifier
        </Button>
      </div>

      {/* Contenu */}
      {roomZones.length === 0 ? (
        <div className="cln-modal-empty">Aucune zone pour cette pièce.</div>
      ) : (
        <div className="czd-accordion">
          {roomZones.map(zone => (
            <ZoneSection
              key={zone.id}
              zone={zone}
              subzones={subzones}
              tasks={tasks}
            />
          ))}
        </div>
      )}

      <div className="modal-actions">
        <Button variant="default" style={{ flex: 1 }} onClick={onClose}>Fermer</Button>
      </div>

    </Modal>
  )
}
