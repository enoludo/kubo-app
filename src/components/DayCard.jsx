import { fmtTime } from '../utils/date'

function fmtDur(h) {
  const m  = Math.round(h * 60)
  const hh = Math.floor(m / 60)
  const mm = m % 60
  return mm === 0 ? `${hh}h` : `${hh}h${String(mm).padStart(2, '0')}`
}

function fmtPause(v) {
  if (!v) return null
  if (v < 1) return `${v * 60}min`
  if (v === 1) return '1h'
  return `1h${(v - 1) * 60}min`
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function effectiveH(s) {
  if ((s.type ?? 'work') !== 'work') return 0
  return Math.max(0, (s.endHour - s.startHour) - (s.pause ?? 0))
}

const STATUS = {
  work:   { label: 'Travaillé', color: '#7AC5FF' },
  leave:  { label: 'Congés',    color: '#C8AFFF' },
  sick:   { label: 'Maladie',   color: '#FF9594' },
  school: { label: 'École',     color: '#FFD866' },
  rest:   { label: 'Repos',     color: '#66DA9B' },
  absent: { label: 'Absent',    color: '#FFBB88' },
}

// Couleur de fond des cards par type (50% non validé, 25% validé)
const TYPE_BG = {
  work:   '#7AC5FF',
  leave:  '#C8AFFF',
  sick:   '#FF9594',
  school: '#FFD866',
  rest:   '#66DA9B',
  absent: '#FFBB88',
}

function typeBg(type, validated) {
  const base = TYPE_BG[type] ?? '#ffffff'
  return base + (validated ? '1A' : '40')
}

export default function DayCard({ employee, shifts, onAdd, onEdit, onToggleValidated, defaultType }) {
  const mainShift = shifts.length > 0 ? shifts[0] : null

  if (!mainShift) {
    if (defaultType) {
      const st = STATUS[defaultType] || STATUS.work
      return (
        <div className="day-card" style={{ background: typeBg(defaultType, false), '--card-border': (TYPE_BG[defaultType] ?? '#7c6fcd') + '99' }} onClick={onAdd}>
          <span className="day-card-badge" style={{ background: st.color + '44', color: '#333' }}>
            {st.label}
          </span>
          <div className="day-card-label">Journée entière</div>
        </div>
      )
    }
    return (
      <div className="day-card day-card--empty" style={{ '--card-border': '#7c6fcd99' }} onClick={onAdd}>
        <span className="day-card-plus">+</span>
      </div>
    )
  }

  const type        = mainShift.type ?? 'work'
  const isRest      = type === 'rest' || type === 'school' || type === 'leave'
  const isValidated = isRest ? false : (mainShift.validated ?? false)
  const st          = STATUS[type] || STATUS.work
  const eff         = effectiveH(mainShift)
  const pauseStr    = fmtPause(mainShift.pause)
  const isWork      = type === 'work'

  return (
    <div
      className={`day-card${isValidated ? ' day-card--validated' : ''}`}
      style={{ background: typeBg(type, isValidated), '--card-border': (TYPE_BG[type] ?? '#7c6fcd') + '99' }}
      onClick={() => onEdit(mainShift.id)}
    >
      {/* Badge statut */}
      <span
        className="day-card-badge"
        style={{ background: st.color + '44', color: '#333' }}
      >
        {st.label}
      </span>

      {/* Bouton validation — masqué pour le type Repos */}
      {!isRest && (
        <button
          className={`day-card-validate${isValidated ? ' is-validated' : ''}`}
          onClick={e => { e.stopPropagation(); onToggleValidated(mainShift.id) }}
          title={isValidated ? 'Dévalider' : 'Valider'}
        >✓</button>
      )}

      {isWork ? (
        <div className="day-card-work">
          <div className="day-card-hours">
            {fmtTime(mainShift.startHour)} − {fmtTime(mainShift.endHour)}
          </div>
          {pauseStr && <div className="day-card-pause">{pauseStr} pause</div>}
          <div className="day-card-eff">{fmtDur(eff)} eff.</div>
        </div>
      ) : (
        <>
          <div className="day-card-label">Journée entière</div>
          {type === 'school' && mainShift.schoolAbsence && (
            <div className="day-card-school-absence">
              <span>⚠️</span>
              <span>Absent {mainShift.schoolAbsenceDuration === 'Toute la journée' ? 'toute la journée' : mainShift.schoolAbsenceDuration}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
