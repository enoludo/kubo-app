// ─── Grille semaine équipements × jours ─────────────────────────────────────
// Structure identique à TableView du Planning :
// .wg-layout > .wg-header > .wg-entity-col + .wg-day-header × 7
//            > .wg-body   > .wg-row × n
//              > .wg-entity-col + .wg-day-cell × 7

import { dateToStr } from '../../../utils/date'
import TempEquipmentCard from './TempEquipmentCard'
import TempDayCell       from './TempDayCell'

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const DAY_FLEX  = [0.5, 1, 1, 1, 1, 1, 0.5]

export default function TempCalendar({ equipment, readings, weekDates, onCellClick, onEditEquipment, onAddEquipment }) {
  const todayStr = dateToStr(new Date())

  return (
    <div className="wg-layout">

      {/* ── En-tête colonnes jours ── */}
      <div className="wg-header">
        <div className="wg-entity-col wg-entity-col--add">
          <button
            className="wg-add-entity-btn add-trigger add-trigger--labeled"
            onClick={onAddEquipment}
          >
            <span className="wg-add-label">+ Équipement</span>
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
      <div className={`wg-body ${equipment.length <= 5 ? 'wg-body--stretch' : 'wg-body--scroll'}`}>

        {equipment.length === 0 ? (
          <div className="temp-empty">
            Aucun équipement. Ajoutez-en un avec le bouton&nbsp;<strong>+ Équipement</strong>.
          </div>
        ) : (
          equipment.map(eq => (
            <div key={eq.id} className="wg-row">

              {/* Carte équipement */}
              <div className="wg-entity-col">
                <TempEquipmentCard equipment={eq} onEdit={onEditEquipment} />
              </div>

              {/* Cellules jours */}
              {weekDates.map((date, i) => {
                const ds          = dateToStr(date)
                const dayReadings = readings.filter(r => r.equipmentId === eq.id && r.date === ds)
                return (
                  <div
                    key={i}
                    className={`wg-day-cell${i === 0 || i === 6 ? ' wg-weekend' : ''}`}
                    style={{ flex: DAY_FLEX[i] }}
                  >
                    <TempDayCell
                      equipment={eq}
                      date={ds}
                      readings={dayReadings}
                      onClick={() => onCellClick(eq, ds)}
                    />
                  </div>
                )
              })}

            </div>
          ))
        )}

      </div>

    </div>
  )
}
