// ─── DashCleaningBlock — Nettoyage du jour ────────────────────────────────────
import { useMemo } from 'react'
import { isTaskScheduledForDate, getTaskStatus } from '../../cleaning/hooks/useCleaning'
import { resolveZone } from '../../cleaning/utils/cleaningZones'
import { IconCleaning } from './DashIcons'

export default function DashCleaningBlock({ zones, tasks, records, today, todayStr }) {
  const zonesWithTasks = useMemo(() => {
    return zones
      .map(zone => {
        const resolved = resolveZone(zone)
        const zoneTasks = tasks
          .filter(t => t.zone === zone.id && isTaskScheduledForDate(t, today))
          .map(t => ({
            ...t,
            status: getTaskStatus(t.id, todayStr, records),
          }))
        return { zone: resolved, tasks: zoneTasks }
      })
      .filter(({ tasks }) => tasks.length > 0)
  }, [zones, tasks, records, today, todayStr])

  return (
    <div className="dash-card dash-card--full">
      <div className="dash-block-header">
        <div className="dash-block-header-left">
          <span className="dash-module-icon"><IconCleaning /></span>
          <span className="dash-block-title">Nettoyage</span>
        </div>
      </div>

      <div className="dash-block-body">
        {zonesWithTasks.length === 0 ? (
          <p className="dash-block-empty">Aucune tâche aujourd'hui.</p>
        ) : (
          <div className="dash-cleaning-list">
            {zonesWithTasks.map(({ zone, tasks: zoneTasks }) => (
              <div key={zone.id} className="dash-cleaning-zone">
                <span className="dash-cleaning-zone-label">{zone.label}</span>
                <div className="dash-cleaning-pills">
                  {zoneTasks.map(task => (
                    <span
                      key={task.id}
                      className={`dash-cleaning-pill ${task.status === 'done' ? 'dash-cleaning-pill--done' : 'dash-cleaning-pill--pending'}`}
                      style={task.status === 'done'
                        ? { background: zone.pillToken }
                        : undefined
                      }
                    >
                      {task.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
