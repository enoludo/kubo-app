import EmployeeCard from './EmployeeCard'

export default function Sidebar({
  team, schedule, weekDates,
  empFilter, setEmpFilter,
  onAddEmployee, onEditEmployee, onArchiveEmployee, onDeleteEmployee, onSendEmail,
}) {
  const visibleTeam = team.filter(e => {
    if (empFilter === 'active')   return !e.archived
    if (empFilter === 'archived') return  e.archived
    return true
  })

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-label">Équipe</span>
        <span className="sidebar-hint">Glisser sur le planning</span>
      </div>

      <div className="sidebar-filter">
        <select value={empFilter} onChange={e => setEmpFilter(e.target.value)}>
          <option value="active">Équipe active</option>
          <option value="archived">Archivés uniquement</option>
          <option value="all">Tous</option>
        </select>
      </div>

      <div className="sidebar-list">
        {visibleTeam.map(emp => {
          const wb = schedule.getWeekBalance(emp.id, weekDates, emp.contract ?? 35)
          return (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              weekHours={wb.weekHours}
              weekBalance={wb.weekBalance}
              onEdit={() => onEditEmployee(emp)}
              onArchive={() => onArchiveEmployee(emp)}
              onDelete={() => onDeleteEmployee(emp)}
              onSendEmail={() => onSendEmail(emp)}
            />
          )
        })}
      </div>

      <button className="sidebar-add-btn" onClick={onAddEmployee}>
        + Ajouter un employé
      </button>

      <div className="sidebar-legend">
        <span className="legend-item legend-work">■ Présent</span>
        <span className="legend-item legend-absent">░ Absent</span>
        <span className="legend-item legend-leave">□ Congés</span>
      </div>
    </aside>
  )
}
