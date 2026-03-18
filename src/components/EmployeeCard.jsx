import { MailIcon } from './Icons'

function fmtDur(h) {
  const totalMin = Math.round(Math.abs(h) * 60)
  const hours    = Math.floor(totalMin / 60)
  const mins     = totalMin % 60
  return mins === 0 ? `${hours}h` : `${hours}h${String(mins).padStart(2, '0')}`
}

export default function EmployeeCard({ employee, weekHours, weekBalance, onClick }) {
  const contract = employee.contract ?? 35
  const weekPct  = Math.min((weekHours / contract) * 100, 100)
  const weekOver = weekHours > contract

  let balanceText, balanceColor
  if (weekBalance === 0) {
    balanceText  = '✓ Semaine équilibrée'
    balanceColor = '#4CAF50'
  } else if (weekBalance > 0) {
    balanceText  = `+${fmtDur(weekBalance)} en trop cette semaine`
    balanceColor = '#E05555'
  } else {
    balanceText  = `−${fmtDur(Math.abs(weekBalance))} pour être à jour`
    balanceColor = '#F5A623'
  }

  return (
    <div
      className={`employee-card${employee.archived ? ' archived' : ''}`}
      style={{ '--emp-color': employee.color }}
      onClick={onClick}
    >
      <div className="emp-profile">
        <div className="emp-avatar" style={{ background: employee.color, color: '#333344' }}>
          {employee.initials}
        </div>
        <div className="emp-identity">
          <div className="emp-name-row">
            <span className="emp-name">{employee.name}</span>
            {employee.email && <span className="emp-email-icon"><MailIcon size={12} /></span>}
          </div>
          <span className="emp-role">{employee.role}</span>
        </div>
      </div>

      <div className="emp-stats">
        <div className="emp-hours-row">
          <span className="emp-hours" >
            {fmtDur(weekHours)}<span className="emp-contract-sub">/{contract}h</span>
          </span>
        </div>
        <span className="emp-balance" style={{ color: balanceColor }}>{balanceText}</span>
        <div className="emp-bar-track">
          <div className="emp-bar-fill" style={{ width: `${weekPct}%`, background: balanceColor }} />
        </div>
      </div>
    </div>
  )
}
