import { useState, useRef, useEffect } from 'react'
import { PdfIcon, MailIcon } from './Icons'
import Dropdown from '../design-system/components/Dropdown/Dropdown'

function SaveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20.5" height="22.5" viewBox="0 0 20.5 22.5" fill='currentcolor'>
  <path id="Union_15" data-name="Union 15" d="M2.935,22.276a3,3,0,0,1-2.7-2.719C.08,17.934,0,15.9,0,13.5S.08,9.066.237,7.443a3,3,0,0,1,2.7-2.719.75.75,0,0,1,.156,1.492A1.5,1.5,0,0,0,1.73,7.587C1.625,8.671,1.5,10.575,1.5,13.5s.125,4.829.229,5.913a1.5,1.5,0,0,0,1.361,1.371A48.418,48.418,0,0,0,8,21a48.449,48.449,0,0,0,4.91-.216,1.5,1.5,0,0,0,1.36-1.371.75.75,0,0,1,1.492.144,3,3,0,0,1-2.7,2.719A50.169,50.169,0,0,1,8,22.5,50.169,50.169,0,0,1,2.935,22.276Zm4.5-4.5a3,3,0,0,1-2.7-2.719C4.58,13.434,4.5,11.4,4.5,9s.08-4.434.237-6.057A3,3,0,0,1,7.435.224,50.169,50.169,0,0,1,12.5,0c.56,0,1.12.007,1.664.02a.729.729,0,0,1,.192.031,9.171,9.171,0,0,1,3.6,2.484,9.583,9.583,0,0,1,2.465,3.494.775.775,0,0,1,.038.213C20.487,7.1,20.5,8.024,20.5,9c0,2.4-.08,4.434-.238,6.057a3,3,0,0,1-2.7,2.719A50.169,50.169,0,0,1,12.5,18,50.169,50.169,0,0,1,7.435,17.776ZM7.59,1.716A1.494,1.494,0,0,0,6.23,3.087C6.125,4.171,6,6.075,6,9s.125,4.829.23,5.913a1.5,1.5,0,0,0,1.361,1.371,48.418,48.418,0,0,0,4.91.216,48.462,48.462,0,0,0,4.91-.216,1.5,1.5,0,0,0,1.36-1.371C18.875,13.829,19,11.925,19,9c0-.612-.005-1.205-.016-1.772q-.189.006-.4.006c-.658,0-1.469-.042-2.427-.127A3.057,3.057,0,0,1,13.37,4.319a24.629,24.629,0,0,1-.12-2.815c-.249,0-.5,0-.749,0A48.449,48.449,0,0,0,7.59,1.716Zm7.275,2.472a1.56,1.56,0,0,0,1.424,1.424c1.051.093,1.8.123,2.34.122A11.018,11.018,0,0,0,16.9,3.6a11.025,11.025,0,0,0-2.154-1.729C14.743,2.482,14.783,3.271,14.864,4.189Z"/>
</svg>


  )
}

function ShareIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="21.5" height="22.5" viewBox="0 0 21.5 22.5" fill='currentcolor'>
  <path id="Union_14" data-name="Union 14" d="M3.1,22.566a3.086,3.086,0,0,1-2.9-2.75c-.107-1-.2-3.409-.2-5.255s.091-4.253.2-5.255A3.088,3.088,0,0,1,3.1,6.554c.865-.064,2.387-.112,3.5-.148l.626-.021a.75.75,0,0,1,.051,1.5l-.629.02c-1.1.035-2.6.084-3.433.145A1.588,1.588,0,0,0,1.689,9.464c-.1.943-.189,3.325-.189,5.1s.088,4.153.189,5.1A1.586,1.586,0,0,0,3.214,21.07c1.436.11,3.91.24,7.536.24s6.1-.13,7.536-.24a1.587,1.587,0,0,0,1.525-1.414c.1-.943.189-3.325.189-5.1s-.088-4.152-.189-5.095A1.589,1.589,0,0,0,18.284,8.05c-.829-.061-2.33-.11-3.426-.144l-.634-.021a.75.75,0,1,1,.051-1.5l.63.021c1.11.035,2.629.084,3.49.148A3.089,3.089,0,0,1,21.3,9.305c.107,1,.2,3.409.2,5.254s-.091,4.253-.2,5.256a3.086,3.086,0,0,1-2.9,2.75c-1.462.112-3.976.245-7.65.245S4.562,22.677,3.1,22.566ZM10,10.881V2.872L8.094,4.778a.75.75,0,1,1-1.06-1.061L10.22.53a.751.751,0,0,1,1.061,0l3.187,3.187a.75.75,0,0,1-1.061,1.061L11.5,2.871v8.01a.75.75,0,0,1-1.5,0Z" transform="translate(0 -0.311)"/>
</svg>

  )
}

// ── Dropdown unifié : Importer + Enregistrer ──────────────────────────────────
function PlanDropdown({
  copiedPlan, templates, onPastePlan, onLoadTemplate,
  onCopyPlan, onSaveTemplate, onReset,
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('menu') // 'menu' | 'naming' | 'confirm-reset'
  const [name, setName] = useState('')
  const btnRef   = useRef(null)
  const inputRef = useRef(null)

  function toggle() {
    if (open) { setOpen(false); return }
    setMode('menu')
    setName('')
    setOpen(true)
  }

  useEffect(() => {
    if (open && mode === 'naming') inputRef.current?.focus()
  }, [open, mode])

  function action(fn) { fn(); setOpen(false) }

  function handleSave() {
    if (!name.trim()) return
    onSaveTemplate(name.trim())
    setOpen(false); setMode('menu'); setName('')
  }

  return (
    <>
      <button
        ref={btnRef}
        className={`header-menu-btn${open ? ' active' : ''}`}
        onClick={toggle}
        aria-label="Planning — importer / enregistrer"
      >
        <SaveIcon />
      </button>
      <Dropdown
        triggerRef={btnRef}
        isOpen={open}
        onClose={() => { setOpen(false); setMode('menu') }}
        align="left"
        className="header-menu-dropdown"
      >
        {mode === 'menu' ? (
          <>
            <button
              onClick={() => action(onPastePlan)}
              disabled={!copiedPlan}
              title={copiedPlan ? `Planning copié : ${copiedPlan.weekLabel}` : 'Aucun planning copié'}
            >
              Coller un planning
              {copiedPlan && <span className="header-dropdown-hint">{copiedPlan.weekLabel}</span>}
            </button>
            {templates.length > 0 && templates.map(tpl => (
              <button key={tpl.id} onClick={() => action(() => onLoadTemplate(tpl.id))}>
                {tpl.name}
              </button>
            ))}
            <Dropdown.Divider />
            <button onClick={() => action(onCopyPlan)}>Copier ce planning</button>
            <button onClick={() => setMode('naming')}>Enregistrer comme modèle</button>
            <Dropdown.Divider />
            <button className="header-dropdown-danger" onClick={() => setMode('confirm-reset')}>
              Réinitialiser les données de démo
            </button>
          </>
        ) : mode === 'naming' ? (
          <div className="header-dropdown-naming">
            <input
              ref={inputRef}
              type="text"
              placeholder="Nom du modèle…"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') setMode('menu')
              }}
            />
            <div className="header-dropdown-naming-actions">
              <button className="header-dropdown-cancel" onClick={() => setMode('menu')}>Annuler</button>
              <button className="header-dropdown-confirm" onClick={handleSave} disabled={!name.trim()}>
                Sauvegarder
              </button>
            </div>
          </div>
        ) : (
          <div className="header-dropdown-naming">
            <span className="header-dropdown-confirm-msg">
              Effacer toutes les modifications et revenir aux données de démonstration ?
            </span>
            <div className="header-dropdown-naming-actions">
              <button className="header-dropdown-cancel" onClick={() => setMode('menu')}>Annuler</button>
              <button className="header-dropdown-danger-confirm" onClick={() => { onReset(); setOpen(false); setMode('menu') }}>
                Réinitialiser
              </button>
            </div>
          </div>
        )}
      </Dropdown>
    </>
  )
}


function SheetsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3"  y1="9"  x2="21" y2="9"/>
      <line x1="3"  y1="15" x2="21" y2="15"/>
      <line x1="9"  y1="3"  x2="9"  y2="21"/>
      <line x1="15" y1="3"  x2="15" y2="21"/>
    </svg>
  )
}

// ── Header principal ──────────────────────────────────────────────────────────
const DATA_SOURCE_LABEL = {
  synced:  '☁\u00A0Synchronisé',
  session: '💾\u00A0Session locale',
  demo:    '📋\u00A0Données démo',
}

export default function Header({
  week, onOpenPicker, onPdfExport, pdfGenerating, onSendToAll,
  copiedPlan, templates, onCopyPlan, onPastePlan, onSaveTemplate, onLoadTemplate,
  dataSource, onReset,
}) {
  const { dates, prev, next } = week
  const [menuOpen, setMenuOpen] = useState(false)
  const btnRef = useRef(null)

  const fmt   = (d, opts) => d.toLocaleDateString('fr-FR', opts)
  const month = fmt(dates[0], { month: 'long', year: 'numeric' })
  const range = `${dates[0].getDate()} – ${dates[6].getDate()} ${month}`

  function action(fn) { setMenuOpen(false); fn() }

  const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID

  return (
    <header className="header">
      <div className="header-nav-box">

        {/* Gauche : actions planning */}
        <div className="header-nav-left">
          <PlanDropdown
            copiedPlan={copiedPlan}
            templates={templates}
            onPastePlan={onPastePlan}
            onLoadTemplate={onLoadTemplate}
            onCopyPlan={onCopyPlan}
            onSaveTemplate={onSaveTemplate}
            onReset={onReset}
          />
        </div>

        {/* Centre : navigation semaine */}
        <div className="header-nav-center">
          <button className="nav-btn" onClick={prev} aria-label="Semaine précédente"><svg xmlns="http://www.w3.org/2000/svg" width="12.728" height="12.728" fill="currentcolor" viewBox="0 0 12.728 12.728">
  <path id="Tracé_12" data-name="Tracé 12" d="M613.332,602.91h-2v-9h9v2h-7Z" transform="translate(-852.235 18.683) rotate(-45)" fill="#7e7e7e"/>
</svg>
</button>
          <button className="week-label week-label--btn" onClick={onOpenPicker}>{range}</button>
          <button className="nav-btn" onClick={next} aria-label="Semaine suivante"><svg xmlns="http://www.w3.org/2000/svg" width="12.728" height="12.728" fill="currentcolor" viewBox="0 0 12.728 12.728">
  <path id="Tracé_13" data-name="Tracé 13" d="M8,9H-1V0H1V7H8Z" transform="translate(5.657 12.021) rotate(-135)" fill="#7e7e7e"/>
</svg>
</button>
        </div>

        {/* Droite : source données + sync + exports */}
        <div className="header-nav-right">
          {dataSource && (
            <span className={`data-source-badge data-source-badge--${dataSource}`}>
              {DATA_SOURCE_LABEL[dataSource]}
            </span>
          )}
          <button
            ref={btnRef}
            className={`header-menu-btn${menuOpen ? ' active' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Menu actions"
          >
            <ShareIcon />
          </button>
        </div>

      </div>
      <Dropdown
        triggerRef={btnRef}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        align="right"
        className="header-menu-dropdown"
      >
        {sheetId && (
          <button onClick={() => action(() => window.open(`https://docs.google.com/spreadsheets/d/${sheetId}`, '_blank'))}>
            <SheetsIcon /><span>Ouvrir Google Sheet</span>
          </button>
        )}
        <button onClick={() => action(onPdfExport)} disabled={pdfGenerating}>
          <PdfIcon size={15} /><span>{pdfGenerating ? 'Génération…' : 'Exporter PDF'}</span>
        </button>
        <Dropdown.Divider />
        <button onClick={() => action(onSendToAll)}>
          <MailIcon size={15} /><span>Envoyer à tous</span>
        </button>
      </Dropdown>
    </header>
  )
}
