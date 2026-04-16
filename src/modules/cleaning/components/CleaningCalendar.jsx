// ─── Grille semaine rooms × jours ─────────────────────────────────────────────
// Réutilise .wg-layout / .wg-header / .wg-body / .wg-row / .wg-day-cell
// du composant générique WeekGrid (design system).

import { dateToStr }    from '../../../utils/date'
import { resolveZone }  from '../utils/cleaningZones.jsx'
import CleaningZoneCard from './CleaningZoneCard'
import CleaningDayCell  from './CleaningDayCell'

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const DAY_FLEX  = [0.5, 1, 1, 1, 1, 1, 0.5]

export default function CleaningCalendar({
  weekDates,
  rooms,
  zones,
  getTasksForRoomDay,
  getRoomStats,
  getRoomActiveTaskCount,
  onCellClick,
  onRoomClick,
  onAddRoom,
}) {
  const todayStr = dateToStr(new Date())

  return (
    <div className="wg-layout">

      {/* ── En-tête colonnes jours ── */}
      <div className="wg-header">
        <div className="wg-entity-col wg-entity-col--add">
          <button
            className="wg-add-entity-btn add-trigger add-trigger--labeled"
            onClick={onAddRoom}
          >
            <span className="wg-add-label">+ Pièce</span>
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
      <div className={`wg-body ${rooms.length <= 5 ? 'wg-body--stretch' : 'wg-body--scroll'}`}>
        {rooms.map(room => {
          const resolved   = resolveZone(room)
          const zoneCount  = zones.filter(z => z.roomId === room.id).length
          const weekStats  = getRoomStats(room.id, weekDates)
          const activeCount = getRoomActiveTaskCount(room.id)

          return (
            <div key={room.id} className="wg-row">

              {/* Carte room */}
              <div className="wg-entity-col">
                <CleaningZoneCard
                  zone={resolved}
                  zoneCount={zoneCount}
                  activeCount={activeCount}
                  weekStats={weekStats}
                  onClick={() => onRoomClick(room)}
                />
              </div>

              {/* Cellules jours */}
              {weekDates.map((date, i) => {
                const ds       = dateToStr(date)
                const dayTasks = getTasksForRoomDay(room.id, date, ds)
                return (
                  <div
                    key={i}
                    className={`wg-day-cell${i === 0 || i === 6 ? ' wg-weekend' : ''}`}
                    style={{ flex: DAY_FLEX[i] }}
                  >
                    <CleaningDayCell
                      tasks={dayTasks}
                      bgColor={resolved.bgToken}
                      pillColor={resolved.pillToken}
                      dateStr={ds}
                      todayStr={todayStr}
                      isWeekend={i === 0 || i === 6}
                      onClick={() => onCellClick(resolved, room.id, ds, dayTasks)}
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
