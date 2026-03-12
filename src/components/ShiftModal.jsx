import { useState } from 'react'
import { TIME_OPTIONS, fmtH, WEEKLY_CONTRACT, MAX_HOURS_PER_DAY, weeksElapsed, dateToStr } from '../hooks/useSchedule'

function fmtDur(h) {
  const totalMin = Math.round(Math.abs(h) * 60)
  const hours    = Math.floor(totalMin / 60)
  const mins     = totalMin % 60
  return mins === 0 ? `${hours}h` : `${hours}h${String(mins).padStart(2, '0')}`
}

function fmtPauseLabel(v) {
  if (v === 0)   return 'Aucune'
  if (v < 1)     return `${v * 60} min`
  if (v === 1)   return '1h'
  return `1h${(v - 1) * 60}`
}

const PAUSE_OPTIONS = [
  { value: 0,    label: 'Aucune' },
  { value: 0.25, label: '15 min' },
  { value: 0.5,  label: '30 min' },
  { value: 0.75, label: '45 min' },
  { value: 1,    label: '1h' },
  { value: 1.5,  label: '1h30' },
  { value: 2,    label: '2h' },
]

export default function ShiftModal({ info, onSave, onDelete, onCancel, schedule, weekDates }) {
  const isEdit      = !!info.shift
  const originalDur = isEdit
    ? (info.shift.endHour - info.shift.startHour) - (info.shift.pause ?? 0)
    : 0

  const [start, setStart] = useState(isEdit ? info.shift.startHour : info.startHour)
  const [end,   setEnd]   = useState(isEdit ? info.shift.endHour   : Math.min(info.startHour + 4, 20))
  const [pause, setPause] = useState(isEdit ? (info.shift.pause ?? 0) : 0)

  // Données de base (shift édité exclu)
  const totalHours    = schedule.getTotalHours(info.employee.id)
  const weekHours     = schedule.getWeekHours(info.employee.id, weekDates)
  const baseTotal     = totalHours - originalDur
  const baseWeekHours = weekHours - (isEdit ? originalDur : 0)

  const grossDur     = end > start ? end - start : 0
  const effectiveDur = Math.max(0, grossDur - pause)
  const newTotal     = baseTotal + effectiveDur

  // Vérification convention collective : max heures/jour
  const dayStr        = dateToStr(info.date)
  const dayHoursOther = schedule.shifts
    .filter(s => s.employeeId === info.employee.id && s.date === dayStr && s.id !== info.shift?.id)
    .reduce((sum, s) => sum + (s.endHour - s.startHour) - (s.pause ?? 0), 0)
  const dayTotal      = dayHoursOther + effectiveDur
  const dayExceeded   = dayTotal > MAX_HOURS_PER_DAY

  // Barre cumulative (semaines écoulées × 35h)
  const weeks    = weeksElapsed()
  const expected = weeks * WEEKLY_CONTRACT
  const pct      = Math.min((newTotal / expected) * 100, 100)
  const barColor = newTotal > expected ? '#E05555' : pct >= 90 ? '#F5A623' : '#4CAF50'

  // Solde semaine avec report des semaines précédentes
  const { prevBalance } = schedule.getWeekBalance(info.employee.id, weekDates)
  // prevBalance est calculé sans le shift édité (car baseWeekHours l'exclut déjà via getWeekBalance)
  // Mais getWeekBalance utilise les shifts actuels — on ajuste si édition
  const adjustedPrevBalance = isEdit ? prevBalance : prevBalance
  const weekObjective       = WEEKLY_CONTRACT - adjustedPrevBalance
  const weekBalanceAfter    = (baseWeekHours + effectiveDur) - weekObjective

  function handleStartChange(val) {
    const h = Number(val)
    setStart(h)
    if (end <= h) setEnd(Math.min(h + 4, 20))
  }

  const dateLabel = info.date.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  let balanceText, balanceClass
  if (weekBalanceAfter === 0) {
    balanceText  = '✓ Semaine équilibrée'
    balanceClass = 'ahead'
  } else if (weekBalanceAfter > 0) {
    balanceText  = `+${fmtDur(weekBalanceAfter)} en trop cette semaine`
    balanceClass = 'behind'
  } else {
    balanceText  = `−${fmtDur(Math.abs(weekBalanceAfter))} pour être à jour cette semaine`
    balanceClass = 'warn'
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-avatar" style={{ background: info.employee.color }}>
            {info.employee.initials}
          </div>
          <div>
            <div className="modal-emp-name">{info.employee.name}</div>
            <div className="modal-emp-role">{info.employee.role}</div>
          </div>
        </div>

        <div className="modal-date">{dateLabel}</div>

        {/* Selects */}
        <div className="modal-times">
          <div className="modal-field">
            <label>Début</label>
            <select value={start} onChange={e => handleStartChange(e.target.value)}>
              {TIME_OPTIONS.filter(h => h < 20).map(h => (
                <option key={h} value={h}>{fmtH(h)}</option>
              ))}
            </select>
          </div>
          <div className="modal-times-sep">→</div>
          <div className="modal-field">
            <label>Fin</label>
            <select value={end} onChange={e => setEnd(Number(e.target.value))}>
              {TIME_OPTIONS.filter(h => h > start && h <= 20).map(h => (
                <option key={h} value={h}>{fmtH(h)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pause */}
        <div className="modal-pause">
          <label>Pause</label>
          <select value={pause} onChange={e => setPause(Number(e.target.value))}>
            {PAUSE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Aperçu live */}
        <div className="modal-preview">
          <div className="preview-row">
            {pause > 0 ? (
              <span>{fmtDur(grossDur)} − {fmtPauseLabel(pause)} pause</span>
            ) : (
              <span>Durée du shift</span>
            )}
            <strong>{fmtDur(pause > 0 ? effectiveDur : grossDur)}</strong>
          </div>
          <div className="preview-row">
            <span>Cette semaine (avec ce shift)</span>
            <strong>{fmtDur(baseWeekHours + effectiveDur)}</strong>
          </div>

          <div className="preview-bar-labels">
            {fmtDur(newTotal)} / {fmtDur(expected)} attendues ({weeks} sem. × 35h)
          </div>

          {/* Solde semaine avec report */}
          <div className={`preview-balance ${balanceClass}`}>{balanceText}</div>
          {adjustedPrevBalance !== 0 && (
            <div className="preview-balance-hint">
              dont {adjustedPrevBalance > 0
                ? `+${fmtDur(adjustedPrevBalance)} en avance`
                : `−${fmtDur(Math.abs(adjustedPrevBalance))} en retard`
              } reportés des semaines précédentes
            </div>
          )}
        </div>

        {/* Alerte convention collective */}
        {dayExceeded && (
          <div className="modal-day-alert">
            <span>⚠️</span>
            <div>
              <div className="modal-day-alert-title">Limite journalière dépassée (max {MAX_HOURS_PER_DAY}h/jour)</div>
              <div className="modal-day-alert-sub">Ce shift porterait la journée à {fmtDur(dayTotal)}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          {isEdit ? (
            <>
              <button className="modal-cancel" onClick={onCancel}>Annuler</button>
              <button className="modal-delete" onClick={onDelete}>Supprimer</button>
              <button
                className="modal-confirm"
                style={{ background: dayExceeded ? '#E05555' : info.employee.color }}
                onClick={() => onSave(start, end, pause)}
                disabled={end <= start}
              >
                Enregistrer
              </button>
            </>
          ) : (
            <>
              <button className="modal-cancel" onClick={onCancel}>Annuler</button>
              <button
                className="modal-confirm"
                style={{ background: dayExceeded ? '#E05555' : info.employee.color }}
                onClick={() => onSave(start, end, pause)}
                disabled={end <= start}
              >
                Ajouter le shift
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
