import { ExcelIcon, PrintIcon, PdfIcon, MailIcon } from './Icons'

export default function Header({ week, onExport, onOpenPicker, onPdfExport, pdfGenerating, onSendToAll }) {
  const { dates, prev, next, today } = week

  const fmt = (d, opts) => d.toLocaleDateString('fr-FR', opts)
  const month = fmt(dates[0], { month: 'long', year: 'numeric' })
  const range = `${dates[0].getDate()} – ${dates[6].getDate()} ${month}`

  return (
    <header className="header">
      <div className="header-brand">
        <span className="header-ornament">✦</span>
        <h1 className="header-title">Kubo Pâtisserie</h1>
        <span className="header-tag">Planning</span>
      </div>

      <div className="header-nav">
        <button className="nav-btn" onClick={prev} aria-label="Semaine précédente">‹</button>
        <button className="week-label week-label--btn" onClick={onOpenPicker}>{range}</button>
        <button className="nav-btn" onClick={next} aria-label="Semaine suivante">›</button>
        <button className="today-btn" onClick={today}>Aujourd'hui</button>
      </div>

      <div className="header-actions">
        <button className="export-btn" onClick={onExport}>
          <ExcelIcon /><span>Exporter</span>
        </button>
        <button className="pdf-btn" onClick={onPdfExport} disabled={pdfGenerating}>
          <PdfIcon /><span>{pdfGenerating ? 'Génération…' : 'PDF'}</span>
        </button>
        <button className="print-btn" onClick={() => window.print()}>
          <PrintIcon /><span>Imprimer</span>
        </button>
        <button className="mail-btn" onClick={onSendToAll}>
          <MailIcon /><span>Envoyer à tous</span>
        </button>
      </div>
    </header>
  )
}
