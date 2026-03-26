import { WEEKLY_CONTRACT } from '../hooks/useSchedule'
import { dateToStr, mondayOf, fmtTime } from '../../../utils/date'

// ── Helpers ───────────────────────────────────────────────────────────────

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

function getMondayOf(date) {
  const d   = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function isoWeekNum(monday) {
  const d    = new Date(monday)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const jan4 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d - jan4) / 86400000 - 3 + (jan4.getDay() + 6) % 7) / 7)
}

function effectiveH(s) {
  if ((s.type ?? 'work') !== 'work') return 0
  return Math.max(0, (s.endHour - s.startHour) - (s.pause ?? 0))
}

function fmtDur(h) {
  const totalMin = Math.round(Math.abs(h) * 60)
  const hours    = Math.floor(totalMin / 60)
  const mins     = totalMin % 60
  return mins === 0 ? `${hours}h` : `${hours}h${String(mins).padStart(2, '0')}`
}

function fmtPauseLabel(v) {
  if (!v) return 'aucune'
  if (v < 1) return `${v * 60}min`
  if (v === 1) return '1h'
  return `1h${(v - 1) * 60}min`
}

function fmtDay(date) {
  const day = DAY_NAMES[date.getDay()]
  const d   = String(date.getDate()).padStart(2, '0')
  const m   = String(date.getMonth() + 1).padStart(2, '0')
  return `${day} ${d}/${m}`
}

function fmtDDMM(date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

function computeWeekBalance(shifts, employeeId, weekDates, contract = WEEKLY_CONTRACT) {
  const strs      = new Set(weekDates.map(d => dateToStr(d)))
  const prev      = shifts.filter(s => s.employeeId === employeeId && !strs.has(s.date))
  const prevHours = prev.reduce((sum, s) => sum + effectiveH(s), 0)
  const prevWeeks = new Set(prev.map(s => mondayOf(s.date))).size
  const prevBal   = prevHours - prevWeeks * contract
  const objective = contract - prevBal
  const weekHrs   = shifts
    .filter(s => s.employeeId === employeeId && strs.has(s.date))
    .reduce((sum, s) => sum + effectiveH(s), 0)
  return { weekHours: weekHrs, weekObjective: objective, weekBalance: weekHrs - objective, prevBalance: prevBal }
}

function buildDayLines(employeeId, weekDates, shifts) {
  return weekDates.map(date => {
    const ds        = dateToStr(date)
    const dayShifts = shifts.filter(s => s.employeeId === employeeId && s.date === ds)
    if (dayShifts.length === 0) return `  ${fmtDay(date)} : Repos`
    return dayShifts.map(s =>
      `  ${fmtDay(date)} : ${fmtTime(s.startHour)} \u2212 ${fmtTime(s.endHour)}` +
      ` | Pause : ${fmtPauseLabel(s.pause ?? 0)}` +
      ` | Effectif : ${fmtDur(effectiveH(s))}`
    ).join('\n')
  }).join('\n')
}

// ── Public API ─────────────────────────────────────────────────────────────

export function buildIndividualMailto(employee, weekDates, shifts) {
  if (!employee.email) return null

  const monday    = weekDates[0]
  const sunday    = weekDates[6]
  const wn        = isoWeekNum(getMondayOf(monday))
  const firstName = employee.name.split(' ')[0]
  const wb        = computeWeekBalance(shifts, employee.id, weekDates, employee.contract ?? WEEKLY_CONTRACT)

  const subject = `Votre planning Kubo P\u00e2tisserie \u2014 Semaine ${wn} du ${fmtDDMM(monday)} au ${fmtDDMM(sunday)}`

  let soldeText
  if (wb.weekBalance === 0)      soldeText = 'Semaine \u00e9quilibr\u00e9e \u2713'
  else if (wb.weekBalance > 0)   soldeText = `+${fmtDur(wb.weekBalance)} en avance`
  else                           soldeText = `\u2212${fmtDur(Math.abs(wb.weekBalance))} \u00e0 rattraper`

  const objectifNote = wb.prevBalance !== 0
    ? ` (ajust\u00e9 du report des semaines pr\u00e9c\u00e9dentes)`
    : ''

  const body =
    `Bonjour ${firstName},\n\n` +
    `Voici votre planning pour la semaine ${wn} :\n\n` +
    `${buildDayLines(employee.id, weekDates, shifts)}\n\n` +
    `Total semaine : ${fmtDur(wb.weekHours)} effectif\n` +
    `Objectif semaine : ${fmtDur(wb.weekObjective)}${objectifNote}\n` +
    `Solde : ${soldeText}\n\n` +
    `Bonne semaine !\n` +
    `L'\u00e9quipe Kubo P\u00e2tisserie`

  return `mailto:${employee.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function buildTeamMailto(team, weekDates, shifts) {
  const monday     = weekDates[0]
  const sunday     = weekDates[6]
  const wn         = isoWeekNum(getMondayOf(monday))
  const activeTeam = team.filter(e => !e.archived)
  const withEmail  = activeTeam.filter(e => e.email)

  const subject = `Planning Kubo P\u00e2tisserie \u2014 Semaine ${wn} du ${fmtDDMM(monday)} au ${fmtDDMM(sunday)}`

  let body = `Bonjour \u00e0 tous,\n\nVoici le planning de la semaine ${wn} :\n`

  for (const emp of activeTeam) {
    const wb = computeWeekBalance(shifts, emp.id, weekDates, emp.contract ?? WEEKLY_CONTRACT)
    body +=
      `\n\u2500\u2500 ${emp.name} (${emp.role}) \u2500\u2500\n` +
      `${buildDayLines(emp.id, weekDates, shifts)}\n` +
      `  Total : ${fmtDur(wb.weekHours)} effectif\n`
  }

  body += `\nBonne semaine \u00e0 tous !\nL'\u00e9quipe Kubo P\u00e2tisserie`

  const bcc = withEmail.map(e => e.email).join(',')
  const to  = bcc ? '' : ''
  return `mailto:${to}?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
