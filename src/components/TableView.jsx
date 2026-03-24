import { dateToStr } from '../hooks/useSchedule'
import { getHolidayName } from '../utils/frenchHolidays'
import DayCard      from './DayCard'
import EmployeeCard from './EmployeeCard'

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const DAY_FLEX  = [0.5, 1, 1, 1, 1, 1, 0.5]

const noop = () => {}

export default function TableView({
  team, schedule, weekDates, visibleIds,
  onAddForDay, onEditShift, onToggleValidated,
  onEmployeeClick, onAddEmployee,
}) {
  const visibleTeam = team.filter(e => visibleIds.has(e.id))

  return (
    <div className="table-view">

      {/* En-tête des colonnes jours */}
      <div className="tv-header-row">
        <div className="tv-emp-col tv-emp-col--add">
          <button className="tv-add-employee-btn add-trigger add-trigger--labeled" onClick={onAddEmployee}>
            
            <span className="tv-add-label">+ Employé</span>
          </button>
        </div>
        {weekDates.map((date, i) => {
          const holiday = getHolidayName(date)
          return (
            <div
              key={i}
              className={`tv-day-header${i === 0 || i === 6 ? ' tv-weekend' : ''}${holiday ? ' tv-holiday' : ''}`}
              style={{ flex: DAY_FLEX[i] }}
            >
              <span className="tv-hdr-name">{DAY_NAMES[i]}</span>
              <span className="tv-hdr-date">
                {String(date.getDate()).padStart(2, '0')}/{String(date.getMonth() + 1).padStart(2, '0')}
              </span>
              {holiday && (
                <span className="tv-hdr-holiday" title={holiday}>
                  <span className="tv-hdr-holiday-dot" />
                  {holiday}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Lignes employés */}
      <div className="tv-body">
        {visibleTeam.map(emp => {
          const wb = schedule.getWeekBalance(emp.id, weekDates, emp.contract ?? 35, emp.startBalance ?? 0)

          return (
            <div key={emp.id} className="tv-emp-row">

              {/* Cellule employé */}
              <div className="tv-emp-col">
                <EmployeeCard
                  employee={emp}
                  weekHours={wb.weekHours}
                  weekBalance={wb.weekBalance}
                  onClick={() => (onEmployeeClick ?? noop)(emp)}
                />
              </div>

              {/* Cards par jour */}
              {weekDates.map((date, i) => {
                const dateStr   = dateToStr(date)
                const holiday   = getHolidayName(date)
                const dayShifts = schedule.shifts.filter(
                  s => s.employeeId === emp.id && s.date === dateStr
                )
                return (
                  <div
                    key={i}
                    className={`tv-day-cell${i === 0 || i === 6 ? ' tv-weekend' : ''}${holiday ? ' tv-holiday' : ''}`}
                    style={{ flex: DAY_FLEX[i] }}
                  >
                    <DayCard
                      employee={emp}
                      shifts={dayShifts}
                      onAdd={() => onAddForDay(emp.id, date, (i === 0 || i === 6) ? 'rest' : undefined)}
                      onEdit={onEditShift}
                      onToggleValidated={onToggleValidated}
                      defaultType={dayShifts.length === 0 && (i === 0 || i === 6) ? 'rest' : undefined}
                    />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
