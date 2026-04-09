// ─── DashOrdersBlock — Commandes à venir ─────────────────────────────────────
import { useMemo }    from 'react'
import OrderCard      from '../../../design-system/components/OrderCard/OrderCard'
import { IconOrders } from './DashIcons'

function fmtDateLabel(dateStr, todayStr) {
  if (dateStr === todayStr) return "Aujourd'hui"
  const d = new Date(dateStr + 'T00:00:00')
  const s = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function DashOrdersBlock({ orders, productsCtx, todayStr }) {
  // Commandes à partir d'aujourd'hui, triées par date puis par heure de retrait
  const upcoming = useMemo(() => {
    return [...orders]
      .filter(o => o.pickupDate >= todayStr)
      .sort((a, b) => {
        if (a.pickupDate !== b.pickupDate) return a.pickupDate.localeCompare(b.pickupDate)
        return (a.pickupTime ?? '').localeCompare(b.pickupTime ?? '')
      })
  }, [orders, todayStr])

  // Grouper par date
  const groups = useMemo(() => {
    const map = new Map()
    for (const o of upcoming) {
      if (!map.has(o.pickupDate)) map.set(o.pickupDate, [])
      map.get(o.pickupDate).push(o)
    }
    return [...map.entries()]
  }, [upcoming])

  return (
    <div className="dash-card dash-card--full dash-orders-card">
      <div className="dash-block-header">
        <div className="dash-block-header-left">
          <span className="dash-module-icon"><IconOrders /></span>
          <span className="dash-block-title">Commandes</span>
        </div>
        
      </div>

      <div className="dash-orders-scroll">
        {groups.length === 0 ? (
          <p className="dash-block-empty">Aucune commande à venir.</p>
        ) : (
          groups.map(([dateStr, dateOrders]) => (
            <div key={dateStr} className="dash-orders-date-group">
              <div className={`dash-orders-date-label ${dateStr === todayStr ? 'dash-orders-date-label--today' : 'dash-orders-date-label--future'}`}>
                {fmtDateLabel(dateStr, todayStr)}
              </div>
              {dateOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  getProduct={productsCtx?.getById}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
