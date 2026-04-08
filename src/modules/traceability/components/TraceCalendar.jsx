// ─── Grille semaine fournisseurs × jours ─────────────────────────────────────
// Réutilise .wg-layout / .wg-header / .wg-body / .wg-row / .wg-day-cell

import { dateToStr }         from '../../../utils/date'
import { getSupplierColors } from '../utils/traceabilityColors'
import TraceDayCell          from './TraceDayCell'

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const DAY_FLEX  = [0.5, 1, 1, 1, 1, 1, 0.5]

function SupplierCard({ supplier, colors, onClick }) {
  const initials = supplier.name
    .split(' ')
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')

  return (
    <div className="tr-supplier-card" onClick={onClick}>
      <div className="tr-supplier-identity">
        <div className="tr-supplier-avatar" style={{ backgroundColor: colors.badgeColor }}>
          {initials}
        </div>
        <span className="tr-supplier-name">{supplier.name}</span>
      </div>
      {(supplier.contactName || supplier.contact) && (
        <div className="tr-supplier-contact">
          {supplier.contactName && (
            <span>{supplier.contactName}</span>
          )}
          {supplier.contact && (
            <a href={`tel:${supplier.contact}`} onClick={e => e.stopPropagation()}>
              {supplier.contact}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default function TraceCalendar({
  weekDates,
  suppliers,
  getDeliveriesForDay,
  onCellClick,
  onSupplierClick,
  onAddSupplier,
}) {
  const todayStr = dateToStr(new Date())

  return (
    <div className="wg-layout">

      {/* ── En-tête colonnes jours ── */}
      <div className="wg-header">
        <div className="wg-entity-col wg-entity-col--add">
          <button
            className="wg-add-entity-btn add-trigger add-trigger--labeled"
            onClick={onAddSupplier}
          >
            <span className="wg-add-label">+ Fournisseur</span>
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
      <div className={`wg-body ${suppliers.length <= 5 ? 'wg-body--stretch' : 'wg-body--scroll'}`}>
        {suppliers.map(supplier => {
          const colors = getSupplierColors(supplier)

          return (
            <div key={supplier.id} className="wg-row">

              {/* Carte fournisseur */}
              <div className="wg-entity-col">
                <SupplierCard
                  supplier={supplier}
                  colors={colors}
                  onClick={() => onSupplierClick(supplier)}
                />
              </div>

              {/* Cellules jours */}
              {weekDates.map((date, i) => {
                const ds          = dateToStr(date)
                const dayDeliveries = getDeliveriesForDay(supplier.id, ds)
                const isWeekend   = i === 0 || i === 6

                return (
                  <div
                    key={i}
                    className={`wg-day-cell${isWeekend ? ' wg-weekend' : ''}`}
                    style={{ flex: DAY_FLEX[i] }}
                  >
                    <TraceDayCell
                      deliveries={dayDeliveries}
                      bgColor={colors.bgColor}
                      pillColor={colors.pillColor}
                      dateStr={ds}
                      todayStr={todayStr}
                      isWeekend={isWeekend}
                      onClick={() => onCellClick(supplier, ds, dayDeliveries)}
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
