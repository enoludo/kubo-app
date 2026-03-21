import { useState, useEffect, useRef } from 'react'
import { dateToStr, WEEKLY_CONTRACT } from '../hooks/useSchedule'
import { PdfIcon, MailIcon } from './Icons'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMondayOf(date) {
  const d   = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function isoWeekNum(monday) {
  const d    = new Date(monday)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const jan4 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d - jan4) / 86400000 - 3 + (jan4.getDay() + 6) % 7) / 7)
}

function fmtShort(d) {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function fmtMonthYear(d) {
  const s = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function effectiveH(s) {
  return Math.max(0, (s.endHour - s.startHour) - (s.pause ?? 0))
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WeekPickerPanel({
  shifts, team, currentOffset, onSelect, onClose,
  onPdfSelection, onSendToAll, pdfGenerating,
}) {
  const [selected, setSelected] = useState(new Set())
  const panelRef = useRef(null)

  useEffect(() => {
    function onMouseDown(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [onClose])

  // Today's Monday is offset 0
  const todayMonday = getMondayOf(new Date())

  function offsetOf(monday) {
    return Math.round((monday.getTime() - todayMonday.getTime()) / (7 * 24 * 3600 * 1000))
  }

  // Build week range: earliest shift −2w … latest shift +3w, always including today
  const shiftMondayTimes = shifts.map(s =>
    getMondayOf(new Date(s.date + 'T00:00:00')).getTime()
  )
  const allTimes = [...shiftMondayTimes, todayMonday.getTime()]
  const rangeMin = new Date(Math.min(...allTimes) - 2 * 7 * 86400000)
  const rangeMax = new Date(Math.max(...allTimes) + 3 * 7 * 86400000)

  const weeks = []
  let cur = getMondayOf(rangeMin)
  while (cur <= rangeMax) {
    weeks.push(new Date(cur))
    cur = addDays(cur, 7)
  }

  // Group by month
  const byMonth = []
  let lastKey = null
  for (const mon of weeks) {
    const key = `${mon.getFullYear()}-${mon.getMonth()}`
    if (key !== lastKey) {
      byMonth.push({ label: fmtMonthYear(mon), weeks: [] })
      lastKey = key
    }
    byMonth[byMonth.length - 1].weeks.push(mon)
  }

  // Per-week stats
  function weekStats(monday) {
    const from = dateToStr(monday)
    const to   = dateToStr(addDays(monday, 6))
    const ws   = shifts.filter(s => s.date >= from && s.date <= to)
    let hasOver = false, hasBehind = false
    const empIds = [...new Set(ws.map(s => s.employeeId))]
    for (const id of empIds) {
      const h = ws.filter(s => s.employeeId === id).reduce((sum, s) => sum + effectiveH(s), 0)
      if (h > WEEKLY_CONTRACT) hasOver = true
      if (h < WEEKLY_CONTRACT) hasBehind = true
    }
    return { count: ws.length, hasOver, hasBehind }
  }

  function toggleSelect(offset, e) {
    e.stopPropagation()
    setSelected(prev => {
      const next = new Set(prev)
      next.has(offset) ? next.delete(offset) : next.add(offset)
      return next
    })
  }

  const selCount = selected.size

  return (
    <div className="week-picker-overlay">
      <div className="week-picker-panel" ref={panelRef}>

        {/* Header */}
        <div className="week-picker-header">
          <span className="week-picker-title">Choisir une semaine</span>
          <button
            className="week-picker-today-btn"
            onClick={() => { onSelect(0); onClose() }}
          >
            Semaine en cours
          </button>
          <button className="week-picker-close" onClick={onClose}>×</button>
        </div>

        {/* Weeks grid */}
        <div className="week-picker-body">
          {byMonth.map(group => (
            <div key={group.label} className="week-picker-month">
              <div className="week-picker-month-label">{group.label}</div>
              <div className="week-picker-grid">
                {group.weeks.map(mon => {
                  const offset    = offsetOf(mon)
                  const sunday    = addDays(mon, 6)
                  const wn        = isoWeekNum(mon)
                  const isCurrent = offset === currentOffset
                  const stats     = weekStats(mon)

                  let dotColor = null
                  if (stats.count > 0) {
                    dotColor = stats.hasBehind ? 'orange' : stats.hasOver ? 'red' : 'green'
                  }

                  return (
                    <div
                      key={mon.getTime()}
                      className={[
                        'week-card',
                        isCurrent  ? 'week-card--current'  : '',
                        !stats.count ? 'week-card--empty' : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => { onSelect(offset); onClose() }}
                    >
                      <input
                        type="checkbox"
                        className="week-card-check"
                        checked={selected.has(offset)}
                        onChange={e => toggleSelect(offset, e)}
                        onClick={e => e.stopPropagation()}
                      />
                      <div className="week-card-num">S{wn}</div>
                      <div className="week-card-dates">
                        {fmtShort(mon)} – {fmtShort(sunday)}
                      </div>
                      <div className="week-card-meta">
                        {stats.count > 0
                          ? <span className="week-card-count">{stats.count} shift{stats.count > 1 ? 's' : ''}</span>
                          : <span className="week-card-empty-label">Aucun shift</span>
                        }
                        {dotColor && <span className={`week-card-dot week-card-dot--${dotColor}`} />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="week-picker-footer">
          <button
            className="pdf-btn"
            disabled={selCount === 0 || pdfGenerating}
            onClick={() => selCount > 0 && !pdfGenerating && onPdfSelection([...selected])}
          >
            <PdfIcon /><span>{pdfGenerating ? 'Génération…' : 'PDF'}</span>
          </button>
          <button
            className="mail-btn"
            disabled={selCount === 0}
            onClick={() => selCount > 0 && onSendToAll([...selected])}
          >
            <MailIcon size={15} /><span>Envoyer à tous</span>
          </button>
        </div>

      </div>
    </div>
  )
}
