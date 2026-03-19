import { useState } from 'react'
import { dateToStr } from './useSchedule'

export function useTemplates({ schedule, week }) {
  const [copiedPlan, setCopiedPlan] = useState(null)
  const [templates,  setTemplates]  = useState([])

  function extractRelativeShifts() {
    return schedule.shifts
      .filter(s => week.dates.some(d => dateToStr(d) === s.date))
      .map(s => {
        const dayOffset = week.dates.findIndex(d => dateToStr(d) === s.date)
        return {
          employeeId: s.employeeId, dayOffset,
          startHour: s.startHour, endHour: s.endHour,
          pause: s.pause ?? 0, type: s.type ?? 'work',
        }
      })
  }

  function handleCopyPlan() {
    const shifts    = extractRelativeShifts()
    const d0        = week.dates[0]
    const d6        = week.dates[6]
    const weekLabel = `${d0.getDate()}/${d0.getMonth() + 1} – ${d6.getDate()}/${d6.getMonth() + 1}`
    setCopiedPlan({ weekLabel, shifts })
  }

  function handlePastePlan() {
    if (!copiedPlan) return
    copiedPlan.shifts.forEach(s => {
      const date = week.dates[s.dayOffset]
      if (date) schedule.addShift(s.employeeId, dateToStr(date), s.startHour, s.endHour, s.pause, s.type)
    })
  }

  function handleSaveTemplate(name) {
    const shifts = extractRelativeShifts()
    setTemplates(prev => [...prev, { id: Date.now(), name, shifts }])
  }

  function handleLoadTemplate(templateId) {
    const tpl = templates.find(t => t.id === templateId)
    if (!tpl) return
    tpl.shifts.forEach(s => {
      const date = week.dates[s.dayOffset]
      if (date) schedule.addShift(s.employeeId, dateToStr(date), s.startHour, s.endHour, s.pause, s.type)
    })
  }

  return {
    copiedPlan, templates,
    handleCopyPlan, handlePastePlan, handleSaveTemplate, handleLoadTemplate,
  }
}
