// ─── Calendrier mensuel des commandes ─────────────────────────────────────────
import { dateToStr } from '../../utils/date'

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

const CHANNEL_LABEL = { web: 'site web', boutique: 'boutique', brunch: 'brunch' }
// Ordre d'affichage des pills dans chaque cellule
const CHANNEL_ORDER = ['boutique', 'web', 'brunch']

// ── Grille 6 × 7 (42 cellules) couvrant toujours le mois entier ──────────────

function buildGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const firstDow = (firstDay.getDay() + 6) % 7  // Mon=0 … Sun=6
  const start    = new Date(year, month, 1 - firstDow)

  const weeks = []
  for (let w = 0; w < 6; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const cell = new Date(start)
      cell.setDate(start.getDate() + w * 7 + d)
      week.push(cell)
    }
    weeks.push(week)
  }
  return weeks
}

// ── Pill canal ────────────────────────────────────────────────────────────────

function OrderPill({ channel, count }) {
  return (
    <div className={`order-pill order-pill--${channel}`}>
      <span className="order-pill-dot" />
      <span className="order-pill-text">{count} {CHANNEL_LABEL[channel]}</span>
    </div>
  )
}

// ── Cellule jour ──────────────────────────────────────────────────────────────

function OrderDayCell({ date, orders, isCurrentMonth, isToday, isPast, onAddOrder, onDayClick, onSaturdayClick }) {
  const byChannel  = {}
  for (const o of orders) byChannel[o.channel] = (byChannel[o.channel] || 0) + 1
  const channels   = CHANNEL_ORDER.filter(c => byChannel[c])
  const hasOrders  = orders.length > 0
  const isSaturday = date.getDay() === 6

  function handleClick() {
    if (!isCurrentMonth) return
    if (isPast && !hasOrders) return    // date passée sans commande : aucune action
    if (hasOrders) {
      onDayClick(date, orders)          // → OrderDayModal (jour avec commandes)
    } else if (isSaturday) {
      onSaturdayClick(date)             // → SaturdayChoiceModal
    } else {
      onAddOrder(date)                  // → NewOrderModal directement
    }
  }

  return (
    <div
      className={[
        'order-day-cell',
        !isCurrentMonth                              ? 'order-day-cell--outside'    : '',
        isToday                                      ? 'order-day-cell--today'      : '',
        hasOrders                                    ? 'order-day-cell--has-orders' : '',
        isCurrentMonth && !hasOrders && !isSaturday  ? 'order-day-cell--empty'      : '',
        isCurrentMonth                               ? 'order-day-cell--clickable'  : '',
        isPast && isCurrentMonth                     ? 'order-day-cell--past'       : '',
      ].filter(Boolean).join(' ')}
      onClick={handleClick}
      role={isCurrentMonth ? 'button' : undefined}
      tabIndex={isCurrentMonth ? 0 : undefined}
    >
      <div className="order-day-num">{date.getDate()}</div>

<div className="order-day-content">
        {channels.map(c => (
          <OrderPill key={c} channel={c} count={byChannel[c]} />
        ))}

        {/* Bouton + — cellules vides, non samedi, non passées */}
        {!hasOrders && !isSaturday && isCurrentMonth && !isPast && (
          <button
            className="order-day-add add-trigger add-trigger--icon"
            onClick={e => { e.stopPropagation(); onAddOrder(date) }}
            aria-label="Ajouter une commande"
          >
            +
          </button>
        )}
      </div>
    </div>
  )
}

// ── Calendrier principal ──────────────────────────────────────────────────────

export default function OrdersCalendar({ year, month, orders, onAddOrder, onDayClick, onSaturdayClick }) {
  const weeks    = buildGrid(year, month)
  const todayStr = dateToStr(new Date())

  // Index date → commandes pour lookup O(1)
  const byDate = {}
  for (const o of orders) {
    if (!byDate[o.pickupDate]) byDate[o.pickupDate] = []
    byDate[o.pickupDate].push(o)
  }

  return (
    <div className="orders-calendar">

      {/* En-tête jours */}
      <div className="orders-cal-header">
        {DAYS_FR.map(d => (
          <div key={d} className="orders-cal-day-name">{d}</div>
        ))}
      </div>

      {/* Grille semaines */}
      <div className="orders-cal-body">
        {weeks.map((week, wi) => (
          <div key={wi} className="orders-cal-week">
            {week.map(date => {
              const ds             = dateToStr(date)
              const dayOrders      = byDate[ds] ?? []
              const isCurrentMonth = date.getMonth() === month
              const isPast         = ds < todayStr

              return (
                <OrderDayCell
                  key={ds}
                  date={date}
                  orders={dayOrders}
                  isCurrentMonth={isCurrentMonth}
                  isToday={ds === todayStr}
                  isPast={isPast}
                  onAddOrder={onAddOrder}
                  onDayClick={onDayClick}
                  onSaturdayClick={onSaturdayClick}
                />
              )
            })}
          </div>
        ))}
      </div>

    </div>
  )
}
