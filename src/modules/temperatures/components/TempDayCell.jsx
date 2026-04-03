// ─── Cellule jour × équipement ───────────────────────────────────────────────
import { isOutOfRange } from '../hooks/useTemperatures'
import { getEquipColor } from '../utils/tempColors.jsx'

function fmtTemp(t) {
  const n = Number(t)
  return `${n > 0 ? '+' : ''}${n}°C`
}

export default function TempDayCell({ equipment, date, readings, onClick }) {
  const palette = getEquipColor(equipment)
  const isEmpty = readings.length === 0

  const today    = new Date(); today.setHours(0, 0, 0, 0)
  const cellDate = new Date(date); cellDate.setHours(0, 0, 0, 0)
  const isPast   = cellDate < today
  const isFuture = cellDate > today
  const bg       = isEmpty ? undefined : palette.c100

  if (isEmpty) {
    if (isFuture) {
      // Futur sans relevé — non cliquable, pas de bordure pointillée
      return (
        <div
          className="day-card tdc-future-empty"
          aria-hidden="true"
        />
      )
    }

    if (isPast) {
      // Passé sans relevé — cliquable, "Aucun relevé"
      return (
        <div
          className="day-card tdc-past-empty"
          onClick={onClick}
          role="button"
          tabIndex={0}
          aria-label={`Ajouter relevé ${equipment.name} — ${date}`}
        >
          <span className="tdc-no-reading">Aucun relevé</span>
        </div>
      )
    }

    // Aujourd'hui sans relevé — comportement original
    return (
      <div
        className="day-card day-card--empty add-trigger add-trigger--icon"
        style={{ '--card-border': palette.c300 }}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`Ajouter relevé ${equipment.name} — ${date}`}
      >
        +
      </div>
    )
  }

  const sorted   = [...readings].sort((a, b) => a.time.localeCompare(b.time))
  const hasAlert = readings.some(r => isOutOfRange(r, equipment))

  return (
    <div
      className="day-card"
      style={{ background: bg, '--card-border': palette.c300 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Relevés ${equipment.name} — ${date}`}
    >

      {hasAlert && (
        <span className="temp-day-badge temp-day-badge--alert">⚠ Hors plage</span>
      )}

      <div className="day-card-work">
        {sorted.map(r => {
          const alert = isOutOfRange(r, equipment)
          return (
            <div key={r.id} className="tdc-reading">
              <div className="tdc-row" style={{ backgroundColor: palette.c200 }}>
                <span className="tdc-time">{r.time}</span>
                <span className={`tdc-temp${alert ? ' tdc-temp--alert' : ''}`}>
                  {fmtTemp(r.temperature)}
                </span>
              </div>
              {r.comment && (
                <div className="tdc-comment">1 commentaire</div>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}
