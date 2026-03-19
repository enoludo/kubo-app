import { useState } from 'react'
import { exportToExcel }  from '../utils/exportExcel'
import { generatePdf }    from '../utils/exportPdf'
import { buildTeamMailto } from '../utils/emailPlanning'

export function useExports({ week, team, schedule }) {
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [pickerOpen,    setPickerOpen]    = useState(false)

  function handleSendToAll() {
    const href = buildTeamMailto(team, week.dates, schedule.shifts)
    if (href) window.location.href = href
  }

  function handleExportSelection(offsets) {
    const todayMonday = (() => {
      const d = new Date(); const day = d.getDay()
      d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); d.setHours(0, 0, 0, 0)
      return d
    })()
    const dateStrs = new Set(offsets.flatMap(off => {
      const mon = new Date(todayMonday)
      mon.setDate(mon.getDate() + off * 7)
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(mon); d.setDate(mon.getDate() + i)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      })
    }))
    exportToExcel(schedule.shifts.filter(s => dateStrs.has(s.date)), team)
  }

  function handlePrintSelection() {
    setPickerOpen(false)
    document.body.classList.add('printing-selection')
    setTimeout(() => {
      window.print()
      document.body.classList.remove('printing-selection')
    }, 100)
  }

  async function handlePdfExport(offsets) {
    if (pdfGenerating || !offsets.length) return
    setPdfGenerating(true)
    const sorted     = [...offsets].sort((a, b) => a - b)
    const origOffset = week.weekOffset
    const captures   = []
    try {
      const html2canvas = (await import('html2canvas')).default
      for (const offset of sorted) {
        week.goTo(offset)
        await new Promise(resolve => setTimeout(resolve, 600))
        const calEl = document.querySelector('.table-view')
        if (!calEl) continue
        const canvas = await html2canvas(calEl, {
          scale: 1.5, useCORS: true, allowTaint: true,
          backgroundColor: '#ffffff', logging: false,
          ignoreElements: el =>
            el.classList?.contains('modal-overlay') ||
            el.classList?.contains('week-picker-overlay'),
        })
        captures.push({ imgData: canvas.toDataURL('image/png'), offset })
      }
      if (captures.length > 0) await generatePdf(captures, team, schedule.shifts)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      week.goTo(origOffset)
      setPdfGenerating(false)
    }
  }

  return {
    pdfGenerating, pickerOpen, setPickerOpen,
    handlePdfExport, handleSendToAll, handleExportSelection, handlePrintSelection,
  }
}
