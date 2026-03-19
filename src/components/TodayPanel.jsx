import { useState, useEffect } from 'react'
import { dateToStr, fmtTime } from '../utils/date'

const TYPE_LABEL = {
  work:   'Travail',
  leave:  'Congés',
  sick:   'Arrêt maladie',
  school: 'École',
  rest:   'Repos',
  absent: 'Absent',
}

function nowDecimalHour() {
  const d = new Date()
  return d.getHours() + d.getMinutes() / 60
}

function getStatus(shift, nowH) {
  if (!shift) return 'rest'
  const type = shift.type ?? 'work'
  if (type === 'rest') return 'rest'
  if (type !== 'work') return 'special'
  if (nowH >= shift.startHour && nowH < shift.endHour) return 'active'
  if (nowH < shift.startHour) return 'upcoming'
  return 'done'
}

const STATUS_ORDER = { active: 0, upcoming: 1, special: 2, done: 3, rest: 4 }

export default function TodayPanel({ team, shifts, open, onClose }) {
  const [nowH, setNowH] = useState(nowDecimalHour)

  // Recalcule les statuts toutes les minutes
  useEffect(() => {
    if (!open) return
    const id = setInterval(() => setNowH(nowDecimalHour()), 60_000)
    return () => clearInterval(id)
  }, [open])

  if (!open) return null

  const todayStr = dateToStr(new Date())
  const today    = new Date()
  const fmtToday = today.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const rows = team
    .filter(e => !e.archived)
    .map(emp => {
      const shift  = shifts.find(s => s.employeeId === emp.id && s.date === todayStr)
      const status = getStatus(shift, nowH)
      return { emp, shift, status }
    })
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9))

  return (
    <>
      <div className="today-panel-backdrop" onClick={onClose} />
      <div className="today-panel" role="dialog" aria-label="Présents aujourd'hui">
        <div className="today-panel-header">
          <div>
            <div className="today-panel-title">Aujourd'hui</div>
            <div className="today-panel-date">{fmtToday}</div>
          </div>
          <button className="today-panel-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>

        <div className="today-panel-body">
          {rows.length === 0 && (
            <p className="today-empty">Aucun employé actif</p>
          )}
          {rows.map(({ emp, shift, status }) => (
            <TodayCard key={emp.id} emp={emp} shift={shift} status={status} nowH={nowH} />
          ))}
        </div>
      </div>
    </>
  )
}

function TodayCard({ emp, shift, status }) {
  const isRest = status === 'rest'

  function badgeLabel() {
    if (isRest)               return 'Repos'
    if (status === 'active')  return 'En service'
    if (status === 'done')    return 'Terminé'
    if (status === 'upcoming') return `Arrive à ${fmtTime(shift.startHour)}`
    if (status === 'special') return TYPE_LABEL[shift.type ?? 'work'] ?? shift.type
    return ''
  }

  return (
    <div className={`today-card${isRest ? ' today-card--rest' : ''}`}>
      <div className="today-avatar" style={{ background: emp.color ?? '#bbb' }}>
        {emp.initials ?? emp.name?.slice(0, 2).toUpperCase()}
      </div>
      <div className="today-card-info">
        <div className="today-card-name">{emp.name}</div>
        {emp.role && <div className="today-card-role">{emp.role}</div>}
        {shift && (shift.type ?? 'work') === 'work' && (
          <div className="today-card-hours">
            {fmtTime(shift.startHour)} → {fmtTime(shift.endHour)}
          </div>
        )}
      </div>
      <span className={`today-badge today-badge--${status}`}>{badgeLabel()}</span>
    </div>
  )
}
