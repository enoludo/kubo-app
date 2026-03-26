import { weeksElapsed, WEEKLY_CONTRACT } from '../hooks/useSchedule'

export default function Footer({ team, schedule, weekDates }) {
  const weeks    = weeksElapsed()
  const expected = weeks * WEEKLY_CONTRACT

  return (
    <footer className="footer">
      {team.map(emp => {
        const totalHours = schedule.getTotalHours(emp.id)
        const weekHours  = schedule.getWeekHours(emp.id, weekDates)
        const pct        = Math.min((totalHours / expected) * 100, 100)
        const over       = totalHours > expected

        return (
          <div key={emp.id} className="footer-emp">
            <div className="footer-avatar">
              {emp.initials}
            </div>
            <div className="footer-bar-area">
              <div className="footer-name">{emp.name.split(' ')[0]}</div>
              <div className="footer-track">
                <div
                  className="footer-fill"
                  style={{
                    width: `${pct}%`,
                    background: over ? 'var(--color-danger)' : 'var(--color-success)',
                  }}
                />
              </div>
            </div>
            <span className={`footer-hours${over ? ' over' : ''}`}>
              {totalHours}
              <span className="footer-contract">/{expected}h</span>
            </span>
          </div>
        )
      })}
    </footer>
  )
}
