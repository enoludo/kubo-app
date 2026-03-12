import { useState } from 'react'
import { dnd } from '../dnd'
import { START_HOUR, END_HOUR, TOTAL_HOURS, dateToStr } from '../hooks/useSchedule'
import ShiftBlock from './ShiftBlock'

const EDGE = 4
const GAP  = 3

// ─── Layout algorithm ────────────────────────────────────────────────────────

function computeLayout(shifts) {
  if (!shifts.length) return new Map()

  const sorted = [...shifts].sort((a, b) => a.startHour - b.startHour)

  const clusters = []
  for (const shift of sorted) {
    const overlapping = clusters.filter(c =>
      c.some(s => shift.startHour < s.endHour && s.startHour < shift.endHour)
    )
    if (!overlapping.length) {
      clusters.push([shift])
    } else {
      const merged = [shift, ...overlapping.flatMap(c => c)]
      overlapping.forEach(c => clusters.splice(clusters.indexOf(c), 1))
      clusters.push(merged)
    }
  }

  const result = new Map()
  for (const cluster of clusters) {
    const byStart  = [...cluster].sort((a, b) => a.startHour - b.startHour)
    const colEnds  = []
    for (const s of byStart) {
      let col = colEnds.findIndex(end => end <= s.startHour)
      if (col === -1) col = colEnds.length
      colEnds[col] = s.endHour
      result.set(s.id, { col, totalCols: 0 })
    }
    const totalCols = colEnds.length
    for (const s of cluster) result.get(s.id).totalCols = totalCols
  }
  return result
}

function colStyle(col, totalCols) {
  const inner = `100% - ${2 * EDGE}px - ${(totalCols - 1) * GAP}px`
  const slot  = `(${inner}) / ${totalCols}`
  return {
    left:  `calc(${EDGE}px + ${col} * (${slot} + ${GAP}px))`,
    width: `calc(${slot})`,
    right: 'auto',
  }
}

const hourLines = Array.from({ length: TOTAL_HOURS }, (_, i) => i)

function snapHour(y, hourH) {
  const halfH = hourH / 2
  const slot  = Math.round(y / halfH)
  const hour  = START_HOUR + slot * 0.5
  return Math.max(START_HOUR, Math.min(END_HOUR - 0.5, hour))
}

// ─── Composant ───────────────────────────────────────────────────────────────

export default function DayColumn({
  isWeekend, flexGrow = 1,
  hourH, dayName, date, isToday,
  shifts, team, schedule, archivedIds,
  onDropEmployee, onEditShift,
}) {
  const [preview, setPreview] = useState(null)
  const layout = computeLayout(shifts)

  function getDropInfo(e) {
    const rect     = e.currentTarget.getBoundingClientRect()
    const payload  = dnd.payload
    const offsetY  = payload?.grabOffsetY ?? 0
    const y        = Math.max(0, e.clientY - rect.top - offsetY)
    const start    = snapHour(y, hourH)
    let   duration = 4

    if (payload?.type === 'move-shift') {
      const s = schedule.shifts.find(sh => sh.id === payload.shiftId)
      if (s) duration = s.endHour - s.startHour
    }

    const employeeId =
      payload?.type === 'new-shift'  ? payload.employeeId :
      payload?.type === 'move-shift' ? schedule.shifts.find(s => s.id === payload.shiftId)?.employeeId :
      null

    return { start, duration, employeeId }
  }

  function handleDragOver(e) {
    e.preventDefault()
    const { start, duration, employeeId } = getDropInfo(e)
    e.dataTransfer.dropEffect = dnd.payload?.type === 'move-shift' ? 'move' : 'copy'
    setPreview({ startHour: start, duration, employeeId })
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setPreview(null)
  }

  function handleDrop(e) {
    e.preventDefault()
    const { start } = getDropInfo(e)
    const payload   = dnd.payload

    if (payload?.type === 'new-shift' && date) {
      onDropEmployee(payload.employeeId, date, start)
    } else if (payload?.type === 'move-shift' && date) {
      schedule.moveShift(payload.shiftId, dateToStr(date), start)
    }

    dnd.clear()
    setPreview(null)
  }

  return (
    <div
      className={`day-column${isWeekend ? ' weekend' : ''}`}
      style={{ flex: flexGrow }}
    >
      <div className={`day-col-header${isToday ? ' today' : ''}`}>
        <span className="day-name">{dayName}</span>
        <span className="day-date">{date?.getDate()}</span>
      </div>

      <div
        className="day-col-grid"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hourLines.map(i => (
          <div key={i} className="hour-line" style={{ top: i * hourH }} />
        ))}

        {preview && (() => {
          const emp    = team.find(e => e.id === preview.employeeId)
          const top    = (preview.startHour - START_HOUR) * hourH
          const maxH   = (END_HOUR - preview.startHour) * hourH
          const height = Math.min(preview.duration * hourH, maxH)
          return (
            <div
              className="drop-preview"
              style={{
                top, height,
                background:  emp ? `${emp.color}30` : 'rgba(124,111,205,0.15)',
                borderColor: emp?.color ?? '#7C6FCD',
              }}
            />
          )
        })()}

        {shifts.map(shift => {
          const { col, totalCols } = layout.get(shift.id) ?? { col: 0, totalCols: 1 }
          const isArchived = archivedIds.has(shift.employeeId)
          return (
            <ShiftBlock
              key={shift.id}
              shift={shift}
              employee={team.find(e => e.id === shift.employeeId)}
              hourH={hourH}
              colStyle={colStyle(col, totalCols)}
              totalCols={totalCols}
              isArchived={isArchived}
              onRemove={isArchived ? undefined : () => schedule.removeShift(shift.id)}
              onEdit={isArchived ? undefined : () => onEditShift(shift.id)}
            />
          )
        })}
      </div>
    </div>
  )
}
