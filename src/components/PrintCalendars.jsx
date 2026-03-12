import { dateToStr } from '../hooks/useSchedule'

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

function fmtTime(h) {
  return `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 === 0.5 ? '30' : '00'}`
}

function fmtDur(h) {
  const totalMin = Math.round(h * 60)
  const hours    = Math.floor(totalMin / 60)
  const mins     = totalMin % 60
  return mins === 0 ? `${hours}h` : `${hours}h${String(mins).padStart(2, '0')}`
}

function effectiveH(s) {
  return Math.max(0, (s.endHour - s.startHour) - (s.pause ?? 0))
}

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function PrintCalendars({ weekOffsets, shifts, team }) {
  const todayMonday = getMondayOf(new Date())
  const activeTeam  = team.filter(e => !e.archived)

  return (
    <div className="print-calendars">
      {[...weekOffsets].sort((a, b) => a - b).map(offset => {
        const monday = addDays(todayMonday, offset * 7)
        const dates  = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
        const strs   = dates.map(d => dateToStr(d))

        const weekShifts = shifts.filter(s => strs.includes(s.date))

        const rangeLabel = `${monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} – ${dates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`

        return (
          <div key={offset} className="print-week-page">
            <div className="print-week-header">
              <span className="print-week-brand">Kubo Pâtisserie — Planning</span>
              <span className="print-week-range">{rangeLabel}</span>
            </div>

            <table className="print-week-table">
              <thead>
                <tr>
                  <th className="print-col-emp">Employé</th>
                  {dates.map((d, i) => (
                    <th key={i} className="print-col-day">
                      {DAY_NAMES[i]}&nbsp;
                      <span className="print-col-date">
                        {d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    </th>
                  ))}
                  <th className="print-col-total">Total</th>
                </tr>
              </thead>
              <tbody>
                {activeTeam.map(emp => {
                  const empShifts = weekShifts.filter(s => s.employeeId === emp.id)
                  const total     = empShifts.reduce((sum, s) => sum + effectiveH(s), 0)

                  return (
                    <tr key={emp.id}>
                      <td className="print-cell-emp">
                        <span className="print-emp-dot" style={{ background: emp.color }} />
                        {emp.name}
                      </td>
                      {strs.map(ds => {
                        const dayShifts = empShifts.filter(s => s.date === ds)
                        return (
                          <td key={ds} className="print-cell-day">
                            {dayShifts.map(s => (
                              <div key={s.id} className="print-shift-entry">
                                {fmtTime(s.startHour)}–{fmtTime(s.endHour)}
                                {(s.pause ?? 0) > 0 && (
                                  <span className="print-shift-eff"> {fmtDur(effectiveH(s))} eff.</span>
                                )}
                              </div>
                            ))}
                          </td>
                        )
                      })}
                      <td className="print-cell-total">
                        {total > 0 ? fmtDur(total) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
