// ─── DashDeliveryBlock — Livraisons du jour ───────────────────────────────────
import { IconTracability } from './DashIcons'

export default function DashDeliveryBlock({ deliveries, suppliers, todayStr }) {
  const todayDeliveries = deliveries.filter(d => d.date === todayStr)

  const supplierMap = new Map(suppliers.map(s => [s.id, s]))

  return (
    <div className="dash-card dash-card--full">
      <div className="dash-block-header">
        <div className="dash-block-header-left">
          <span className="dash-module-icon"><IconTracability /></span>
          <span className="dash-block-title">Livraison</span>
        </div>
      </div>

      <div className="dash-block-body">
        {todayDeliveries.length === 0 ? (
          <p className="dash-block-empty">Aucune livraison aujourd'hui.</p>
        ) : (
          <div className="dash-delivery-list">
            {todayDeliveries.map(d => {
              const supplier    = supplierMap.get(d.supplierId)
              const isCompliant = d.conformity !== 'non_compliant'
              return (
                <div key={d.id} className="dash-delivery-item">
                  <span className="dash-delivery-supplier">
                    {supplier?.name ?? '—'}
                  </span>
                  <span className="dash-delivery-name">{d.productName}</span>
                  <span className="dash-delivery-qty">
                    {d.weight && <>{d.weight} · </>}
                    {d.qty > 1 ? `×${d.qty}` : ''}
                  </span>
                  <span className={`dash-delivery-badge ${isCompliant ? 'dash-delivery-badge--ok' : 'dash-delivery-badge--ko'}`}>
                    {isCompliant ? 'Conforme' : 'Non conforme'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
