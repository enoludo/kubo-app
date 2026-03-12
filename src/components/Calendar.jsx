import { useRef, useState, useEffect } from 'react'
import DayColumn from './DayColumn'
import { START_HOUR, TOTAL_HOURS, dateToStr } from '../hooks/useSchedule'

const DAYS      = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const TIME_LBLS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i)

const HEADER_H = 56

export default function Calendar({
  team, schedule, dates,
  visibleIds, archivedIds,
  onDropEmployee, onEditShift,
}) {
  const bodyRef = useRef(null)
  const [hourH, setHourH] = useState(48)

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      setHourH((entry.contentRect.height - HEADER_H) / TOTAL_HOURS)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const today   = new Date()
  const isToday = d => d && d.toDateString() === today.toDateString()

  return (
    <div className="calendar-wrap">
      <div className="calendar">
        <div className="cal-body" ref={bodyRef}>

          <div className="time-gutter-body">
            <div className="time-gutter-spacer" />
            <div className="time-gutter-grid">
              {TIME_LBLS.map((h, i) => (
                <div key={h} className="time-label" style={{ top: i * hourH }}>
                  {h}:00
                </div>
              ))}
            </div>
          </div>

          {DAYS.map((day, dayIndex) => {
            const date    = dates?.[dayIndex]
            const dateStr = date ? dateToStr(date) : null
            const shifts  = dateStr
              ? schedule.shifts.filter(s => s.date === dateStr && visibleIds.has(s.employeeId))
              : []
            return (
              <DayColumn
                key={day}
                dayIndex={dayIndex}
                isWeekend={dayIndex === 0 || dayIndex === 6}
                flexGrow={dayIndex === 0 || dayIndex === 6 ? 0.5 : 1}
                hourH={hourH}
                dayName={day}
                date={date}
                isToday={isToday(date)}
                shifts={shifts}
                team={team}
                schedule={schedule}
                archivedIds={archivedIds}
                onDropEmployee={onDropEmployee}
                onEditShift={onEditShift}
              />
            )
          })}

        </div>
      </div>
    </div>
  )
}
