// ─── Modal détail zone — accordion des tâches ────────────────────────────────
import { useState } from 'react'
import Modal  from '../../../design-system/components/Modal/Modal'
import Button from '../../../design-system/components/Button/Button'
import { resolveZone } from '../utils/cleaningZones.jsx'

const FREQ_LABELS = {
  daily:     'Quotidien',
  weekly:    'Hebdomadaire',
  monthly:   'Mensuel',
  quarterly: 'Trimestriel',
}

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function freqDetail(task) {
  if (task.frequency === 'weekly' && task.dayOfWeek != null) {
    return `${FREQ_LABELS.weekly} — ${DAY_LABELS[task.dayOfWeek]}`
  }
  return FREQ_LABELS[task.frequency] ?? task.frequency
}

export default function CleaningZoneDetailModal({ zone, tasks, onEdit, onClose }) {
  const [openId, setOpenId] = useState(null)

  const resolved     = resolveZone(zone)
  const activeTasks  = tasks.filter(t => t.active)
  const allTasks     = tasks

  function toggle(id) {
    setOpenId(prev => prev === id ? null : id)
  }

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
              {activeTasks.length} tâche{activeTasks.length !== 1 ? 's' : ''} active{activeTasks.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <Button
          variant="default"
          style={{ marginLeft: 'auto', flexShrink: 0 }}
          onClick={onEdit}
        >
          Modifier
        </Button>
      </div>

      {/* Liste accordion */}
      {allTasks.length === 0 ? (
        <div className="cln-modal-empty">Aucune tâche pour cette zone.</div>
      ) : (
        <div className="czd-accordion">
          {allTasks.map(task => {
            const isOpen = openId === task.id
            return (
              <div
                key={task.id}
                className={`czd-item${isOpen ? ' czd-item--open' : ''}${!task.active ? ' czd-item--inactive' : ''}`}
              >
                {/* Ligne titre */}
                <button
                  type="button"
                  className="czd-item-header"
                  onClick={() => toggle(task.id)}
                  aria-expanded={isOpen}
                >
                  <span className="czd-item-name">{task.name}</span>
                  <div className="czd-item-meta">
                    <span className="cln-freq-badge">{freqDetail(task)}</span>
                    <span className="cln-zone-task-duration">{task.duration_min} min</span>
                    {!task.active && <span className="cln-inactive-badge">inactif</span>}
                  </div>
                  <span className="czd-chevron" aria-hidden="true">{isOpen ? '▴' : '▾'}</span>
                </button>

                {/* Corps expandable */}
                <div className="czd-item-body-wrap">
                  <div className="czd-item-body">
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
                    {task.product && (
                      <div className="czd-detail-section">
                        <div className="czd-detail-label">Produit</div>
                        <div className="cln-task-product">{task.product}</div>
                      </div>
                    )}
                    {!task.protocol?.filter(s => s.trim()).length && !task.product && (
                      <div className="cln-modal-empty" style={{ padding: 'var(--space-md) 0' }}>
                        Aucun protocole renseigné.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* Pied */}
      <div className="modal-actions">
        <Button variant="default" style={{ flex: 1 }} onClick={onClose}>Fermer</Button>
      </div>

    </Modal>
  )
}
