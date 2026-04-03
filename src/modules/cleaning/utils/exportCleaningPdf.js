// ─── Export PDF HACCP — Plan de nettoyage ─────────────────────────────────────
import { jsPDF } from 'jspdf'
import { isTaskScheduledForDate, getTaskStatus } from '../hooks/useCleaning'
import teamData from '../../planning/data/team.json'

// ── Données de référence ──────────────────────────────────────────────────────

const teamById = Object.fromEntries(teamData.map(e => [e.id, e]))

// RGB extraits de design-tokens.css (primitifs)
const ZONE_COLORS = {
  laboratoire: { main: [122, 197, 255], bg: [188, 226, 255] },
  froid:       { main: [200, 175, 255], bg: [238, 231, 255] },
  cuisson:     { main: [255, 187, 136], bg: [255, 234, 219] },
  vente:       { main: [102, 218, 155], bg: [209, 244, 225] },
  sols:        { main: [255, 216, 102], bg: [255, 243, 209] },
  sanitaires:  { main: [255, 202, 201], bg: [255, 244, 244] },
}

const ZONE_LABELS = {
  laboratoire: 'Laboratoire',
  froid:       'Froid',
  cuisson:     'Cuisson',
  vente:       'Vente',
  sols:        'Sols & Murs',
  sanitaires:  'Sanitaires',
}

const ZONE_ORDER = ['laboratoire', 'froid', 'cuisson', 'vente', 'sols', 'sanitaires']
const DAY_NAMES  = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// ── Utilitaires ───────────────────────────────────────────────────────────────

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

function fmtTime(isoStr) {
  const d = new Date(isoStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Truncate text to maxWidth using jsPDF getTextWidth
function truncate(pdf, text, maxWidth) {
  if (pdf.getTextWidth(text) <= maxWidth) return text
  while (text.length > 1 && pdf.getTextWidth(text + '…') > maxWidth) {
    text = text.slice(0, -1)
  }
  return text + '…'
}

// ── Génération ────────────────────────────────────────────────────────────────

/**
 * Génère et ouvre le PDF HACCP nettoyage pour la semaine donnée.
 * @param {object[]} tasks      — toutes les tâches de nettoyage
 * @param {object[]} records    — tous les relevés
 * @param {string[]} weekDates  — 7 strings YYYY-MM-DD (lun→dim)
 * @param {Date}     monday     — Date du lundi
 */
export async function generateCleaningPdf(tasks, records, weekDates, monday) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const PAGE_W = 297
  const PAGE_H = 210
  const MARGIN = 12
  const CW     = PAGE_W - 2 * MARGIN

  const wn      = isoWeekNum(monday)
  const sunday  = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const ZONE_COL_W   = 46
  const DAY_COL_W    = (CW - ZONE_COL_W) / 7
  const HEADER_H     = 22
  const COL_HEADER_H = 10
  const ROW_H        = Math.min(28, (PAGE_H - 2 * MARGIN - HEADER_H - COL_HEADER_H - 10) / 6)

  let y = MARGIN

  // ── En-tête page ────────────────────────────────────────────────────────────

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.setTextColor(17, 17, 17)
  pdf.text('Kubo Patisserie', MARGIN, y + 5)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(85, 85, 102)
  pdf.text(
    `Plan de nettoyage & désinfection HACCP \u2014 Semaine ${wn}   |   ${fmtDateFull(monday)} \u2013 ${fmtDateFull(sunday)}`,
    MARGIN, y + 12,
  )

  pdf.setDrawColor(198, 163, 68)
  pdf.setLineWidth(0.7)
  pdf.line(MARGIN, y + HEADER_H - 2, PAGE_W - MARGIN, y + HEADER_H - 2)

  y += HEADER_H

  // ── En-têtes colonnes jours ─────────────────────────────────────────────────

  pdf.setFillColor(245, 244, 249)
  pdf.rect(MARGIN, y, CW, COL_HEADER_H, 'F')

  // Colonne zone (vide)
  pdf.setDrawColor(220, 220, 232)
  pdf.setLineWidth(0.2)
  pdf.rect(MARGIN, y, ZONE_COL_W, COL_HEADER_H)

  let cx = MARGIN + ZONE_COL_W
  weekDates.forEach((dateStr, i) => {
    const isWeekend = i >= 5
    pdf.setFillColor(isWeekend ? 240 : 245, isWeekend ? 240 : 244, isWeekend ? 248 : 249)
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

  // ── Lignes zones ────────────────────────────────────────────────────────────

  ZONE_ORDER.forEach(zoneId => {
    const colors     = ZONE_COLORS[zoneId] ?? { main: [180, 180, 180], bg: [240, 240, 240] }
    const [mr, mg, mb] = colors.main
    const [br, bg, bb] = colors.bg
    const zoneTasks  = tasks.filter(t => t.zone === zoneId && t.active)

    // Fond colonne zone
    pdf.setFillColor(br, bg, bb)
    pdf.rect(MARGIN, y, ZONE_COL_W, ROW_H, 'F')

    // Bordure gauche couleur zone
    pdf.setDrawColor(mr, mg, mb)
    pdf.setLineWidth(1.5)
    pdf.line(MARGIN, y, MARGIN, y + ROW_H)
    pdf.setLineWidth(0.2)
    pdf.setDrawColor(220, 220, 232)
    pdf.rect(MARGIN, y, ZONE_COL_W, ROW_H)

    // Nom zone
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7.5)
    pdf.setTextColor(Math.max(0, mr - 60), Math.max(0, mg - 60), Math.max(0, mb - 60))
    pdf.text(ZONE_LABELS[zoneId], MARGIN + 3, y + 5.5)

    // Nombre de tâches actives
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(6)
    pdf.setTextColor(120, 120, 140)
    pdf.text(`${zoneTasks.length} tâche${zoneTasks.length > 1 ? 's' : ''}`, MARGIN + 3, y + 10)

    // Cellules jours
    cx = MARGIN + ZONE_COL_W
    weekDates.forEach((dateStr, i) => {
      const date       = new Date(dateStr + 'T00:00:00')
      const isWeekend  = i >= 5
      const dayTasks   = zoneTasks.filter(t => isTaskScheduledForDate(t, date))

      const doneCount    = dayTasks.filter(t => getTaskStatus(t.id, dateStr, records) === 'done').length
      const lateCount    = dayTasks.filter(t => getTaskStatus(t.id, dateStr, records) === 'late').length
      const pendingCount = dayTasks.length - doneCount - lateCount

      // Fond cellule selon état global
      if (lateCount > 0) {
        pdf.setFillColor(255, 212, 212)       // rouge clair — tâche en retard
      } else if (doneCount === dayTasks.length && dayTasks.length > 0) {
        pdf.setFillColor(220, 242, 228)       // vert clair — tout fait
      } else if (isWeekend) {
        pdf.setFillColor(248, 248, 252)
      } else {
        pdf.setFillColor(br, bg, bb)          // fond zone
      }

      pdf.setDrawColor(220, 220, 232)
      pdf.setLineWidth(0.2)
      pdf.rect(cx, y, DAY_COL_W, ROW_H, 'FD')

      if (dayTasks.length === 0) {
        // Pas de tâche — tiret centré
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(7)
        pdf.setTextColor(190, 190, 210)
        pdf.text('—', cx + DAY_COL_W / 2, y + ROW_H / 2 + 1, { align: 'center' })
      } else {
        // Ligne par tâche
        const lineH = Math.min(4.2, (ROW_H - 3) / dayTasks.length)
        let ly = y + 3

        dayTasks.forEach(task => {
          const status = getTaskStatus(task.id, dateStr, records)
          const record = records.find(r => r.taskId === task.id && r.scheduledDate === dateStr)

          let icon, textR, textG, textB
          if (status === 'done') {
            icon   = '\u2713 '    // ✓
            textR  = 40; textG = 160; textB = 80
          } else if (status === 'late') {
            icon   = '! '
            textR  = 200; textG = 50; textB = 50
          } else {
            icon   = '\u2022 '   // •
            textR  = 100; textG = 100; textB = 120
          }

          pdf.setFont('helvetica', status === 'done' ? 'bold' : 'normal')
          pdf.setFontSize(5.5)
          pdf.setTextColor(textR, textG, textB)

          const maxW     = DAY_COL_W - 2.5
          const taskLine = truncate(pdf, icon + task.name, maxW)
          pdf.text(taskLine, cx + 1.5, ly)

          // Auteur si fait
          if (status === 'done' && record?.authorId) {
            const author = teamById[record.authorId]
            if (author) {
              pdf.setFont('helvetica', 'normal')
              pdf.setFontSize(4.8)
              pdf.setTextColor(80, 160, 100)
              const authorLine = truncate(pdf,
                `  ${author.name}${record.completedAt ? ' ' + fmtTime(record.completedAt) : ''}`,
                maxW,
              )
              pdf.text(authorLine, cx + 1.5, ly + lineH * 0.55)
            }
          }

          ly += lineH
        })
      }

      cx += DAY_COL_W
    })

    // Statistiques semaine dans la colonne zone (bas)
    const totalWeek = ZONE_ORDER.reduce((_, __) => _, 0) // juste pour le scope
    const weekDone  = weekDates.reduce((acc, dateStr) => {
      const date     = new Date(dateStr + 'T00:00:00')
      const dayTasks = zoneTasks.filter(t => isTaskScheduledForDate(t, date))
      return acc + dayTasks.filter(t => getTaskStatus(t.id, dateStr, records) === 'done').length
    }, 0)
    const weekTotal = weekDates.reduce((acc, dateStr) => {
      const date = new Date(dateStr + 'T00:00:00')
      return acc + zoneTasks.filter(t => isTaskScheduledForDate(t, date)).length
    }, 0)

    if (weekTotal > 0) {
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(6)
      const ratio  = weekDone / weekTotal
      const statR  = ratio === 1 ? 40 : 120
      const statG  = ratio === 1 ? 160 : 120
      const statB  = ratio === 1 ? 80  : 140
      pdf.setTextColor(statR, statG, statB)
      pdf.text(`${weekDone}/${weekTotal}`, MARGIN + 3, y + ROW_H - 3)
    }

    y += ROW_H
  })

  // Bordure tableau
  pdf.setDrawColor(180, 180, 200)
  pdf.setLineWidth(0.4)
  pdf.rect(MARGIN, MARGIN + HEADER_H, CW, COL_HEADER_H + ROW_H * 6)

  // ── Légende ──────────────────────────────────────────────────────────────────

  const legendY = PAGE_H - MARGIN - 6
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6)
  pdf.setTextColor(150, 150, 170)
  pdf.text('\u2713 = Effectué   \u2022 = Prévu   ! = Non effectué (hors délai)', MARGIN, legendY)

  // ── Signature HACCP ──────────────────────────────────────────────────────────

  pdf.setFont('helvetica', 'italic')
  pdf.setFontSize(6)
  pdf.setTextColor(180, 180, 180)
  pdf.text('Document de traçabilité HACCP — Paquet Hygiène UE 852/2004', PAGE_W - MARGIN, legendY, { align: 'right' })

  // ── Footer ───────────────────────────────────────────────────────────────────

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6.5)
  pdf.setTextColor(180, 180, 180)
  pdf.text(
    `Généré le ${fmtDateFull(new Date())}`,
    PAGE_W / 2, PAGE_H - MARGIN / 2,
    { align: 'center' },
  )

  // ── Sauvegarde ───────────────────────────────────────────────────────────────

  const filename = `Kubo-Nettoyage-S${wn}-${monday.getFullYear()}.pdf`
  const blob     = pdf.output('blob')
  const blobUrl  = URL.createObjectURL(blob)
  window.open(blobUrl, '_blank')
  pdf.save(filename)
}
