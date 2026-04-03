// ─── Modal saisie des relevés de température ──────────────────────────────────
import { useState } from 'react'
import Modal  from '../../../design-system/components/Modal/Modal'
import Button from '../../../design-system/components/Button/Button'
import { isOutOfRange } from '../hooks/useTemperatures'
import { getEquipColor, getTypeIcon } from '../utils/tempColors.jsx'
import teamData from '../../../modules/planning/data/team.json'

const activeTeam = teamData.filter(e => !e.archived)
const teamById   = Object.fromEntries(activeTeam.map(e => [e.id, e]))

const TYPE_LABEL = {
  positif: 'Froid positif',
  negatif: 'Froid négatif',
}

function fmtDayTitle(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const s = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function fmtTemp(t) {
  const n = Number(t)
  return `${n > 0 ? '+' : ''}${n}°C`
}

function nowHHMM() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

// Assigne les slots pour la compatibilité PDF — sans impact sur l'affichage UI
function assignSlots(readings) {
  const sorted = [...readings].sort((a, b) => a.time.localeCompare(b.time))
  return sorted.map((r, i) => ({
    ...r,
    slot: i === 0 ? 'morning' : i === sorted.length - 1 ? 'evening' : 'extra',
  }))
}

export default function TempModal({ equipment, date, readings: initialReadings, onSave, onClose }) {
  const [readings, setReadings] = useState(() =>
    initialReadings.map(r => ({ ...r, temperature: String(r.temperature) }))
  )
  const [newTime,         setNewTime]         = useState(nowHHMM)
  const [newTemp,         setNewTemp]         = useState(
    () => (equipment.minTemp + equipment.maxTemp) / 2
  )
  const [newComment,      setNewComment]      = useState('')
  const [newAuthorId,     setNewAuthorId]     = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const palette = getEquipColor(equipment)

  const defaultTemp = (equipment.minTemp + equipment.maxTemp) / 2

  function fmtStepper(val) {
    return val % 1 === 0 ? `${val}°C` : `${val.toFixed(1)}°C`
  }

  function stepTemp(delta) {
    setNewTemp(t => Math.round((t + delta) * 10) / 10)
  }

  function handleAdd() {
    if (!newTime) return
    const newReading = {
      id:          crypto.randomUUID(),
      time:        newTime,
      temperature: newTemp,
      comment:     newComment.trim() || null,
      authorId:    newAuthorId || null,
    }
    const next = [...readings, newReading]
    const withSlots = assignSlots(
      next
        .filter(r => r.time && r.temperature !== '' && r.temperature !== null)
        .map(r => ({ ...r, temperature: Number(r.temperature) }))
    )
    onSave(withSlots)
    onClose()
  }

  function handleCancelAdd() {
    setNewTemp(defaultTemp)
    setNewComment('')
    setNewAuthorId('')
    setNewTime(nowHHMM())
  }

  function handleDeleteConfirmed() {
    setReadings(prev => prev.filter(r => r.id !== confirmDeleteId))
    setConfirmDeleteId(null)
  }

  function handleClose() {
    const withSlots = assignSlots(
      readings
        .filter(r => r.time && r.temperature !== '' && r.temperature !== null)
        .map(r => ({ ...r, temperature: Number(r.temperature) }))
    )
    onSave(withSlots)
    onClose()
  }

  const sorted   = [...readings].sort((a, b) => a.time.localeCompare(b.time))
  const hasAlert = readings.some(r =>
    r.temperature !== '' && isOutOfRange({ temperature: Number(r.temperature) }, equipment)
  )
  const newTempAlert = isOutOfRange({ temperature: newTemp }, equipment)

  // ── Popin confirmation suppression ────────────────────────────────────────
  if (confirmDeleteId !== null) {
    return (
      <Modal onClose={() => setConfirmDeleteId(null)}>
        <div className="modal-emp-form-title">Supprimer ce relevé ?</div>
        <div className="modal-actions">
          <Button variant="default" style={{ flex: 1 }} onClick={() => setConfirmDeleteId(null)}>
            Annuler
          </Button>
          <Button variant="danger" style={{ flex: 2 }} onClick={handleDeleteConfirmed}>
            Supprimer
          </Button>
        </div>
      </Modal>
    )
  }

  // ── Modal principale ───────────────────────────────────────────────────────
  return (
    <Modal onClose={handleClose} scrollBody>

      {/* ── Header équipement ── */}
      <div className="tm-header">
        <div className="tm-avatar" style={{ background: palette.c300 }}>
          {getTypeIcon(equipment.type)}
        </div>
        <div className="tm-equip-info">
          <span className="tm-equip-name">{equipment.name}</span>
          <span className="tm-equip-meta">
            {TYPE_LABEL[equipment.type] ?? equipment.type}
            &nbsp;·&nbsp;
            {equipment.minTemp}°C — {equipment.maxTemp}°C
          </span>
        </div>
      </div>

      {/* ── Date ── */}
      <div className="tm-date">{fmtDayTitle(date)}</div>

      {/* ── Bannière alerte ── */}
      {hasAlert && (
        <div className="tm-alert-banner">
          ⚠&nbsp; Température hors plage — vérifiez les valeurs saisies.
        </div>
      )}

      {/* ── Liste des relevés ── */}
      {sorted.length > 0 && (
        <div className="tm-list">
          {sorted.map(r => {
            const alert = r.temperature !== '' &&
              isOutOfRange({ temperature: Number(r.temperature) }, equipment)
            return (
              <div key={r.id} className="tm-list-row" style={{ backgroundColor: palette.c100 }}>
                <div className="tm-list-main">
                  <div className="tm-list-line">
                    <span className="tm-list-time">{r.time}</span>
                    <span className={`tm-list-temp${alert ? ' tm-list-temp--alert' : ''}`}>
                      {r.temperature !== '' ? fmtTemp(r.temperature) : '—'}
                    </span>
                    {alert && <span className="tm-alert-tag">Hors plage</span>}
                    {r.authorId && teamById[r.authorId] && (
                      <span className="tm-list-author">
                        <span
                          className="tm-author-dot"
                          style={{ background: teamById[r.authorId].color }}
                        />
                        {teamById[r.authorId].name}
                      </span>
                    )}
                  </div>
                  {r.comment && (
                    <span className="tm-list-comment">{r.comment}</span>
                  )}
                </div>
                <button
                  className="tm-remove-btn"
                  onClick={() => setConfirmDeleteId(r.id)}
                  aria-label="Supprimer ce relevé"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Formulaire ajout ── */}
      <div className="tm-add-section">
        <div className="tm-section-label">Ajouter un relevé</div>
        <div className="tm-add-grid">
          <input
            type="time"
            className="tm-input tm-input--time tm-input--full"
            value={newTime}
            onChange={e => setNewTime(e.target.value)}
            aria-label="Heure"
          />
          <div className={`tm-temp-stepper${newTempAlert ? ' tm-temp-stepper--alert' : ''}`}>
            <div className="qty-stepper">
              <button type="button" className="qty-btn" onClick={() => stepTemp(-0.5)}>−</button>
              <span className="qty-value tm-stepper-value">{fmtStepper(newTemp)}</span>
              <button type="button" className="qty-btn" onClick={() => stepTemp(0.5)}>+</button>
            </div>
          </div>
        </div>
        <input
          type="text"
          className="tm-input tm-input--comment-full"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Commentaire (optionnel)"
          aria-label="Commentaire"
        />
        <div className="tm-author-row">
          <select
            className="field-input"
            value={newAuthorId}
            onChange={e => setNewAuthorId(e.target.value)}
            aria-label="Auteur du relevé"
          >
            <option value="">— Sélectionner un auteur —</option>
            {activeTeam.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <div className="modal-actions emp-profile-actions">
          <Button variant="default" style={{ flex: 1 }} onClick={handleCancelAdd}>
            Annuler
          </Button>
          <Button
            variant="success"
            style={{ flex: 2 }}
            onClick={handleAdd}
            disabled={!newTime}
          >
            + Ajouter
          </Button>
        </div>
      </div>

    </Modal>
  )
}
