// ─── DashCleaningBlock — Nettoyage du jour ────────────────────────────────────
import { useMemo } from 'react'
import { isTaskScheduledForDate, getTaskStatus } from '../../cleaning/hooks/useCleaning'
import { resolveZone } from '../../cleaning/utils/cleaningZones'
import { IconCleaning } from './DashIcons'

export default function DashCleaningBlock({ rooms, zones, subzones, tasks, records, today, todayStr }) {
  const roomsWithTasks = useMemo(() => {
    return rooms
      .map(room => {
        const resolved    = resolveZone(room)
        const zoneIds     = zones.filter(z => z.roomId === room.id).map(z => z.id)
        const subzoneIds  = subzones.filter(s => zoneIds.includes(s.zoneId)).map(s => s.id)
        const roomTasks   = tasks
          .filter(t =>
            (zoneIds.includes(t.zoneId) || subzoneIds.includes(t.subzoneId)) &&
            isTaskScheduledForDate(t, today)
          )
          .map(t => ({
            ...t,
            status: getTaskStatus(t.id, todayStr, records),
          }))
        return { room: resolved, tasks: roomTasks }
      })
      .filter(({ tasks: rt }) => rt.length > 0)
  }, [rooms, zones, subzones, tasks, records, today, todayStr])

  return (
    <div className="dash-card dash-card--full">
      <div className="dash-block-header">
        <div className="dash-block-header-left">
          <span className="dash-module-icon"><IconCleaning /></span>
          <span className="dash-block-title">Nettoyage</span>
        </div>
      </div>

      <div className="dash-block-body">
        {roomsWithTasks.length === 0 ? (
          <p className="dash-block-empty">Aucune tâche aujourd'hui.</p>
        ) : (
          <div className="dash-cleaning-list">
            {roomsWithTasks.map(({ room, tasks: roomTasks }) => (
              <div key={room.id} className="dash-cleaning-zone">
                <span className="dash-cleaning-zone-label">{room.label}</span>
                <div className="dash-cleaning-pills">
                  {roomTasks.map(task => (
                    <span
                      key={task.id}
                      className={`dash-cleaning-pill ${task.status === 'done' ? 'dash-cleaning-pill--done' : 'dash-cleaning-pill--pending'}`}
                      style={task.status === 'done' ? { background: room.pillToken } : undefined}
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
