// ─── Grille semaine zones × jours ────────────────────────────────────────────
// Réutilise .wg-layout / .wg-header / .wg-body / .wg-row / .wg-day-cell
// du composant générique WeekGrid (design system).

import { dateToStr }       from '../../../utils/date'
import { resolveZone }     from '../utils/cleaningZones.jsx'
import CleaningZoneCard    from './CleaningZoneCard'
import CleaningDayCell     from './CleaningDayCell'

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const DAY_FLEX  = [0.5, 1, 1, 1, 1, 1, 0.5]

export default function CleaningCalendar({
  weekDates,
  zones,
  getTasksForDay,
  getZoneStats,
  getZoneActiveCount,
  onCellClick,
  onZoneClick,
  onAddZone,
}) {
  const todayStr = dateToStr(new Date())

  return (
    <div className="wg-layout">

      {/* ── En-tête colonnes jours ── */}
      <div className="wg-header">
        <div className="wg-entity-col wg-entity-col--add">
          <button
            className="wg-add-entity-btn add-trigger add-trigger--labeled"
            onClick={onAddZone}
          >
            <span className="wg-add-label">+ Zone</span>
          </button>
        </div>

        {weekDates.map((date, i) => {
          const isToday = dateToStr(date) === todayStr
          return (
            <div
              key={i}
              className={`wg-day-header${i === 0 || i === 6 ? ' wg-weekend' : ''}`}
              style={{ flex: DAY_FLEX[i] }}
            >
              <span className={`wg-hdr-name${isToday ? ' is-today' : ''}`}>{DAY_NAMES[i]}</span>
              <span className={`wg-hdr-date${isToday ? ' is-today' : ''}`}>
                {String(date.getDate()).padStart(2, '0')}/{String(date.getMonth() + 1).padStart(2, '0')}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── Corps scrollable ── */}
      <div className={`wg-body ${zones.length <= 5 ? 'wg-body--stretch' : 'wg-body--scroll'}`}>
        {zones.map(rawZone => {
          const zone = resolveZone(rawZone)
          return (
          <div key={zone.id} className="wg-row">

            {/* Carte zone */}
            <div className="wg-entity-col">
              <CleaningZoneCard
                zone={zone}
                activeCount={getZoneActiveCount(zone.id)}
                weekStats={getZoneStats(zone.id, weekDates)}
                onClick={() => onZoneClick(rawZone)}
              />
            </div>

            {/* Cellules jours */}
            {weekDates.map((date, i) => {
              const ds        = dateToStr(date)
              const dayTasks  = getTasksForDay(date, ds).filter(t => t.zone === zone.id)
              return (
                <div
                  key={i}
                  className={`wg-day-cell${i === 0 || i === 6 ? ' wg-weekend' : ''}`}
                  style={{ flex: DAY_FLEX[i] }}
                >
                  <CleaningDayCell
                    tasks={dayTasks}
                    bgColor={zone.bgToken}
                    pillColor={zone.pillToken}
                    dateStr={ds}
                    todayStr={todayStr}
                    isWeekend={i === 0 || i === 6}
                    onClick={() => onCellClick(zone, ds, dayTasks)}
                  />
                </div>
              )
            })}

          </div>
          )
        })}
      </div>

    </div>
  )
}
