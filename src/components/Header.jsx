import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ExcelIcon, PrintIcon, PdfIcon, MailIcon } from './Icons'

function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/>
      <circle cx="12" cy="19" r="1"/>
    </svg>
  )
}

export default function Header({ week, onExport, onOpenPicker, onPdfExport, pdfGenerating, onSendToAll }) {
  const { dates, prev, next, today } = week
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos,  setMenuPos]  = useState({ top: 0, right: 0 })
  const btnRef     = useRef(null)
  const dropRef    = useRef(null)

  const fmt   = (d, opts) => d.toLocaleDateString('fr-FR', opts)
  const month = fmt(dates[0], { month: 'long', year: 'numeric' })
  const range = `${dates[0].getDate()} – ${dates[6].getDate()} ${month}`

  function openMenu() {
    const rect = btnRef.current.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    setMenuOpen(v => !v)
  }

  useEffect(() => {
    if (!menuOpen) return
    function onMouseDown(e) {
      if (dropRef.current?.contains(e.target)) return
      if (btnRef.current?.contains(e.target)) return
      setMenuOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [menuOpen])

  function action(fn) {
    setMenuOpen(false)
    fn()
  }

  const dropdown = menuOpen && createPortal(
    <div
      ref={dropRef}
      className="header-menu-dropdown"
      style={{ top: menuPos.top, right: menuPos.right }}
    >
      <button onClick={() => action(onExport)}>
        <ExcelIcon size={15} /><span>Exporter Excel</span>
      </button>
      <button onClick={() => action(onPdfExport)} disabled={pdfGenerating}>
        <PdfIcon size={15} /><span>{pdfGenerating ? 'Génération…' : 'Exporter PDF'}</span>
      </button>
      <button onClick={() => action(() => window.print())}>
        <PrintIcon size={15} /><span>Imprimer</span>
      </button>
      <div className="emp-menu-divider" />
      <button onClick={() => action(onSendToAll)}>
        <MailIcon size={15} /><span>Envoyer à tous</span>
      </button>
    </div>,
    document.body
  )

  return (
    <header className="header">
      <div className="header-brand">
        <h1 className="header-title">KUBO</h1>
        <span className="header-tag">Planning</span>
      </div>

      <div className="header-nav-box">
        <div className="header-nav-center">
          <button className="nav-btn" onClick={prev} aria-label="Semaine précédente">‹</button>
          <button className="week-label week-label--btn" onClick={onOpenPicker}>{range}</button>
          <button className="nav-btn" onClick={next} aria-label="Semaine suivante">›</button>
        </div>
        <button
          ref={btnRef}
          className={`header-menu-btn${menuOpen ? ' active' : ''}`}
          onClick={openMenu}
          aria-label="Menu actions"
        >
          <DotsIcon />
        </button>
      </div>

      {dropdown}
    </header>
  )
}
