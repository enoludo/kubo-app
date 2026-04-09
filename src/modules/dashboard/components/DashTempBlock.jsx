// ─── DashTempBlock — Températures du jour ─────────────────────────────────────
import { getEquipColor, getTypeIcon } from '../../temperatures/utils/tempColors'
import { IconTemperatures }           from './DashIcons'

export default function DashTempBlock({ equipment, readings, todayStr }) {
  const todayReadings = readings.filter(r => r.date === todayStr)

  const equipWithReadings = equipment.filter(eq =>
    todayReadings.some(r => r.equipmentId === eq.id)
  )

  return (
    <div className="dash-card dash-card--full">
      <div className="dash-block-header">
        <div className="dash-block-header-left">
          <span className="dash-module-icon"><IconTemperatures /></span>
          <span className="dash-block-title">Températures</span>
        </div>
      </div>

      <div className="dash-block-body">
        {equipWithReadings.length === 0 ? (
          <p className="dash-block-empty">Aucun relevé aujourd'hui.</p>
        ) : (
          <div className="dash-temp-list">
            {equipWithReadings.map(eq => {
              const color   = getEquipColor(eq)
              const eqReads = todayReadings.filter(r => r.equipmentId === eq.id)
              return (
                <div key={eq.id} className="dash-temp-equipment">
                  <div className="dash-temp-equip-header">
                    <span className="dash-temp-equip-icon">
                      {getTypeIcon(eq.type)}
                    </span>
                    <span>{eq.name}</span>
                  </div>
                  <div className="dash-temp-pills">
                    {eqReads.map(r => (
                      <span
  key={r.id}
  className="dash-temp-pill"
  style={{ background: color.c200 }}
>
  {r.time} / 
  <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
    {r.temperature > 0 ? '+' : ''}{r.temperature}°C
  </span>
</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
