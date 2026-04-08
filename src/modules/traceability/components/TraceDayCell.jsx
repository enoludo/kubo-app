// ─── Cellule jour d'un fournisseur dans le calendrier de traçabilité ──────────

function ProductPill({ name, nonCompliant, pillColor }) {
  const style = nonCompliant
    ? { backgroundColor: 'var(--color-white)', color: 'var(--color-danger)' }
    : { backgroundColor: pillColor, color: 'var(--text-primary)' }

  return (
    <div className="tr-product-pill" style={style}>
      <span className="tr-pill-name">{name}</span>
    </div>
  )
}

export default function TraceDayCell({ deliveries, bgColor, pillColor, dateStr, todayStr, isWeekend, onClick }) {
  const isFuture = dateStr > todayStr
  const isToday  = dateStr === todayStr

  const hasDeliveries = deliveries.length > 0

  // Aujourd'hui vide — élément unique avec .add-trigger
  if (isToday && !hasDeliveries) {
    return (
      <div
        className="tr-day-cell tr-day-cell--today add-trigger add-trigger--icon"
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label="Ajouter un produit livré"
      >
        +
      </div>
    )
  }

  let bg = 'var(--bg-subtle)'
  if (!isWeekend && hasDeliveries && !isFuture) bg = bgColor

  return (
    <div
      className={`tr-day-cell${isToday ? ' tr-day-cell--today' : ''}`}
      style={{
        background:    bg,
        pointerEvents: (isWeekend || isFuture) ? 'none' : undefined,
      }}
      onClick={(!isWeekend && !isFuture) ? onClick : undefined}
    >
      {!isWeekend && hasDeliveries && (
        <div className="tr-product-pills">
          {deliveries.map(d => (
            <ProductPill
              key={d.id}
              name={d.productName}
              nonCompliant={d.conformity === 'non_compliant'}
              pillColor={pillColor}
            />
          ))}
        </div>
      )}
    </div>
  )
}
