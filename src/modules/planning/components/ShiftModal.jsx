import { useState } from 'react'
import Modal from '../../../design-system/components/Modal/Modal'
import Button from '../../../design-system/components/Button/Button'
import { TIME_OPTIONS, fmtH, WEEKLY_CONTRACT, MAX_HOURS_PER_DAY, END_HOUR, weeksElapsed, dateToStr, shiftEffective } from '../hooks/useSchedule'
import { getHolidayName } from '../utils/frenchHolidays'

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
  <svg xmlns="http://www.w3.org/2000/svg" width="22.5" height="22.5" viewBox="0 0 22.5 22.5" fill='currentcolor'>
  <g id="Groupe_340" data-name="Groupe 340" transform="translate(0.75 0.75)">
    <path id="Tracé_130" data-name="Tracé 130" d="M21.75,22.5A11.25,11.25,0,0,1,13.8,3.3,11.25,11.25,0,1,1,29.7,19.2,11.176,11.176,0,0,1,21.75,22.5ZM12,11.25a9.75,9.75,0,1,0,2.856-6.894A9.761,9.761,0,0,0,12,11.25Z" transform="translate(-11.25 -0.75)"/>
    <path id="Tracé_131" data-name="Tracé 131" d="M17.255,12.313a.75.75,0,0,1-.53-.22L14.1,9.468A.75.75,0,0,1,15.16,8.407L17.255,10.5,23.287,4.47A.75.75,0,0,1,24.348,5.53l-6.562,6.562A.75.75,0,0,1,17.255,12.313Z" transform="translate(-8.715 2.438)"/>
  </g>
</svg>

);

const HolydaysIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22.5" height="22.5" viewBox="0 0 22.5 22.5" fill='currentcolor'>
  <path id="Union_20" data-name="Union 20" d="M21.749,22.5a5.549,5.549,0,0,1-3.127-.961.677.677,0,0,0-.746,0,5.565,5.565,0,0,1-6.254,0,.677.677,0,0,0-.745,0,5.566,5.566,0,0,1-6.255,0,.677.677,0,0,0-.745,0A5.553,5.553,0,0,1,.75,22.5a.75.75,0,0,1,0-1.5,4.063,4.063,0,0,0,2.289-.7l.007-.005a2.176,2.176,0,0,1,2.409,0l.007.005a4.067,4.067,0,0,0,4.576,0l.007-.005a2.175,2.175,0,0,1,2.408,0l.007.005a4.069,4.069,0,0,0,4.577,0l.006-.005a2.176,2.176,0,0,1,2.409,0l.007.005a4.054,4.054,0,0,0,2.289.7.75.75,0,0,1,0,1.5Zm0-4a5.55,5.55,0,0,1-3.127-.962.677.677,0,0,0-.746,0,5.563,5.563,0,0,1-6.254,0,.676.676,0,0,0-.745,0,5.564,5.564,0,0,1-6.255,0,.676.676,0,0,0-.745,0A5.554,5.554,0,0,1,.75,18.5a.75.75,0,0,1,0-1.5,4.057,4.057,0,0,0,2.289-.706l.007,0a2.176,2.176,0,0,1,2.409,0l.007,0a4.063,4.063,0,0,0,4.576,0l.007,0a2.175,2.175,0,0,1,2.408,0l.007,0a4.065,4.065,0,0,0,4.577,0l.006,0a2.176,2.176,0,0,1,2.409,0l.007,0A4.048,4.048,0,0,0,21.75,17a.75.75,0,0,1,0,1.5Zm-4.543-4.537a.75.75,0,0,1-.483-.944,5.75,5.75,0,1,0-10.946,0,.75.75,0,0,1-1.427.461,7.25,7.25,0,1,1,13.8,0,.751.751,0,0,1-.714.52A.734.734,0,0,1,17.206,13.964ZM20.25,12a.75.75,0,0,1,0-1.5h1.5a.75.75,0,0,1,0,1.5ZM.75,12a.75.75,0,0,1,0-1.5h1.5a.75.75,0,1,1,0,1.5ZM17.084,5.417a.75.75,0,0,1,0-1.061l1.06-1.061a.75.75,0,0,1,1.061,1.06l-1.06,1.061a.75.75,0,0,1-1.061,0Zm-12.729,0L3.295,4.355a.75.75,0,1,1,1.061-1.06l1.06,1.061a.75.75,0,1,1-1.061,1.06ZM10.5,2.25V.75a.75.75,0,0,1,1.5,0v1.5a.75.75,0,1,1-1.5,0Z"/>
</svg>


);

const SickIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22.5" height="22.5" viewBox="0 0 22.5 22.5" fill='currentcolor'>
  <path id="Union_21" data-name="Union 21" d="M9.609,22.5a.75.75,0,0,1,0-1.5H10.5V19.184a7.933,7.933,0,0,1-4.327-1.8L4.886,18.674l.63.63a.75.75,0,1,1-1.061,1.061l-2.32-2.32A.75.75,0,1,1,3.2,16.984l.63.63,1.286-1.287A7.935,7.935,0,0,1,3.316,12H1.5v.891a.75.75,0,0,1-1.5,0V9.609a.75.75,0,0,1,1.5,0V10.5H3.316A7.9,7.9,0,0,1,5.109,6.17L3.825,4.886,3.2,5.515a.75.75,0,0,1-1.061-1.06l1.16-1.16,1.16-1.16A.75.75,0,1,1,5.516,3.2l-.63.63L6.17,5.109A7.9,7.9,0,0,1,10.5,3.316V1.5H9.609a.75.75,0,0,1,0-1.5h3.281a.75.75,0,0,1,0,1.5H12V3.316A7.9,7.9,0,0,1,16.33,5.109l1.284-1.284-.63-.63a.75.75,0,1,1,1.061-1.06l1.16,1.16,1.16,1.16A.75.75,0,1,1,19.3,5.515l-.629-.629L17.391,6.17a7.9,7.9,0,0,1,1.793,4.33H21V9.609a.75.75,0,0,1,1.5,0v3.281a.75.75,0,0,1-1.5,0V12H19.184a7.935,7.935,0,0,1-1.8,4.327l1.286,1.287.63-.63a.75.75,0,1,1,1.061,1.061l-2.32,2.32A.75.75,0,1,1,16.984,19.3l.63-.63-1.287-1.287A7.933,7.933,0,0,1,12,19.184V21h.891a.75.75,0,0,1,0,1.5Zm1.641-4.782a6.469,6.469,0,0,0,.034-12.937h-.068a6.471,6.471,0,0,0-6.435,6.435c0,.011,0,.022,0,.034s0,.023,0,.034A6.477,6.477,0,0,0,11.25,17.718Z"/>
</svg>



);

const SchoolIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="23.49" height="20.362" viewBox="0 0 23.49 20.362" fill='currentcolor'>
  <path id="Union_22" data-name="Union 22" d="M0,18.113a2.254,2.254,0,0,1,1.5-2.122V7.327q-.283-.132-.548-.259a1.592,1.592,0,0,1,0-2.908C2.119,3.6,3.535,2.975,5.161,2.3,7.782,1.205,9.6.544,10.66.182a3.358,3.358,0,0,1,2.18,0c1.065.364,2.884,1.026,5.5,2.115,1.621.675,3.037,1.3,4.21,1.863a1.592,1.592,0,0,1,0,2.908c-1.015.486-2.216,1.022-3.576,1.6C18.99,9.176,19,9.69,19,10.2a25.15,25.15,0,0,1-.164,3.2,2.28,2.28,0,0,1-1.209,1.742,12.581,12.581,0,0,1-5.877,1.224,12.568,12.568,0,0,1-5.876-1.225A2.28,2.28,0,0,1,4.664,13.4,25.181,25.181,0,0,1,4.5,10.2c0-.508.008-1.021.028-1.532Q3.725,8.326,3,8.006v7.985a2.25,2.25,0,1,1-3,2.121Zm1.5,0a.75.75,0,1,0,.75-.75A.75.75,0,0,0,1.5,18.113ZM6,10.2a23.162,23.162,0,0,0,.151,3,.788.788,0,0,0,.418.612,11.169,11.169,0,0,0,5.18,1.055,11.175,11.175,0,0,0,5.18-1.054.787.787,0,0,0,.418-.613,23.132,23.132,0,0,0,.151-3c0-.3,0-.611-.01-.917-2.169.886-3.707,1.444-4.65,1.766a3.366,3.366,0,0,1-2.18,0c-.945-.323-2.486-.881-4.649-1.765C6,9.586,6,9.892,6,10.2ZM5.738,7.547C8.314,8.619,10.1,9.27,11.144,9.626a1.875,1.875,0,0,0,1.21,0c1.041-.356,2.823-1.005,5.406-2.081l.141-.059.011,0c1.536-.642,2.877-1.236,3.987-1.768.033-.016.091-.051.091-.1s-.058-.085-.092-.1c-1.148-.55-2.541-1.166-4.138-1.831C15.184,2.608,13.4,1.958,12.354,1.6a1.865,1.865,0,0,0-1.21,0c-1.041.355-2.823,1-5.406,2.081-1.6.667-3,1.283-4.138,1.831-.035.017-.093.052-.093.1s.058.085.093.1c1.1.529,2.443,1.123,3.985,1.768l.012.005Z"/>
</svg>




);

const RestIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22.5" height="17.5" viewBox="0 0 22.5 17.5" fill='currentcolor'>
  <path id="Union_23" data-name="Union 23" d="M19.705,17.482A1.767,1.767,0,0,1,18.091,15.7c-.02-.464-.038-1.054-.052-1.762-1.276.031-3.384.062-6.789.062s-5.514-.031-6.79-.062c-.013.587-.03,1.176-.053,1.76a1.768,1.768,0,0,1-1.613,1.784c-.174.013-.356.018-.544.018s-.37-.005-.543-.018A1.767,1.767,0,0,1,.094,15.7C.051,14.718,0,12.713,0,8.75S.051,2.782.094,1.8A1.766,1.766,0,0,1,1.706.019C1.88.006,2.063,0,2.25,0s.379.006.545.019A1.766,1.766,0,0,1,4.406,1.8c.026.609.056,1.61.075,3.225a3.245,3.245,0,0,1,3.584.03q.023-.312.054-.623a2.1,2.1,0,0,1,2.031-1.9c.571-.023,1.157-.035,1.742-.035a46.929,46.929,0,0,1,5.344.312,5.785,5.785,0,0,1,3.815,2.08A6.462,6.462,0,0,1,22.5,9.006V9.25a1.74,1.74,0,0,1-.319,1.006,1.732,1.732,0,0,1,.308,1c-.016,2.406-.056,3.742-.086,4.44a1.765,1.765,0,0,1-1.613,1.78c-.182.013-.365.02-.548.02S19.883,17.494,19.705,17.482Zm-.413-4.858a.752.752,0,0,1,.233.532c.016,1.039.038,1.873.064,2.479.005.126.042.338.223.351a6.255,6.255,0,0,0,.871,0c.18-.013.216-.225.221-.35.03-.684.068-2,.085-4.385a.249.249,0,0,0-.072-.176A.245.245,0,0,0,20.741,11H11.25c-4.16,0-6.362.045-7.478.083H3.747A.75.75,0,0,1,3,10.33c0-.489,0-1.014,0-1.58,0-3.937-.049-5.918-.092-6.886-.005-.125-.041-.337-.223-.349C2.555,1.5,2.408,1.5,2.25,1.5s-.3,0-.436.014c-.18.013-.216.224-.221.349C1.55,2.832,1.5,4.813,1.5,8.75s.049,5.917.092,6.886c.005.125.041.337.223.35.136.009.283.014.435.014s.3-.005.437-.014c.18-.014.216-.225.221-.35.032-.82.054-1.655.064-2.479a.75.75,0,0,1,.776-.74c1.116.038,3.324.083,7.5.083s6.384-.045,7.5-.083h.027A.749.749,0,0,1,19.292,12.623ZM10.211,4.035a.614.614,0,0,0-.6.546C9.537,5.32,9.5,6.066,9.5,6.8a22.348,22.348,0,0,0,.145,2.537.2.2,0,0,0,.207.163h10.9A.25.25,0,0,0,21,9.25V9.006a4.96,4.96,0,0,0-1.105-3.159A4.292,4.292,0,0,0,17.064,4.3,45.371,45.371,0,0,0,11.892,4C11.327,4,10.762,4.011,10.211,4.035ZM4.5,7.75A1.75,1.75,0,1,0,6.25,6,1.752,1.752,0,0,0,4.5,7.75Z"/>
</svg>




);

const AbsenceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22.5" height="22.5" viewBox="0 0 22.5 22.5" fill='currentcolor'>
  <path id="Union_24" data-name="Union 24" d="M3.176,22.045A3.163,3.163,0,0,1,.437,19.336,48.615,48.615,0,0,1,0,12.5,48.626,48.626,0,0,1,.437,5.665,3.163,3.163,0,0,1,3.176,2.956c.314-.041.933-.076,1.533-.109.4-.022.779-.044.971-.062A.747.747,0,0,1,6,2.824V.75a.75.75,0,0,1,1.5,0V2.58a.749.749,0,0,1,.234-.043C8.879,2.512,10.079,2.5,11.3,2.5c1.151,0,2.318.013,3.468.037A.749.749,0,0,1,15,2.58V.75a.75.75,0,0,1,1.5,0V2.824a.746.746,0,0,1,.32-.039c.192.018.571.04.971.062.6.033,1.219.068,1.532.109a3.164,3.164,0,0,1,2.74,2.709A48.626,48.626,0,0,1,22.5,12.5a48.615,48.615,0,0,1-.437,6.835,3.163,3.163,0,0,1-2.739,2.709,62.024,62.024,0,0,1-8.074.455A62.012,62.012,0,0,1,3.176,22.045ZM1.5,12.5a47.31,47.31,0,0,0,.421,6.622,1.659,1.659,0,0,0,1.453,1.435A60.509,60.509,0,0,0,11.25,21a60.549,60.549,0,0,0,7.876-.443,1.659,1.659,0,0,0,1.453-1.435A47.31,47.31,0,0,0,21,12.5c0-.906-.02-1.74-.054-2.5H1.554C1.521,10.76,1.5,11.595,1.5,12.5Zm19.357-4c-.081-1.084-.184-1.961-.279-2.622a1.659,1.659,0,0,0-1.454-1.436c-.256-.033-.9-.069-1.417-.1-.434-.024-.808-.045-1.031-.067a.752.752,0,0,1-.177-.039V5.75a.75.75,0,1,1-1.5,0V3.994a.747.747,0,0,1-.25.043h-.016C13.579,4.012,12.406,4,11.25,4c-1.193,0-2.364.013-3.484.037A.749.749,0,0,1,7.5,3.994V5.75a.75.75,0,0,1-1.5,0V4.239a.752.752,0,0,1-.177.039c-.222.022-.6.042-1.03.067-.517.029-1.162.065-1.418.1A1.658,1.658,0,0,0,1.922,5.878c-.094.661-.2,1.538-.279,2.622Zm-8.016,9.4L11.25,16.311,9.659,17.9A.75.75,0,0,1,8.6,16.841l1.591-1.591L8.6,13.659A.75.75,0,1,1,9.66,12.6l1.591,1.591L12.841,12.6a.75.75,0,1,1,1.06,1.061l-1.59,1.59L13.9,16.841A.75.75,0,0,1,12.841,17.9Z"/>
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
  const barColor = newTotal > expected ? 'var(--color-danger)' : pct >= 90 ? 'var(--color-warning)' : 'var(--color-success)'

  // Solde semaine avec report
  const { prevBalance } = schedule.getWeekBalance(info.employee.id, weekDates, empContract)
  const weekObjective    = empContract - prevBalance
  const weekBalanceAfter = (baseWeekHours + typeEffDur) - weekObjective

  function handleStartChange(val) {
    const h = Number(val)
    setStart(h)
    if (end <= h) setEnd(Math.min(h + 4, 20))
  }

  const holidayName = getHolidayName(info.date)

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
      return { schoolAbsence: false, schoolAbsenceDuration: null }
    }
    return {
      schoolAbsence: true,
      schoolAbsenceDuration: schoolAbsenceAllDay ? 'Toute la journée' : schoolAbsenceDuration,
    }
  }

  return (
    <Modal onClose={onCancel}>

        {/* Bouton validation — édition uniquement, masqué pour Repos */}
        {isEdit && type !== 'rest' && (
          <button
            className={`modal-shift-validate${isShiftValidated ? ' is-validated' : ''}`}
            onClick={() => { onToggleValidated(info.shift.id); onCancel() }}
            title={isShiftValidated ? 'Dévalider' : 'Valider'}
          ><svg xmlns="http://www.w3.org/2000/svg" width="10.96" height="10.96"  viewBox="0 0 10.96 10.96">
  <path id="Tracé_95" data-name="Tracé 95" d="M641.295,1667.494h-9.75v-5.75h1.5v4.25h8.25Z" transform="translate(-1621.6 -721.566) rotate(-45)" fill="currentcolor"/>
</svg>

</button>
        )}

        {/* Header */}
        <div className="modal-header">
          <div className="modal-avatar">
            {info.employee.initials}
          </div>
          <div>
            <div className="modal-emp-name">{info.employee.name}</div>
            <div className="text-meta modal-emp-role">{info.employee.role}</div>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 'var(--space-lg)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', fontFamily: "'Poppins', sans-serif", fontSize: 'var(--font-size-md)', fontWeight: 500, color: 'var(--text)' }}>
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
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', fontFamily: "'Poppins', sans-serif", fontSize: 'var(--font-size-md)', fontWeight: 500, color: 'var(--text)' }}>
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
        <div className={`modal-preview modal-preview--${type}`}>
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
            <div className="modal-day-alert-title">Limite journalière dépassée (max {MAX_HOURS_PER_DAY}h/jour)</div>
          </div>
        )}

        {/* Alerte conflit congés/travail */}
        {leaveConflict && (
          <div className="modal-day-alert">
            <div className="modal-day-alert-title">
              {type === 'leave' ? 'Conflit avec un shift existant' : 'Conflit avec des congés'}
            </div>
          </div>
        )}

        {/* Avertissement jour férié */}
        {holidayName && type === 'work' && (
          <div className="modal-holiday-alert">
            <span>🎉</span>
            <div>
              <div className="modal-holiday-alert-title">{holidayName}</div>
              <div className="modal-holiday-alert-sub">Ce jour est un jour férié</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          {isEdit ? (
            <>
              <Button variant="default" style={{ flex: 1 }} onClick={onCancel}>Annuler</Button>
              <Button type="button" variant="danger" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); onDelete() }}>Supprimer</Button>
              <Button
                variant="success"
                style={{ flex: 2, ...((dayExceeded || leaveConflict) ? { background: 'var(--color-danger)', borderColor: 'var(--color-danger)', color: 'var(--color-white)' } : {}) }}
                onClick={() => onSave(start, end, pause, type, buildExtra())}
                disabled={(!isFullDay && end <= start) || !!leaveConflict}
              >
                Enregistrer
              </Button>
            </>
          ) : (
            <>
              <Button variant="default" style={{ flex: 1 }} onClick={onCancel}>Annuler</Button>
              <Button
                variant="success"
                style={{ flex: 2, ...((dayExceeded || leaveConflict) ? { background: 'var(--color-danger)', borderColor: 'var(--color-danger)', color: 'var(--color-white)' } : {}) }}
                onClick={() => onSave(start, end, pause, type, buildExtra())}
                disabled={(!isFullDay && end <= start) || !!leaveConflict}
              >
                Ajouter le shift
              </Button>
            </>
          )}
        </div>

    </Modal>
  )
}
