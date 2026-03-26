import { fmtTime } from '../../../utils/date'

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

function effectiveH(s) {
  if ((s.type ?? 'work') !== 'work') return 0
  return Math.max(0, (s.endHour - s.startHour) - (s.pause ?? 0))
}

const STATUS = {
  work:   { label: 'Travaillé' },
  leave:  { label: 'Congés'    },
  sick:   { label: 'Maladie'   },
  school: { label: 'École'     },
  rest:   { label: 'Repos'     },
  absent: { label: 'Absent'    },
}

export default function DayCard({ shifts, onAdd, onEdit, onToggleValidated, defaultType }) {
  const mainShift = shifts.length > 0 ? shifts[0] : null

  if (!mainShift) {
    if (defaultType) {
      const st = STATUS[defaultType] || STATUS.work
      return (
        <div
          className="day-card"
          style={{
            background: `var(--planning-shift-${defaultType}-bg)`,
            '--card-border': `var(--planning-shift-${defaultType}-color)`,
          }}
          onClick={onAdd}
        >
          <span className="day-card-badge" style={{ background: `var(--planning-shift-${defaultType}-badge-bg)`, color: 'var(--text)' }}>
            {st.label}
          </span>
          <div className="day-card-label">Journée entière</div>
        </div>
      )
    }
    return (
      <div className="day-card day-card--empty add-trigger add-trigger--icon" style={{ '--card-border': 'var(--color-purple-400)' }} onClick={onAdd}>
        +
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
      style={{
        background: isValidated ? `var(--planning-shift-${type}-bg-validated)` : `var(--planning-shift-${type}-bg)`,
        '--card-border': `var(--planning-shift-${type}-color)`,
      }}
      onClick={() => onEdit(mainShift.id)}
    >
      {/* Badge statut */}
      <span
        className="day-card-badge"
        style={{ background: `var(--planning-shift-${type}-badge-bg)`, color: 'var(--text)' }}
      >
        {st.label}
      </span>

      {/* Bouton validation — masqué pour le type Repos */}
      {!isRest && (
        <button
          className={`day-card-validate${isValidated ? ' is-validated' : ''}`}
          onClick={e => { e.stopPropagation(); onToggleValidated(mainShift.id) }}
          title={isValidated ? 'Dévalider' : 'Valider'}
        ><svg xmlns="http://www.w3.org/2000/svg" width="10.96" height="10.96" viewBox="0 0 10.96 10.96">
  <path id="Tracé_95" data-name="Tracé 95" d="M641.295,1667.494h-9.75v-5.75h1.5v4.25h8.25Z" transform="translate(-1621.6 -721.566) rotate(-45)" fill="currentcolor"/>
</svg>
</button>
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
