import { useState } from 'react'
import { dateToStr } from './useSchedule'

export function useShiftActions({ schedule, team }) {
  const [shiftModal, setShiftModal] = useState(null)

  function handleEditShift(shiftId) {
    const shift    = schedule.shifts.find(s => s.id === shiftId)
    const employee = team.find(e => e.id === shift.employeeId)
    if (!employee || employee.archived) return
    const date = new Date(shift.date + 'T00:00:00')
    setShiftModal({ employee, date, startHour: shift.startHour, shift })
  }

  function handleSaveShift(startHour, endHour, pause, type, extra = {}) {
    if (shiftModal.shift) {
      schedule.updateShift(shiftModal.shift.id, startHour, endHour, pause, type, extra)
    } else {
      schedule.addShift(shiftModal.employee.id, dateToStr(shiftModal.date), startHour, endHour, pause, type, extra)
    }
    setShiftModal(null)
  }

  function handleAddForDay(employeeId, date, defaultType) {
    const employee = team.find(e => e.id === employeeId)
    if (!employee || employee.archived) return
    setShiftModal({ employee, date, startHour: 9, shift: null, ...(defaultType ? { defaultType } : {}) })
  }

  function handleDeleteShift() {
    schedule.removeShift(shiftModal.shift.id)
    setShiftModal(null)
  }

  return { shiftModal, setShiftModal, handleEditShift, handleSaveShift, handleAddForDay, handleDeleteShift }
}
