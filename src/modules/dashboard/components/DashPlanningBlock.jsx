// ─── DashPlanningBlock — Planning du jour ─────────────────────────────────────
import { useMemo }         from 'react'
import { IconPlanning }    from './DashIcons'
import { fmtTime }         from '../../../utils/date'
import { WEEKLY_CONTRACT } from '../../planning/hooks/useSchedule'
import ShiftTypeBadge      from '../../../design-system/components/ShiftTypeBadge/ShiftTypeBadge'

const FULL_WIDTH_TYPES = new Set(['rest', 'school', 'sick', 'absent', 'leave'])

const START_HOUR  = 5
const END_HOUR    = 21
const TOTAL_HOURS = END_HOUR - START_HOUR

function pct(hour) {
  return ((hour - START_HOUR) / TOTAL_HOURS) * 100
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

function fmtDur(h) {
  const totalMin = Math.round(Math.abs(h) * 60)
  const hours    = Math.floor(totalMin / 60)
  const mins     = totalMin % 60
  return mins === 0 ? `${hours}h` : `${hours}h${String(mins).padStart(2, '0')}`
}

function formatBalance(balance) {
  if (balance === 0) return 'à l\'équilibre'
  if (balance > 0)   return `+${fmtDur(balance)}`
  return `−${fmtDur(Math.abs(balance))}`
}

function balanceClass(balance) {
  if (balance === 0) return 'dash-planning-balance--neutral'
  return balance > 0 ? 'dash-planning-balance--positive' : 'dash-planning-balance--negative'
}

export default function DashPlanningBlock({ schedule, team, todayStr, onNavigate }) {
  const nowHour = useMemo(() => {
    const now = new Date()
    return now.getHours() + now.getMinutes() / 60
  }, [])

  const activeTeam = useMemo(() => team.filter(e => !e.archived), [team])

  const todayShiftsByEmployee = useMemo(() => {
    const map = new Map()
    for (const emp of activeTeam) {
      const shifts = schedule.shifts.filter(
        s => s.employeeId === emp.id && s.date === todayStr
      )
      if (shifts.length > 0) map.set(emp.id, shifts)
    }
    return map
  }, [schedule.shifts, activeTeam, todayStr])

  const employeesWithShift = activeTeam.filter(e => todayShiftsByEmployee.has(e.id))

  const showNow = nowHour >= START_HOUR && nowHour <= END_HOUR
  const nowPct  = showNow ? pct(nowHour) : null

  return (
    <div className="dash-card">
      <div className="dash-block-header">
        <div className="dash-block-header-left">
          <span className="dash-module-icon"><IconPlanning /></span>
          <span className="dash-block-title">Planning du jour</span>
        </div>
        
      </div>

      {employeesWithShift.length === 0 ? (
        <p className="dash-block-empty">Aucun shift aujourd'hui.</p>
      ) : (
        <div className="dash-planning-grid">
          {employeesWithShift.map(emp => {
            const shifts   = todayShiftsByEmployee.get(emp.id)
            const balance  = schedule.getBalance(emp.id, emp.contract ?? WEEKLY_CONTRACT, emp.startBalance ?? 0)

            return (
              <div key={emp.id} className="dash-planning-row">

                <div className="dash-planning-name-cell">
                  <span className="dash-planning-name">{emp.name}</span>
                  <span className={`dash-planning-balance ${balanceClass(balance)}`}>
                    {formatBalance(balance)}
                  </span>
                </div>

                <div className="dash-planning-timeline-cell">
                  <div className="dash-timeline-rail">
                    {showNow && (
                      <div className="dash-timeline-past" style={{ width: `${nowPct}%` }} />
                    )}
                    {shifts.map(shift => {
                      const type = shift.type ?? 'work'

                      if (FULL_WIDTH_TYPES.has(type)) {
                        const fullPastPct = showNow ? Math.min(100, Math.max(0, nowPct)) : 0
                        return (
                          <div
                            key={shift.id}
                            className={`dash-timeline-block dash-timeline-block--full dash-timeline-block--${type}`}
                          >
                            {fullPastPct > 0 && (
                              <div className="dash-timeline-block-past" style={{ width: `${fullPastPct}%` }} />
                            )}
                            <ShiftTypeBadge type={type} />
                          </div>
                        )
                      }

                      const start = clamp(shift.startHour, START_HOUR, END_HOUR)
                      const end   = clamp(shift.endHour,   START_HOUR, END_HOUR)
                      const left  = pct(start)
                      const width = pct(end) - left
                      const blockPastPct = showNow
                        ? Math.min(100, Math.max(0, (nowHour - start) / (end - start) * 100))
                        : 0
                      return (
                        <div
                          key={shift.id}
                          className={`dash-timeline-block dash-timeline-block--${type}`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                        >
                          {blockPastPct > 0 && (
                            <div className="dash-timeline-block-past" style={{ width: `${blockPastPct}%` }} />
                          )}
                          <span className="dash-timeline-start">{fmtTime(start)}</span>
                          {(shift.pause ?? 0) > 0 && (
                            <span className="dash-timeline-pause">{shift.pause} min. pause</span>
                          )}
                          <span className="dash-timeline-end">{fmtTime(end)}</span>
                        </div>
                      )
                    })}
                    {showNow && (
                      <div className="dash-now-line" style={{ left: `${nowPct}%` }} />
                    )}
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
