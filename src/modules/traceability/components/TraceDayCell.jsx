// ─── Cellule jour d'un fournisseur dans le calendrier de traçabilité ──────────

const STATUS_META = {
  compliant:     { label: 'Conforme',    bg: 'var(--tr-status-compliant-bg)',     color: 'var(--tr-status-compliant-text)'     },
  non_compliant: { label: 'Non conforme', bg: 'var(--tr-status-non-compliant-bg)', color: 'var(--tr-status-non-compliant-text)' },
  pending:       { label: 'En attente',  bg: 'var(--tr-status-pending-bg)',       color: 'var(--tr-status-pending-text)'       },
}

function ReceptionPill({ reception }) {
  const meta = STATUS_META[reception.conformity] ?? STATUS_META.pending
  return (
    <div
      className="tr-reception-pill"
      style={{ backgroundColor: meta.bg, color: meta.color }}
    >
      <span className="tr-pill-label">{meta.label}</span>
    </div>
  )
}

export default function TraceDayCell({ receptions, bgColor, dateStr, todayStr, isWeekend, onClick }) {
  const isFuture = dateStr > todayStr
  const isToday  = dateStr === todayStr
  const isPast   = !isFuture && !isToday

  const hasCompliant = receptions.some(r => r.conformity === 'compliant')
  const hasBg = !isWeekend && (isToday || isPast) && hasCompliant

  const style = {
    background:    hasBg ? bgColor : 'var(--bg-subtle)',
    border:        isToday ? '1px dashed var(--color-grey-500)' : undefined,
    pointerEvents: (isWeekend || isFuture) ? 'none' : undefined,
  }

  return (
    <div
      className="tr-day-cell"
      style={style}
      onClick={(!isWeekend && !isFuture) ? onClick : undefined}
    >
      {isWeekend ? null : receptions.length === 0 ? (
        <span className="tr-day-cell-empty">—</span>
      ) : (
        receptions.map(r => (
          <ReceptionPill key={r.id} reception={r} />
        ))
      )}

      {/* Bouton + — jours vides, non passés */}
      {!isWeekend && !isFuture && receptions.length === 0 && (
        <button
          className="tr-day-add add-trigger add-trigger--icon"
          onClick={e => { e.stopPropagation(); onClick?.() }}
          aria-label="Ajouter une réception"
        >
          +
        </button>
      )}
    </div>
  )
}
