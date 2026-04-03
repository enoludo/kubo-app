import EntityCard from '../../../design-system/components/EntityCard/EntityCard'
import { MailIcon } from '../../../components/Icons'

function fmtDur(h) {
  const totalMin = Math.round(Math.abs(h) * 60)
  const hours    = Math.floor(totalMin / 60)
  const mins     = totalMin % 60
  return mins === 0 ? `${hours}h` : `${hours}h${String(mins).padStart(2, '0')}`
}

export default function EmployeeCard({ employee, weekHours, weekBalance, onClick }) {
  const contract = employee.contract ?? 35

  let balanceText, balanceColor
  if (weekBalance === 0) {
    balanceText  = 'à l\'équilibre'
    balanceColor = 'var(--color-success)'
  } else if (weekBalance > 0) {
    balanceText  = `+${fmtDur(weekBalance)}`
    balanceColor = 'var(--color-danger)'
  } else {
    balanceText  = `−${fmtDur(Math.abs(weekBalance))}`
    balanceColor = 'var(--color-warning)'
  }

  return (
    <EntityCard
      avatar={{ initials: employee.initials }}
      title={employee.name}
      subtitle={employee.role}
      titleAddon={employee.email ? <MailIcon size={12} /> : null}
      metric={{ primary: fmtDur(weekHours), suffix: `/${contract}h` }}
      note={{ text: balanceText, color: balanceColor }}
      archived={employee.archived}
      onClick={onClick}
    />
  )
}
