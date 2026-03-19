import { useState } from 'react'
import { TIME_OPTIONS, fmtH, WEEKLY_CONTRACT, MAX_HOURS_PER_DAY, END_HOUR, weeksElapsed, dateToStr, shiftEffective } from '../hooks/useSchedule'

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

const WorkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16.667" height="16.667" viewBox="0 0 16.667 16.667" fill="currentColor" >
  <path id="Tracé_10" data-name="Tracé 10" d="M8.771,11.9,6.729,9.854a.623.623,0,0,0-.458-.187.659.659,0,0,0-.479.208.654.654,0,0,0,0,.917l2.542,2.563a.6.6,0,0,0,.875,0l4.979-4.979a.655.655,0,0,0,0-.958.706.706,0,0,0-.958.021L8.771,11.9ZM10,18.333a8.063,8.063,0,0,1-3.229-.656,8.4,8.4,0,0,1-4.448-4.448,8.324,8.324,0,0,1,0-6.479A8.328,8.328,0,0,1,4.115,4.1,8.543,8.543,0,0,1,6.771,2.323a8.324,8.324,0,0,1,6.479,0A8.32,8.32,0,0,1,17.677,6.75a8.324,8.324,0,0,1,0,6.479A8.543,8.543,0,0,1,15.9,15.885a8.328,8.328,0,0,1-2.646,1.792A8.115,8.115,0,0,1,10,18.333Zm0-1.25a6.816,6.816,0,0,0,5.021-2.073A6.843,6.843,0,0,0,17.083,10a6.833,6.833,0,0,0-2.063-5.021A6.833,6.833,0,0,0,10,2.917,6.843,6.843,0,0,0,4.99,4.979,6.816,6.816,0,0,0,2.917,10,6.826,6.826,0,0,0,4.99,15.01,6.826,6.826,0,0,0,10,17.083Z" transform="translate(-1.667 -1.667)"/>
 </svg>
);

const HolydaysIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14.729" height="14.729" viewBox="0 0 14.729 14.729" fill="currentColor" >
  <path id="Tracé_9" data-name="Tracé 9" d="M16.063,16.854l-4.521-4.521a.678.678,0,1,1,.958-.958L17.021,15.9a.678.678,0,1,1-.958.958ZM4.146,15.729a8.144,8.144,0,0,1-1.24-2.417,8.578,8.578,0,0,1,.2-5.771,8.3,8.3,0,0,1,4.615-4.6,8.674,8.674,0,0,1,5.771-.208A7.98,7.98,0,0,1,15.9,3.958a.712.712,0,0,1,.292.542.73.73,0,0,1-.229.583L5.25,15.791a.718.718,0,0,1-.573.229.7.7,0,0,1-.531-.292Zm.583-1.208,1.438-1.458q-.333-.458-.667-.99a10.869,10.869,0,0,1-.615-1.125,8.459,8.459,0,0,1-.469-1.229,6.848,6.848,0,0,1-.25-1.3,6.864,6.864,0,0,0-.385,3.146A7.6,7.6,0,0,0,4.729,14.521Zm2.438-2.4,5.125-5.167a8.881,8.881,0,0,0-1.948-1.177,7.678,7.678,0,0,0-1.885-.562,4.7,4.7,0,0,0-1.594,0,2.02,2.02,0,0,0-1.073.51A1.858,1.858,0,0,0,5.312,6.8a4.814,4.814,0,0,0,.052,1.563,7.634,7.634,0,0,0,.6,1.833,9.846,9.846,0,0,0,1.2,1.927Zm7.562-7.563a6.6,6.6,0,0,0-2.99-1.021A6.851,6.851,0,0,0,8.583,4a6.433,6.433,0,0,1,1.24.25,10.989,10.989,0,0,1,1.208.448,9.938,9.938,0,0,1,1.146.594A12.642,12.642,0,0,1,13.229,6l1.5-1.437Z" transform="translate(-2.5 -2.333)"/>
</svg>

);

const SickIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16.667" height="16.667" viewBox="0 0 16.667 16.667" fill="currentColor" >
  <path id="Tracé_12" data-name="Tracé 12" d="M9.375,18.333a.417.417,0,0,1,0-.833h.208V15.6a6.5,6.5,0,0,1-1.771-.448,5.651,5.651,0,0,1-1.5-.906L4.979,15.583l.167.167a.5.5,0,0,1,.135.26.361.361,0,0,1-.135.323.4.4,0,0,1-.583,0l-.9-.875a.4.4,0,0,1-.125-.292.472.472,0,0,1,.125-.312.389.389,0,0,1,.281-.125.5.5,0,0,1,.323.146L4.4,15l1.333-1.333a6.512,6.512,0,0,1-.885-1.5,6.233,6.233,0,0,1-.448-1.75H2.5v.208a.413.413,0,0,1-.708.292.4.4,0,0,1-.125-.292V9.375a.413.413,0,0,1,.708-.292.4.4,0,0,1,.125.292v.208H4.4a6.233,6.233,0,0,1,.448-1.75,6.512,6.512,0,0,1,.885-1.5L4.4,5l-.146.146a.4.4,0,0,1-.583,0,.428.428,0,0,1,0-.6l.875-.875a.428.428,0,0,1,.6,0,.379.379,0,0,1,0,.562L4.979,4.4,6.313,5.729a6.512,6.512,0,0,1,1.5-.885A6.233,6.233,0,0,1,9.563,4.4V2.5H9.375a.413.413,0,0,1-.292-.708.4.4,0,0,1,.292-.125h1.25a.413.413,0,0,1,.292.708.4.4,0,0,1-.292.125h-.208V4.4a6.233,6.233,0,0,1,1.75.448,6.512,6.512,0,0,1,1.5.885L15,4.4l-.125-.125a.411.411,0,0,1-.156-.292.42.42,0,0,1,.719-.312l.917.917a.353.353,0,0,1,.115.281.431.431,0,0,1-.135.281.336.336,0,0,1-.292.1.588.588,0,0,1-.313-.146L15.6,4.979,14.271,6.312a6.436,6.436,0,0,1,.885,1.51,6.367,6.367,0,0,1,.448,1.76h1.9V9.375a.417.417,0,0,1,.833,0v1.25a.417.417,0,0,1-.833,0v-.208H15.6a6.367,6.367,0,0,1-.448,1.76,6.436,6.436,0,0,1-.885,1.51L15.6,15.021l.146-.146a.441.441,0,0,1,.292-.135.365.365,0,0,1,.292.115.428.428,0,0,1,0,.6l-.875.875a.428.428,0,0,1-.6,0,.356.356,0,0,1-.125-.3.517.517,0,0,1,.1-.26L15,15.6l-1.333-1.333a6.809,6.809,0,0,1-1.5.9,6.015,6.015,0,0,1-1.75.458V17.5h.208a.417.417,0,0,1,0,.833H9.375ZM10,14.375A4.357,4.357,0,0,0,14.375,10,4.339,4.339,0,0,0,10,5.625,4.233,4.233,0,0,0,6.906,6.9,4.205,4.205,0,0,0,5.625,10,4.374,4.374,0,0,0,10,14.375Zm-1.458-1.25a.641.641,0,1,0-.437-.187A.6.6,0,0,0,8.542,13.125Zm2.917,0a.59.59,0,0,0,.448-.187.629.629,0,0,0,0-.875.59.59,0,0,0-.448-.187.625.625,0,0,0,0,1.25Zm-4.375-2.5a.59.59,0,0,0,.448-.187.629.629,0,0,0,0-.875.59.59,0,0,0-.448-.187.625.625,0,0,0,0,1.25Zm2.917,0a.641.641,0,1,0-.438-.187A.6.6,0,0,0,10,10.625Zm2.917,0a.59.59,0,0,0,.448-.187.629.629,0,0,0,0-.875.59.59,0,0,0-.448-.187.625.625,0,0,0,0,1.25Zm-4.375-2.5A.641.641,0,1,0,8.1,7.938.6.6,0,0,0,8.542,8.125Zm2.917,0a.59.59,0,0,0,.448-.187.629.629,0,0,0,0-.875.59.59,0,0,0-.448-.187.625.625,0,0,0,0,1.25Z" transform="translate(-1.667 -1.667)"/>
</svg>


);

const SchoolIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17.646" height="14.625" viewBox="0 0 17.646 14.625" fill="currentColor" >
  <path id="Tracé_13" data-name="Tracé 13" d="M4.583,14.542a1.3,1.3,0,0,1-.469-.456,1.216,1.216,0,0,1-.177-.648V9.188L1.854,8.042A.752.752,0,0,1,1.6,7.8a.588.588,0,0,1,0-.6.755.755,0,0,1,.25-.24L9.375,2.833a1.01,1.01,0,0,1,.3-.115,1.535,1.535,0,0,1,.616,0,1.01,1.01,0,0,1,.3.115l8.25,4.479a.719.719,0,0,1,.25.249.618.618,0,0,1,.083.313v5.6a.6.6,0,0,1-.181.445.61.61,0,0,1-.448.18.6.6,0,0,1-.444-.18.609.609,0,0,1-.177-.445V8.229l-1.9.958v4.25a1.216,1.216,0,0,1-.177.648,1.3,1.3,0,0,1-.469.456l-4.792,2.625a1.011,1.011,0,0,1-.3.115,1.535,1.535,0,0,1-.616,0,1.011,1.011,0,0,1-.3-.115L4.583,14.542Zm5.4-3.458L16.542,7.5,9.979,3.979,3.458,7.5Zm0,5,4.792-2.646v-3.5l-4.187,2.25a1.018,1.018,0,0,1-.292.115,1.49,1.49,0,0,1-.312.031,1.346,1.346,0,0,1-.3-.031,1.044,1.044,0,0,1-.281-.115L5.188,9.9v3.542l4.792,2.646Z" transform="translate(-1.521 -2.688)"/>
</svg>



);

const RestIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16.667" height="11.667" viewBox="0 0 16.667 11.667" fill="currentColor" >
  <path id="Tracé_11" data-name="Tracé 11" d="M1.667,15.208V10.521a2.338,2.338,0,0,1,.208-.979,1.82,1.82,0,0,1,.625-.75V6.375A2.171,2.171,0,0,1,4.708,4.167h3.75a1.807,1.807,0,0,1,.854.208A2.228,2.228,0,0,1,10,4.938a2.272,2.272,0,0,1,.677-.562,1.746,1.746,0,0,1,.844-.208h3.75a2.171,2.171,0,0,1,1.583.635A2.119,2.119,0,0,1,17.5,6.375V8.792a1.82,1.82,0,0,1,.625.75,2.339,2.339,0,0,1,.208.979v4.687a.625.625,0,1,1-1.25,0V14.167H2.917v1.042a.606.606,0,0,1-.625.625.606.606,0,0,1-.625-.625Zm8.958-6.771H16.25V6.375a.913.913,0,0,0-.281-.687.967.967,0,0,0-.7-.271H11.458a.739.739,0,0,0-.594.292,1.021,1.021,0,0,0-.24.667Zm-6.875,0H9.375V6.375a1.021,1.021,0,0,0-.24-.667.739.739,0,0,0-.594-.292H4.708a.96.96,0,0,0-.958.958V8.438Zm-.833,4.479H17.083v-2.4a.818.818,0,0,0-.833-.833H3.75a.818.818,0,0,0-.833.833Z" transform="translate(-1.667 -4.167)"/>
</svg>



);

const AbsenceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17.771" height="12.938" viewBox="0 0 17.771 12.938" fill="currentColor" >
  <path id="Tracé_8" data-name="Tracé 8" d="M16.25,8.813,14.938,10.1a.683.683,0,0,1-.437.177.6.6,0,0,1-.615-.615.683.683,0,0,1,.177-.437l1.292-1.312L14.063,6.625a.6.6,0,0,1,0-.875.564.564,0,0,1,.438-.177.683.683,0,0,1,.438.177L16.25,7.042,17.542,5.75a.619.619,0,1,1,.875.875L17.125,7.917l1.292,1.313a.683.683,0,0,1,.177.438.564.564,0,0,1-.177.437.6.6,0,0,1-.875,0ZM7.5,9.979A3,3,0,0,1,4.375,6.854,3,3,0,0,1,7.5,3.729a3,3,0,0,1,3.125,3.125A3,3,0,0,1,7.5,9.979ZM.833,15.417v-.708A2.478,2.478,0,0,1,1.2,13.385,2.208,2.208,0,0,1,2.25,12.5a15.966,15.966,0,0,1,2.781-.969A10.944,10.944,0,0,1,7.5,11.25a10.808,10.808,0,0,1,2.458.281,16.09,16.09,0,0,1,2.771.969,2.414,2.414,0,0,1,1.063.9,2.375,2.375,0,0,1,.375,1.313v.708a1.245,1.245,0,0,1-1.25,1.25H2.083A1.206,1.206,0,0,1,1.2,16.3a1.205,1.205,0,0,1-.365-.885Zm1.25,0H12.917v-.708a1.186,1.186,0,0,0-.187-.635,1.153,1.153,0,0,0-.5-.448,12.312,12.312,0,0,0-2.5-.906A10.644,10.644,0,0,0,7.5,12.5a10.794,10.794,0,0,0-2.24.219,12.224,12.224,0,0,0-2.51.906,1.091,1.091,0,0,0-.49.448,1.238,1.238,0,0,0-.177.635v.708ZM7.5,8.729A1.817,1.817,0,0,0,9.375,6.854,1.817,1.817,0,0,0,7.5,4.979,1.817,1.817,0,0,0,5.625,6.854,1.817,1.817,0,0,0,7.5,8.729Z" transform="translate(-0.833 -3.729)"/>
</svg>



);

// Types dont les horaires ne sont pas saisis (journée entière, 0h comptabilisée)
const FULL_DAY_TYPES = ['leave', 'sick', 'school', 'rest']

const TYPE_OPTIONS = [
  { value: 'work',   label: 'Travaillé', icon: <WorkIcon />  },
  { value: 'leave',  label: 'Congés',    icon: <HolydaysIcon />},
  { value: 'sick',   label: 'Maladie',   icon: <SickIcon /> },
  { value: 'school', label: 'École',     icon: <SchoolIcon /> },
  { value: 'rest',   label: 'Repos',     icon: <RestIcon /> },
  { value: 'absent', label: 'Absent',    icon: <AbsenceIcon />  },
]

const FULL_DAY_NOTES = {
  leave:  { cls: 'leave',  text: 'Congés — journée entière, non comptabilisée' },
  sick:   { cls: 'sick',   text: 'Arrêt maladie — journée entière, non comptabilisée' },
  school: { cls: 'school', text: 'Journée école — non comptabilisée' },
  rest:   { cls: 'rest',   text: 'Repos — non comptabilisé' },
}

export default function ShiftModal({ info, onSave, onDelete, onCancel, onToggleValidated, schedule, weekDates }) {
  const isEdit          = !!info.shift
  const originalDur     = isEdit ? shiftEffective(info.shift) : 0
  const isShiftValidated = isEdit ? (info.shift.validated ?? false) : false

  const [start, setStart] = useState(isEdit ? info.shift.startHour : info.startHour)
  const [end,   setEnd]   = useState(isEdit ? info.shift.endHour   : Math.min(info.startHour + 4, 20))
  const [pause, setPause] = useState(isEdit ? (info.shift.pause ?? 0) : 0)
  const [type,  setType]  = useState(isEdit ? (info.shift.type ?? 'work') : (info.defaultType ?? 'work'))

  const isFullDay = FULL_DAY_TYPES.includes(type)

  // ── Absence école ─────────────────────────────────────────────────────────
  const [schoolAbsence,         setSchoolAbsence]         = useState(isEdit ? (info.shift.schoolAbsence ?? false) : false)
  const [schoolAbsenceAllDay,   setSchoolAbsenceAllDay]   = useState(isEdit ? (info.shift.schoolAbsenceDuration === 'Toute la journée') : false)
  const [schoolAbsenceDuration, setSchoolAbsenceDuration] = useState(isEdit ? (info.shift.schoolAbsenceDuration && info.shift.schoolAbsenceDuration !== 'Toute la journée' ? info.shift.schoolAbsenceDuration : '1h') : '1h')

  // Données de base (shift édité exclu)
  const totalHours    = schedule.getTotalHours(info.employee.id)
  const weekHours     = schedule.getWeekHours(info.employee.id, weekDates)
  const baseTotal     = totalHours - originalDur
  const baseWeekHours = weekHours - originalDur

  const grossDur     = end > start ? end - start : 0
  const effectiveDur = Math.max(0, grossDur - pause)
  // Seul 'work' contribue aux heures
  const typeEffDur   = type === 'work' ? effectiveDur : 0
  const newTotal     = baseTotal + typeEffDur

  // Convention collective : max heures/jour (work uniquement)
  const dayStr        = dateToStr(info.date)
  const sameDay       = schedule.shifts.filter(s =>
    s.employeeId === info.employee.id && s.date === dayStr && s.id !== info.shift?.id
  )
  const dayHoursOther = sameDay
    .filter(s => (s.type ?? 'work') === 'work')
    .reduce((sum, s) => sum + Math.max(0, (s.endHour - s.startHour) - (s.pause ?? 0)), 0)
  const dayTotal    = dayHoursOther + effectiveDur
  const dayExceeded = type === 'work' && dayTotal > MAX_HOURS_PER_DAY

  // Conflit congés/travail : chevauchement horaire réel
  function overlaps(a, b) { return a.startHour < b.endHour && b.startHour < a.endHour }
  const leaveConflict = type === 'leave'
    ? sameDay.find(s => (s.type ?? 'work') !== 'leave' && overlaps({ startHour: start, endHour: end }, s))
    : (type === 'work' || type === 'absent')
      ? sameDay.find(s => (s.type ?? 'work') === 'leave' && overlaps({ startHour: start, endHour: end }, s))
      : null

  const empContract = info.employee.contract ?? 35

  // Barre cumulative
  const weeks    = weeksElapsed()
  const expected = weeks * empContract
  const pct      = Math.min((newTotal / expected) * 100, 100)
  const barColor = newTotal > expected ? '#E05555' : pct >= 90 ? '#F5A623' : '#4CAF50'

  // Solde semaine avec report
  const { prevBalance } = schedule.getWeekBalance(info.employee.id, weekDates, empContract)
  const weekObjective    = empContract - prevBalance
  const weekBalanceAfter = (baseWeekHours + typeEffDur) - weekObjective

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

  function buildExtra() {
    if (type !== 'school' || !schoolAbsence) {
      return { schoolAbsence: false, schoolAbsenceDuration: '' }
    }
    return {
      schoolAbsence: true,
      schoolAbsenceDuration: schoolAbsenceAllDay ? 'Toute la journée' : schoolAbsenceDuration,
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* Bouton validation — édition uniquement, masqué pour Repos */}
        {isEdit && type !== 'rest' && (
          <button
            className={`modal-shift-validate${isShiftValidated ? ' is-validated' : ''}`}
            onClick={() => { onToggleValidated(info.shift.id); onCancel() }}
            title={isShiftValidated ? 'Dévalider' : 'Valider'}
          >✓</button>
        )}

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

        {/* Sélecteur de type — 6 options sur 2 lignes */}
        <div className="modal-type-selector">
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`modal-type-btn${type === opt.value ? ' active' : ''}`}
              onClick={() => {
                setType(opt.value)
                if (FULL_DAY_TYPES.includes(opt.value)) { setStart(7); setEnd(20); setPause(0) }
              }}
            >
              <span className="modal-type-icon">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Section Absence école */}
        {type === 'school' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
              <input
                type="checkbox"
                checked={schoolAbsence}
                onChange={e => {
                  setSchoolAbsence(e.target.checked)
                  if (!e.target.checked) {
                    setSchoolAbsenceAllDay(false)
                    setSchoolAbsenceDuration('1h')
                  }
                }}
                style={{ width: 15, height: 15, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
              />
              Absence notée ce jour
            </label>

            {schoolAbsence && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fade-in 0.18s ease' }}>
                <div className="modal-pause" style={{ marginBottom: 0 }}>
                  <label>Durée de l'absence</label>
                  <select
                    value={schoolAbsenceDuration}
                    onChange={e => setSchoolAbsenceDuration(e.target.value)}
                    disabled={schoolAbsenceAllDay}
                    style={{ opacity: schoolAbsenceAllDay ? 0.4 : 1, pointerEvents: schoolAbsenceAllDay ? 'none' : 'auto' }}
                  >
                    {['30min','1h','1h30','2h','2h30','3h','3h30','4h','4h30','5h','5h30','6h','6h30','7h','7h30','8h'].map(v => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                  <input
                    type="checkbox"
                    checked={schoolAbsenceAllDay}
                    onChange={e => setSchoolAbsenceAllDay(e.target.checked)}
                    style={{ width: 15, height: 15, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
                  />
                  Toute la journée
                </label>
              </div>
            )}
          </div>
        )}

        {/* Horaires + Pause — uniquement pour les types avec saisie horaire */}
        {!isFullDay && (
          <>
            <div className="modal-times">
              <div className="modal-field">
                <label>Début</label>
                <select value={start} onChange={e => handleStartChange(e.target.value)}>
                  {TIME_OPTIONS.filter(h => h < END_HOUR).map(h => (
                    <option key={h} value={h}>{fmtH(h)}</option>
                  ))}
                </select>
              </div>
              <div className="modal-times-sep">→</div>
              <div className="modal-field">
                <label>Fin</label>
                <select value={end} onChange={e => setEnd(Number(e.target.value))}>
                  {TIME_OPTIONS.filter(h => h > start && h <= END_HOUR).map(h => (
                    <option key={h} value={h}>{fmtH(h)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-pause">
              <label>Pause</label>
              <select value={pause} onChange={e => setPause(Number(e.target.value))}>
                {PAUSE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Aperçu live */}
        <div className="modal-preview" >
          {!isFullDay && (
            <div className="preview-row">
              {pause > 0 ? (
                <span>{fmtDur(grossDur)} − {fmtPauseLabel(pause)} pause</span>
              ) : (
                <span>Durée du shift</span>
              )}
              <strong>{fmtDur(pause > 0 ? effectiveDur : grossDur)}</strong>
            </div>
          )}
          <div className="preview-row">
            <span>Cette semaine (avec ce shift)</span>
            <strong>{fmtDur(baseWeekHours + typeEffDur)}</strong>
          </div>

          {type === 'absent' && (
            <div className="preview-type-note preview-type-note--absent">
              Absence — heures non comptabilisées
            </div>
          )}
          {isFullDay && FULL_DAY_NOTES[type] && (
            <div className={`preview-type-note preview-type-note--${FULL_DAY_NOTES[type].cls}`}>
              {FULL_DAY_NOTES[type].text}
            </div>
          )}

          <div className="preview-bar-labels">
            {fmtDur(newTotal)} / {fmtDur(expected)} attendues ({weeks} sem. × {empContract}h)
          </div>
          <div className={`preview-balance ${balanceClass}`}>{balanceText}</div>
          {prevBalance !== 0 && (
            <div className="preview-balance-hint">
              dont {prevBalance > 0
                ? `+${fmtDur(prevBalance)} en avance`
                : `−${fmtDur(Math.abs(prevBalance))} en retard`
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

        {/* Alerte conflit congés/travail */}
        {leaveConflict && (
          <div className="modal-day-alert">
            <span>🌴</span>
            <div>
              <div className="modal-day-alert-title">
                {type === 'leave' ? 'Conflit avec un shift existant' : 'Conflit avec des congés'}
              </div>
              <div className="modal-day-alert-sub">
                Chevauchement avec le shift {fmtH(leaveConflict.startHour)}–{fmtH(leaveConflict.endHour)}
              </div>
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
                style={{ background: (dayExceeded || leaveConflict) ? '#E05555' : info.employee.color }}
                onClick={() => onSave(start, end, pause, type, buildExtra())}
                disabled={(!isFullDay && end <= start) || !!leaveConflict}
              >
                Enregistrer
              </button>
            </>
          ) : (
            <>
              <button className="modal-cancel" onClick={onCancel}>Annuler</button>
              <button
                className="modal-confirm"
                style={{ background: (dayExceeded || leaveConflict) ? '#E05555' : info.employee.color }}
                onClick={() => onSave(start, end, pause, type, buildExtra())}
                disabled={(!isFullDay && end <= start) || !!leaveConflict}
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
