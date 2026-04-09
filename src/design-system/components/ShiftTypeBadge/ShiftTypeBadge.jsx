// ─── ShiftTypeBadge — Badge de type de shift ──────────────────────────────────
import './ShiftTypeBadge.css'

const SHIFT_TYPES = {
  rest:    { label: 'Repos',   mod: 'rest' },
  school:  { label: 'École',   mod: 'school' },
  sick:    { label: 'Maladie', mod: 'sick' },
  absent:  { label: 'Absent',  mod: 'absent' },
  leave:   { label: 'Congés',  mod: 'leave' },
}

export default function ShiftTypeBadge({ type }) {
  const def = SHIFT_TYPES[type]
  if (!def) return null

  return (
    <span className={`shift-type-badge shift-type-badge--${def.mod}`}>
      {def.label}
    </span>
  )
}
