import { dnd } from '../dnd'
import { START_HOUR } from '../hooks/useSchedule'

function fmt(h) {
  return `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 === 0.5 ? '30' : '00'}`
}

function isDark(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 140
}

export default function ShiftBlock({
  shift, employee, hourH, colStyle, totalCols = 1,
  isArchived, onRemove, onEdit,
}) {
  if (!employee) return null

  const top       = (shift.startHour - START_HOUR) * hourH
  const height    = (shift.endHour - shift.startHour) * hourH
  const textColor = isDark(employee.color) ? '#ffffff' : '#222233'

  const narrow      = totalCols >= 3
  const showTime    = height >= 28
  const showDur     = height >= 58 && totalCols === 1
  const effectiveDur = (shift.endHour - shift.startHour) - (shift.pause ?? 0)
  const showEff      = (shift.pause ?? 0) > 0 && height >= 58

  function handleDragStart(e) {
    if (isArchived) { e.preventDefault(); return }
    e.stopPropagation()
    const grabOffsetY = e.clientY - e.currentTarget.getBoundingClientRect().top
    dnd.set({ type: 'move-shift', shiftId: shift.id, grabOffsetY })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(shift.id))
  }

  return (
    <div
      className="shift-block"
      draggable={!isArchived}
      onDragStart={handleDragStart}
      onClick={isArchived ? undefined : onEdit}
      style={{
        top,
        height,
        background: employee.color,
        color: textColor,
        opacity: isArchived ? 0.5 : 1,
        cursor: isArchived ? 'default' : 'grab',
        ...colStyle,
      }}
    >
      {!isArchived && (
        <button
          className="shift-remove"
          style={{ color: textColor }}
          onClick={e => { e.stopPropagation(); onRemove() }}
        >×</button>
      )}

      <div className="shift-content" style={narrow ? { gap: 1 } : undefined}>
        <span className="shift-name" style={narrow ? { fontSize: '10px' } : undefined}>
          {employee.name.split(' ')[0]}
        </span>
        {showTime && (
          <span className="shift-time" style={narrow ? { fontSize: '8.5px' } : undefined}>
            {fmt(shift.startHour)}–{fmt(shift.endHour)}
          </span>
        )}
        {showDur && !showEff && (
          <span className="shift-duration">{shift.endHour - shift.startHour}h</span>
        )}
        {showEff && (
          <span className="shift-effective">
            {(() => {
              const m = Math.round(effectiveDur * 60)
              const h = Math.floor(m / 60)
              const r = m % 60
              return r === 0 ? `${h}h` : `${h}h${String(r).padStart(2, '0')}`
            })()} eff.
          </span>
        )}
      </div>
    </div>
  )
}
