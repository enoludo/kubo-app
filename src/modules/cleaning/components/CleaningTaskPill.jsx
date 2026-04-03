// ─── Pill de tâche dans une cellule du calendrier ────────────────────────────

export default function CleaningTaskPill({ task, pillColor, isPast, isToday }) {
  const { status } = task

  let bg    = 'var(--color-white)'
  let color = 'var(--text-primary)'

  if (isPast) {
    if (status === 'done') {
      bg    = pillColor   // zone -200
      color = 'var(--text-primary)'
    } else {
      // pending ou late
      bg    = 'var(--color-white)'
      color = 'var(--color-danger)'
    }
  } else if (isToday) {
    if (status === 'done') {
      bg    = pillColor   // zone -200
      color = 'var(--text-primary)'
    }
    // pending → white + text-primary (défaut)
  }
  // Futur → défaut (white + text-primary)

  return (
    <div
      className={`cln-task-pill cln-task-pill--${status}`}
      style={{ backgroundColor: bg, color }}
    >
      <span className="cln-pill-name">{task.name}</span>
    </div>
  )
}
