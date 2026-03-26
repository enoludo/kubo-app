import { useState } from 'react'

function getMondayOf(date) {
  const d   = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

export function useWeek() {
  const [weekOffset, setWeekOffset] = useState(0)

  const monday = getMondayOf(new Date())
  monday.setDate(monday.getDate() + weekOffset * 7)

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  return {
    dates,
    weekOffset,
    prev:  () => setWeekOffset(w => w - 1),
    next:  () => setWeekOffset(w => w + 1),
    today: () => setWeekOffset(0),
    goTo:  (offset) => setWeekOffset(offset),
  }
}
