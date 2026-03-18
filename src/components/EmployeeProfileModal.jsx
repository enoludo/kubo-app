import { useState } from 'react'
import { buildIndividualMailto } from '../utils/emailPlanning'
import { dateToStr } from '../hooks/useSchedule'
import { MailIcon } from './Icons'

function fmtDur(h) {
  const totalMin = Math.round(Math.abs(h) * 60)
  const hours    = Math.floor(totalMin / 60)
  const mins     = totalMin % 60
  return mins === 0 ? `${hours}h` : `${hours}h${String(mins).padStart(2, '0')}`
}

function weekKeyOf(dateStr) {
  const d   = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const mon = new Date(d)
  mon.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return dateToStr(mon)
}

function isoWeekNum(monday) {
  const d    = new Date(monday)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const jan4 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d - jan4) / 86400000 - 3 + (jan4.getDay() + 6) % 7) / 7)
}

function getWeekDates(mondayStr) {
  const mon = new Date(mondayStr + 'T00:00:00')
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d
  })
}

function fmtWeekLabel(mondayStr) {
  const mon = new Date(mondayStr + 'T00:00:00')
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmt = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
  return `Sem. ${isoWeekNum(mon)}  —  ${fmt(mon)} au ${fmt(sun)}`
}

export default function EmployeeProfileModal({ employee, weekDates, schedule, onEdit, onClose }) {
  const [emailPanel, setEmailPanel] = useState(false)

  const contract     = employee.contract ?? 35
  const startBalance = employee.startBalance ?? 0

  // Week balance (current week)
  const wb       = schedule.getWeekBalance(employee.id, weekDates, contract, startBalance)
  const weekPct  = Math.min((wb.weekHours / contract) * 100, 100)
  const weekOver = wb.weekHours > contract

  // Cumulative balance (all time)
  const cumulBalance = schedule.getBalance(employee.id, contract, startBalance)
  let cumulText, cumulColor
  if (Math.abs(cumulBalance) < 0.05) {
    cumulText  = '✓ Solde cumulé équilibré'
    cumulColor = '#4CAF50'
  } else if (cumulBalance > 0) {
    cumulText  = `+${fmtDur(cumulBalance)} en avance (cumulé)`
    cumulColor = '#E05555'
  } else {
    cumulText  = `−${fmtDur(Math.abs(cumulBalance))} à rattraper (cumulé)`
    cumulColor = '#F5A623'
  }

  // Weeks with shifts for email select
  const empShifts  = schedule.shifts.filter(s => s.employeeId === employee.id)
  const weekKeys   = [...new Set(empShifts.map(s => weekKeyOf(s.date)))].sort().reverse()
  const currentKey = weekDates.length > 0 ? dateToStr(weekDates[0]) : (weekKeys[0] ?? '')
  const [selectedWeek, setSelectedWeek] = useState(currentKey)

  function handleSend() {
    if (!employee.email) { onEdit(); return }
    const dates = getWeekDates(selectedWeek)
    const href  = buildIndividualMailto(employee, dates, schedule.shifts)
    if (href) window.location.href = href
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal emp-profile-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="emp-profile-modal-header">
          <div className="modal-avatar" style={{ background: employee.color, flexShrink: 0 }}>
            {employee.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-emp-name">{employee.name}</div>
            <div className="modal-emp-role">{employee.role}</div>
          </div>
          <button className="emp-profile-edit-btn" onClick={onEdit}>Modifier</button>
        </div>

        {/* Contract */}
        <div className="emp-profile-info-row">
          <span className="emp-profile-info-label">Contrat</span>
          <span className="emp-profile-info-val">{contract}h / semaine</span>
        </div>

        {/* Week progress */}
        <div className="emp-profile-progress">
          <div className="emp-profile-progress-header">
            <span className="emp-profile-info-label">Semaine en cours</span>
            <span style={{ fontWeight: 600, fontSize: 13}}>
              {fmtDur(wb.weekHours)}<span style={{ fontWeight: 400, fontSize: 11, color: '#9999aa', marginLeft: 2 }}>/{contract}h</span>
            </span>
          </div>
          <div className="emp-bar-track" style={{ height: 5, marginTop: 6 }}>
            <div className="emp-bar-fill" style={{ width: `${weekPct}%`, background: weekOver ? '#E05555' : employee.color }} />
          </div>
        </div>

        {/* Cumulative balance */}
        <div className="emp-profile-cumul" style={{ color: cumulColor, background: cumulColor + '1a' }}>
          {cumulText}
        </div>

        {/* Email sub-panel */}
        {emailPanel && employee.email && (
          <div className="emp-profile-email-panel">
            <div className="modal-field-full">
              <label>Semaine à envoyer</label>
              {weekKeys.length === 0 ? (
                <div style={{ fontSize: 12, color: '#9999aa', padding: '6px 0' }}>Aucun shift enregistré</div>
              ) : (
                <select value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)}>
                  {weekKeys.map(wk => (
                    <option key={wk} value={wk}>{fmtWeekLabel(wk)}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions" style={{ marginTop: 20 }}>
          {emailPanel ? (
            <>
              <button className="modal-cancel" onClick={() => setEmailPanel(false)}>Annuler</button>
              <button className="modal-confirm" style={{ background: employee.color }} onClick={handleSend}>
                Envoyer ✉
              </button>
            </>
          ) : (
            <button
              className="modal-confirm"
              style={{ background: employee.email ? employee.color : undefined, flex: 1 }}
              onClick={employee.email ? () => setEmailPanel(true) : onEdit}
            >
              <MailIcon size={13} style={{ marginRight: 6 }} />
              {employee.email ? 'Envoyer son planning' : "Ajouter un email d'abord"}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
