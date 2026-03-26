import { jsPDF } from 'jspdf'
import { WEEKLY_CONTRACT, dateToStr } from '../hooks/useSchedule'

// ── Local helpers ─────────────────────────────────────────────────────────

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

function weekKeyOf(dateStr) {
  const d   = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const mon = new Date(d)
  mon.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return dateToStr(mon)
}

function isoWeekNum(monday) {
  const d    = new Date(monday)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const jan4 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d - jan4) / 86400000 - 3 + (jan4.getDay() + 6) % 7) / 7)
}

function effectiveH(s) {
  if ((s.type ?? 'work') !== 'work') return 0
  return Math.max(0, (s.endHour - s.startHour) - (s.pause ?? 0))
}

function fmtDur(h) {
  const totalMin = Math.round(Math.abs(h) * 60)
  const hours    = Math.floor(totalMin / 60)
  const mins     = totalMin % 60
  return mins === 0 ? `${hours}h` : `${hours}h${String(mins).padStart(2, '0')}`
}

function fmtDateFull(d) {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtDateShort(d) {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function setBalanceColor(pdf, value) {
  if (value > 0)      pdf.setTextColor(224, 85, 85)
  else if (value < 0) pdf.setTextColor(245, 166, 35)
  else                pdf.setTextColor(76, 175, 80)
}

function computeWeekBalance(shifts, employeeId, weekDates, contract = WEEKLY_CONTRACT) {
  const strs     = new Set(weekDates.map(d => dateToStr(d)))
  const prevShifts = shifts.filter(s => s.employeeId === employeeId && !strs.has(s.date))
  const prevHours  = prevShifts.reduce((sum, s) => sum + effectiveH(s), 0)
  const prevWeeks  = new Set(prevShifts.map(s => weekKeyOf(s.date))).size
  const prevBalance = prevHours - prevWeeks * contract
  const weekObjective = contract - prevBalance
  const weekHrs = shifts
    .filter(s => s.employeeId === employeeId && strs.has(s.date))
    .reduce((sum, s) => sum + effectiveH(s), 0)
  const weekBalance = weekHrs - weekObjective
  return { weekHours: weekHrs, weekBalance, cumul: prevBalance + weekBalance }
}

// ── Main export ───────────────────────────────────────────────────────────

export async function generatePdf(captures, team, shifts) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const PAGE_W = 297
  const PAGE_H = 210
  const MARGIN = 15
  const CW     = PAGE_W - 2 * MARGIN   // 267mm usable width

  const activeTeam = team.filter(e => !e.archived)
  const ROW_H      = 6.5
  const TABLE_H    = ROW_H * (activeTeam.length + 1) + 5  // header + rows + gap
  const HEADER_H   = 18
  const FOOTER_H   = 7
  const CAL_H      = PAGE_H - 2 * MARGIN - HEADER_H - TABLE_H - FOOTER_H - 6

  const todayMonday = getMondayOf(new Date())

  for (let i = 0; i < captures.length; i++) {
    if (i > 0) pdf.addPage()

    const { imgData, offset } = captures[i]
    const monday    = addDays(todayMonday, offset * 7)
    const sunday    = addDays(monday, 6)
    const wn        = isoWeekNum(monday)
    const weekDates = Array.from({ length: 7 }, (_, j) => addDays(monday, j))

    let y = MARGIN

    // ── Page header ────────────────────────────────────────────────────────
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.setTextColor(17, 17, 17)
    pdf.text('Kubo Patisserie', MARGIN, y + 5)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(85, 85, 102)
    pdf.text(
      `Planning \u2014 Semaine ${wn}   |   ${fmtDateShort(monday)} \u2013 ${fmtDateFull(sunday)}`,
      MARGIN, y + 12,
    )

    // Gold separator
    pdf.setDrawColor(198, 163, 68)
    pdf.setLineWidth(0.7)
    pdf.line(MARGIN, y + HEADER_H - 1, PAGE_W - MARGIN, y + HEADER_H - 1)

    y += HEADER_H

    // ── Calendar capture ───────────────────────────────────────────────────
    pdf.addImage(imgData, 'PNG', MARGIN, y, CW, CAL_H, '', 'FAST')

    y += CAL_H + 4

    // Thin separator
    pdf.setDrawColor(220, 220, 232)
    pdf.setLineWidth(0.25)
    pdf.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 3

    // ── Summary table ──────────────────────────────────────────────────────
    const colW = [CW * 0.28, CW * 0.17, CW * 0.14, CW * 0.20, CW * 0.21]
    const hdrs = ['Employé', 'Heures semaine', 'Objectif', 'Solde semaine', 'Solde cumulé']

    // Table header row
    pdf.setFillColor(245, 244, 249)
    pdf.rect(MARGIN, y, CW, ROW_H, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7)
    pdf.setTextColor(85, 85, 102)
    let cx = MARGIN + 2
    for (let c = 0; c < hdrs.length; c++) {
      pdf.text(hdrs[c], cx, y + ROW_H - 1.8)
      cx += colW[c]
    }
    y += ROW_H

    // Data rows
    pdf.setFontSize(8)
    for (const emp of activeTeam) {
      const wb = computeWeekBalance(shifts, emp.id, weekDates, emp.contract ?? WEEKLY_CONTRACT)

      pdf.setFillColor(255, 255, 255)
      pdf.rect(MARGIN, y, CW, ROW_H, 'F')
      pdf.setDrawColor(238, 238, 245)
      pdf.setLineWidth(0.2)
      pdf.line(MARGIN, y + ROW_H, MARGIN + CW, y + ROW_H)

      // Color dot
      const [r, g, b] = hexToRgb(emp.color)
      pdf.setFillColor(r, g, b)
      pdf.circle(MARGIN + 3.5, y + ROW_H / 2, 1.5, 'F')

      cx = MARGIN + 8

      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(17, 17, 17)
      pdf.text(emp.name, cx, y + ROW_H - 1.8)
      cx += colW[0] - 6

      pdf.text(fmtDur(wb.weekHours), cx, y + ROW_H - 1.8)
      cx += colW[1]

      pdf.text(fmtDur(emp.contract ?? WEEKLY_CONTRACT), cx, y + ROW_H - 1.8)
      cx += colW[2]

      setBalanceColor(pdf, wb.weekBalance)
      const swSign = wb.weekBalance > 0 ? '+' : ''
      pdf.text(`${swSign}${fmtDur(Math.abs(wb.weekBalance))}`, cx, y + ROW_H - 1.8)
      cx += colW[3]

      setBalanceColor(pdf, wb.cumul)
      const cSign = wb.cumul > 0 ? '+' : ''
      pdf.text(`${cSign}${fmtDur(Math.abs(wb.cumul))}`, cx, y + ROW_H - 1.8)

      y += ROW_H
    }

    // ── Footer ─────────────────────────────────────────────────────────────
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.setTextColor(180, 180, 180)
    pdf.text(
      `G\u00e9n\u00e9r\u00e9 le ${fmtDateFull(new Date())}   \u2022   Page ${i + 1} / ${captures.length}`,
      PAGE_W / 2,
      PAGE_H - MARGIN / 2,
      { align: 'center' },
    )
  }

  // ── Save & open ────────────────────────────────────────────────────────────
  const today = new Date()
  let filename
  if (captures.length === 1) {
    const mon = addDays(getMondayOf(new Date()), captures[0].offset * 7)
    filename = `Kubo-Planning-S${isoWeekNum(mon)}-${today.getFullYear()}.pdf`
  } else {
    filename = `Kubo-Planning-Selection-${dateToStr(today)}.pdf`
  }

  const blob    = pdf.output('blob')
  const blobUrl = URL.createObjectURL(blob)
  window.open(blobUrl, '_blank')
  pdf.save(filename)
}
