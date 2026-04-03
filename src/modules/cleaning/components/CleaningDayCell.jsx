// ─── Cellule jour d'une zone dans le calendrier de nettoyage ─────────────────
import CleaningTaskPill from './CleaningTaskPill'

export default function CleaningDayCell({
  tasks,
  bgColor,
  pillColor,
  dateStr,
  todayStr,
  isWeekend,
  onClick,
}) {
  const isFuture = dateStr > todayStr
  const isToday  = dateStr === todayStr
  const isPast   = !isFuture && !isToday

  const doneCount = tasks.filter(t => t.status === 'done').length
  const hasDone   = doneCount > 0

  // ── Fond selon priorité ───────────────────────────────────────────────────
  // Lundi/Dimanche → toujours subtle, sans exception
  let bg = 'var(--bg-subtle)'
  if (!isWeekend) {
    if (isToday || isPast) {
      if (hasDone) bg = bgColor  // ≥1 done → couleur zone -100
    }
    // Futur → toujours subtle
  }

  const style = {
    background:    bg,
    border:        isToday ? '1px dashed var(--color-grey-500)' : undefined,
    pointerEvents: isFuture ? 'none' : undefined,
  }

  return (
    <div
      className="cln-day-cell"
      style={style}
      onClick={(!isWeekend && !isFuture) ? onClick : undefined}
    >
      {isWeekend ? null : tasks.length === 0 ? (
        <span className="cln-day-cell-empty">—</span>
      ) : (
        tasks.map(task => (
          <CleaningTaskPill
            key={task.id}
            task={task}
            pillColor={pillColor}
            isPast={isPast}
            isToday={isToday}
          />
        ))
      )}
    </div>
  )
}
