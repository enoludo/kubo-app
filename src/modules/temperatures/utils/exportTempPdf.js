// ─── Export PDF HACCP — Relevés de température ───────────────────────────────
import { jsPDF } from 'jspdf'

// Couleurs PDF pour chaque clé de couleur équipement
const COLOR_MAP = {
  blue:   [59,  130, 246],
  green:  [34,  197,  94],
  orange: [249, 115,  22],
  violet: [139,  92, 246],
  yellow: [234, 179,   8],
  red:    [239,  68,  68],
}

const TYPE_LABEL = {
  frigo:       'Frigo',
  congelateur: 'Congélateur',
  tour:        'Tour Pâtissier',
  autre:       'Autre',
}

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function fmtDateFull(d) {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function isoWeekNum(monday) {
  const d    = new Date(monday)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const jan4 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d - jan4) / 86400000 - 3 + (jan4.getDay() + 6) % 7) / 7)
}

function getReadingsForCell(readings, equipmentId, dateStr) {
  return readings.filter(r => r.equipmentId === equipmentId && r.date === dateStr)
}

function hasAlert(cellReadings, equipment) {
  return cellReadings.some(r => r.temperature < equipment.minTemp || r.temperature > equipment.maxTemp)
}

function hasMissing(cellReadings) {
  const slots = new Set(cellReadings.map(r => r.slot))
  return !slots.has('morning') || !slots.has('evening')
}

/**
 * Génère et ouvre le PDF HACCP pour la semaine donnée.
 * @param {object[]} equipment  — liste des équipements actifs
 * @param {object[]} readings   — tous les relevés
 * @param {string[]} weekDates  — 7 strings YYYY-MM-DD (lun→dim)
 * @param {Date}     monday     — Date du lundi
 */
export async function generateTempPdf(equipment, readings, weekDates, monday) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const PAGE_W = 297
  const PAGE_H = 210
  const MARGIN = 12
  const CW     = PAGE_W - 2 * MARGIN

  const wn      = isoWeekNum(monday)
  const sunday  = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const EQUIP_COL_W = 44         // colonne équipement
  const DAY_COL_W   = (CW - EQUIP_COL_W) / 7
  const ROW_H       = Math.min(24, (PAGE_H - 2 * MARGIN - 28 - 10) / Math.max(equipment.length, 1))
  const HEADER_H    = 22
  const COL_HEADER_H = 10

  let y = MARGIN

  // ── Page header ────────────────────────────────────────────────────────────
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.setTextColor(17, 17, 17)
  pdf.text('Kubo Patisserie', MARGIN, y + 5)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(85, 85, 102)
  pdf.text(
    `Relevés de température HACCP \u2014 Semaine ${wn}   |   ${fmtDateFull(monday)} \u2013 ${fmtDateFull(sunday)}`,
    MARGIN, y + 12,
  )

  // Séparateur doré
  pdf.setDrawColor(198, 163, 68)
  pdf.setLineWidth(0.7)
  pdf.line(MARGIN, y + HEADER_H - 2, PAGE_W - MARGIN, y + HEADER_H - 2)

  y += HEADER_H

  // ── En-têtes colonnes jours ────────────────────────────────────────────────
  pdf.setFillColor(245, 244, 249)
  pdf.rect(MARGIN, y, CW, COL_HEADER_H, 'F')

  // Cellule équipement (vide)
  pdf.setDrawColor(220, 220, 232)
  pdf.setLineWidth(0.2)
  pdf.rect(MARGIN, y, EQUIP_COL_W, COL_HEADER_H)

  let cx = MARGIN + EQUIP_COL_W
  weekDates.forEach((dateStr, i) => {
    const isWeekend = i >= 5
    if (isWeekend) pdf.setFillColor(240, 240, 248)
    else           pdf.setFillColor(245, 244, 249)
    pdf.rect(cx, y, DAY_COL_W, COL_HEADER_H, 'F')
    pdf.rect(cx, y, DAY_COL_W, COL_HEADER_H)

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7)
    pdf.setTextColor(85, 85, 102)
    pdf.text(DAY_NAMES[i], cx + DAY_COL_W / 2, y + 4, { align: 'center' })
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(6.5)
    pdf.text(fmtDate(dateStr), cx + DAY_COL_W / 2, y + 8, { align: 'center' })
    cx += DAY_COL_W
  })

  y += COL_HEADER_H

  // ── Lignes équipements ─────────────────────────────────────────────────────
  equipment.forEach(eq => {
    const [r, g, b] = COLOR_MAP[eq.color] ?? [99, 102, 241]

    // Fond léger couleur équipement pour la colonne nom
    pdf.setFillColor(r, g, b, 0.08)
    pdf.setFillColor(
      Math.round(r + (255 - r) * 0.88),
      Math.round(g + (255 - g) * 0.88),
      Math.round(b + (255 - b) * 0.88),
    )
    pdf.rect(MARGIN, y, EQUIP_COL_W, ROW_H, 'F')

    // Bordure gauche couleur
    pdf.setDrawColor(r, g, b)
    pdf.setLineWidth(1.5)
    pdf.line(MARGIN, y, MARGIN, y + ROW_H)
    pdf.setLineWidth(0.2)
    pdf.setDrawColor(220, 220, 232)
    pdf.rect(MARGIN, y, EQUIP_COL_W, ROW_H)

    // Nom équipement
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7.5)
    pdf.setTextColor(r, g, b)
    pdf.text(eq.name, MARGIN + 4, y + ROW_H / 2 - 1.5)

    // Type + plage
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(6)
    pdf.setTextColor(120, 120, 140)
    pdf.text(
      `${TYPE_LABEL[eq.type] ?? eq.type} · ${eq.minTemp}°C – ${eq.maxTemp}°C`,
      MARGIN + 4, y + ROW_H / 2 + 2.5,
    )

    // Cellules jours
    cx = MARGIN + EQUIP_COL_W
    weekDates.forEach((dateStr, i) => {
      const cellReadings = getReadingsForCell(readings, eq.id, dateStr)
      const alert        = cellReadings.length > 0 && hasAlert(cellReadings, eq)
      const missing      = cellReadings.length > 0 && hasMissing(cellReadings)
      const empty        = cellReadings.length === 0
      const isWeekend    = i >= 5

      // Fond cellule
      if (alert) {
        pdf.setFillColor(254, 226, 226)   // rouge clair
      } else if (missing) {
        pdf.setFillColor(254, 243, 199)   // jaune clair
      } else if (!empty) {
        pdf.setFillColor(
          Math.round(r + (255 - r) * 0.92),
          Math.round(g + (255 - g) * 0.92),
          Math.round(b + (255 - b) * 0.92),
        )
      } else if (isWeekend) {
        pdf.setFillColor(248, 248, 252)
      } else {
        pdf.setFillColor(255, 255, 255)
      }
      pdf.setDrawColor(220, 220, 232)
      pdf.setLineWidth(0.2)
      pdf.rect(cx, y, DAY_COL_W, ROW_H, 'FD')

      if (empty) {
        // Rien à afficher
      } else {
        // Affiche matin / soir
        const morning = cellReadings.find(r => r.slot === 'morning')
        const evening = cellReadings.find(r => r.slot === 'evening')
        const extras  = cellReadings.filter(r => r.slot === 'extra')

        const lineH = Math.min(3.2, (ROW_H - 4) / (1 + (evening ? 1 : 0) + extras.length))
        let ly = y + 2.5

        function drawReading(label, reading) {
          if (!reading) return
          const outOfRange = reading.temperature < eq.minTemp || reading.temperature > eq.maxTemp
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(5.5)
          pdf.setTextColor(outOfRange ? 185 : 100, outOfRange ? 28 : 100, outOfRange ? 28 : 120)
          pdf.text(`${label} ${reading.temperature}°`, cx + DAY_COL_W / 2, ly, { align: 'center' })
          ly += lineH
        }

        drawReading('M', morning)
        drawReading('S', evening)
        extras.forEach((ex, idx) => drawReading(`+${idx + 1}`, ex))

        // Indicateur alerte
        if (alert) {
          pdf.setFillColor(239, 68, 68)
          pdf.circle(cx + DAY_COL_W - 2.5, y + 2.5, 1.2, 'F')
        }
      }

      cx += DAY_COL_W
    })

    y += ROW_H
  })

  // Bordure du tableau
  pdf.setDrawColor(180, 180, 200)
  pdf.setLineWidth(0.4)
  pdf.rect(MARGIN, MARGIN + HEADER_H, CW, COL_HEADER_H + ROW_H * equipment.length)

  // ── Légende ────────────────────────────────────────────────────────────────
  const legendY = PAGE_H - MARGIN - 6
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6)
  pdf.setTextColor(150, 150, 170)
  pdf.text('M = Matin · S = Soir · +n = Relevé supplémentaire', MARGIN, legendY)
  pdf.setFillColor(239, 68, 68)
  pdf.circle(MARGIN + 90, legendY - 0.8, 1.2, 'F')
  pdf.text('= Température hors plage', MARGIN + 93, legendY)

  // ── Footer ─────────────────────────────────────────────────────────────────
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6.5)
  pdf.setTextColor(180, 180, 180)
  pdf.text(
    `Généré le ${fmtDateFull(new Date())}`,
    PAGE_W / 2, PAGE_H - MARGIN / 2,
    { align: 'center' },
  )

  // ── Sauvegarde ─────────────────────────────────────────────────────────────
  const filename = `Kubo-HACCP-S${wn}-${monday.getFullYear()}.pdf`
  const blob    = pdf.output('blob')
  const blobUrl = URL.createObjectURL(blob)
  window.open(blobUrl, '_blank')
  pdf.save(filename)
}
