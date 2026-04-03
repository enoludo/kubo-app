// ─── Grille semaine fournisseurs × jours ─────────────────────────────────────
// Réutilise .wg-layout / .wg-header / .wg-body / .wg-row / .wg-day-cell

import { dateToStr }       from '../../../utils/date'
import { getCategoryTokens } from '../../../data/categories'
import TraceDayCell        from './TraceDayCell'

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const DAY_FLEX  = [0.5, 1, 1, 1, 1, 1, 0.5]

function SupplierCard({ supplier, categoryLabel, bgColor, onClick }) {
  const initials = supplier.name
    .split(' ')
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')

  return (
    <div className="tr-supplier-card" onClick={onClick}>
      <div className="tr-supplier-avatar" style={{ backgroundColor: bgColor }}>
        {initials}
      </div>
      <div className="tr-supplier-identity">
        <span className="tr-supplier-name">{supplier.name}</span>
        <span className="tr-supplier-category">{categoryLabel}</span>
      </div>
    </div>
  )
}

export default function TraceCalendar({
  weekDates,
  suppliers,
  categories,
  getReceptionsForDay,
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
          const tokens  = getCategoryTokens(supplier.category)
          const catObj  = categories.find(c => c.id === supplier.category)
          const catLabel = catObj?.label ?? supplier.category

          return (
            <div key={supplier.id} className="wg-row">

              {/* Carte fournisseur */}
              <div className="wg-entity-col">
                <SupplierCard
                  supplier={supplier}
                  categoryLabel={catLabel}
                  bgColor={tokens.badge}
                  onClick={() => onSupplierClick(supplier)}
                />
              </div>

              {/* Cellules jours */}
              {weekDates.map((date, i) => {
                const ds         = dateToStr(date)
                const dayRecs    = getReceptionsForDay(supplier.id, ds)
                const isWeekend  = i === 0 || i === 6

                return (
                  <div
                    key={i}
                    className={`wg-day-cell${isWeekend ? ' wg-weekend' : ''}`}
                    style={{ flex: DAY_FLEX[i] }}
                  >
                    <TraceDayCell
                      receptions={dayRecs}
                      bgColor={tokens.bg}
                      dateStr={ds}
                      todayStr={todayStr}
                      isWeekend={isWeekend}
                      onClick={() => onCellClick(supplier, ds, dayRecs)}
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
