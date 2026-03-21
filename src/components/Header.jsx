import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { PdfIcon, MailIcon } from './Icons'
import ConnectionDot from './ConnectionDot'

function SaveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="19.078" height="16.734" fill="currentcolor" viewBox="0 0 19.078 16.734">
  <g id="Groupe_141" data-name="Groupe 141" transform="translate(0.164 -1.008)">
    <path id="Tracé_92" data-name="Tracé 92" d="M16.992,17.742H6.445A1.868,1.868,0,0,1,4.523,15.82V8.789A1.868,1.868,0,0,1,6.445,6.867H16.992a1.868,1.868,0,0,1,1.922,1.922V15.82A1.868,1.868,0,0,1,16.992,17.742ZM6.023,8.8V15.82c0,.269.1.318.171.355a.765.765,0,0,0,.251.067H16.992c.269,0,.318-.1.355-.171a.765.765,0,0,0,.067-.251V8.789c0-.269-.1-.318-.171-.355a.765.765,0,0,0-.251-.067H6.445c-.258,0-.311.094-.343.15A.708.708,0,0,0,6.023,8.8Z"/>
    <path id="Tracé_93" data-name="Tracé 93" d="M2.93,11.883H1.758A1.924,1.924,0,0,1-.164,9.961V2.93A1.924,1.924,0,0,1,1.758,1.008H12.3A1.924,1.924,0,0,1,14.227,2.93V5.273a.75.75,0,0,1-1.5,0V2.93a.422.422,0,0,0-.422-.422H1.758a.422.422,0,0,0-.422.422V9.961a.422.422,0,0,0,.422.422H2.93a.75.75,0,0,1,0,1.5Z"/>
  </g>
</svg>

  )
}

function ShareIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="17" viewBox="0 0 14.391 19.078" fill="currentColor">
      <g transform="translate(-2.18 0.164)">
        <path d="M14.648,18.914H4.1A1.924,1.924,0,0,1,2.18,16.992V7.617A1.924,1.924,0,0,1,4.1,5.7H5.273a.75.75,0,0,1,0,1.5H4.1a.422.422,0,0,0-.422.422v9.375a.422.422,0,0,0,.422.422H14.648a.422.422,0,0,0,.422-.422V7.617a.422.422,0,0,0-.422-.422H13.477a.75.75,0,0,1,0-1.5h1.172A1.924,1.924,0,0,1,16.57,7.617v9.375A1.924,1.924,0,0,1,14.648,18.914Z"/>
        <path d="M9.375,9.539a.75.75,0,0,1-.75-.75V.586a.75.75,0,0,1,1.5,0v8.2A.75.75,0,0,1,9.375,9.539Z"/>
        <path d="M12.3,4.266a.748.748,0,0,1-.53-.22l-2.4-2.4-2.4,2.4A.75.75,0,0,1,5.915,2.985L8.845.056a.75.75,0,0,1,1.061,0l2.93,2.93a.75.75,0,0,1-.53,1.28Z"/>
      </g>
    </svg>
  )
}

// ── Dropdown unifié : Importer + Enregistrer ──────────────────────────────────
function PlanDropdown({
  copiedPlan, templates, onPastePlan, onLoadTemplate,
  onCopyPlan, onSaveTemplate, onReset,
}) {
  const [open,    setOpen]    = useState(false)
  const [mode,    setMode]    = useState('menu') // 'menu' | 'naming' | 'confirm-reset'
  const [name,    setName]    = useState('')
  const [pos,     setPos]     = useState({ top: 0, left: 0 })
  const btnRef   = useRef(null)
  const dropRef  = useRef(null)
  const inputRef = useRef(null)

  function toggle() {
    if (open) { setOpen(false); return }
    const rect = btnRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 6, left: rect.left })
    setMode('menu')
    setName('')
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    if (mode === 'naming') inputRef.current?.focus()
    function onDown(e) {
      if (dropRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return
      setOpen(false); setMode('menu')
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, mode])

  function action(fn) { fn(); setOpen(false) }

  function handleSave() {
    if (!name.trim()) return
    onSaveTemplate(name.trim())
    setOpen(false); setMode('menu'); setName('')
  }

  const dropdown = open && createPortal(
    <div ref={dropRef} className="header-menu-dropdown" style={{ top: pos.top, left: pos.left }}>
      {mode === 'menu' ? (
        <>
          {/* Section Importer */}
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
          <div className="emp-menu-divider" />
          {/* Section Enregistrer */}
          <button onClick={() => action(onCopyPlan)}>Copier ce planning</button>
          <button onClick={() => setMode('naming')}>Enregistrer comme modèle</button>
          <div className="emp-menu-divider" />
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
    </div>,
    document.body
  )

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
      {dropdown}
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
  syncStatus, syncError, onSyncConnect, onSyncRetry,
  dataSource, onReset,
}) {
  const { dates, prev, next } = week
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos,  setMenuPos]  = useState({ top: 0, right: 0 })
  const btnRef  = useRef(null)
  const dropRef = useRef(null)

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

  function action(fn) { setMenuOpen(false); fn() }

  const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID

  const dropdown = menuOpen && createPortal(
    <div ref={dropRef} className="header-menu-dropdown"
      style={{ top: menuPos.top, right: menuPos.right }}>
      {sheetId && (
        <button onClick={() => action(() => window.open(`https://docs.google.com/spreadsheets/d/${sheetId}`, '_blank'))}>
          <SheetsIcon /><span>Ouvrir Google Sheet</span>
        </button>
      )}
      <button onClick={() => action(onPdfExport)} disabled={pdfGenerating}>
        <PdfIcon size={15} /><span>{pdfGenerating ? 'Génération…' : 'Exporter PDF'}</span>
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
          <ConnectionDot connections={[{
            label:     'Google Sheets',
            status:    syncStatus === 'synced' ? 'connected' : syncStatus,
            detail:    syncStatus === 'synced'       ? 'Synchronisé'
                     : syncStatus === 'disconnected' ? 'Non connecté'
                     : syncStatus === 'expired'      ? 'Session expirée'
                     : syncStatus === 'error'        ? (syncError ?? 'Erreur de synchronisation')
                     : 'Connexion en cours…',
            onConnect: syncStatus === 'disconnected' ? onSyncConnect  : undefined,
            onRetry:   (syncStatus === 'error' || syncStatus === 'expired') ? onSyncRetry : undefined,
          }]} />
          <button
            ref={btnRef}
            className={`header-menu-btn${menuOpen ? ' active' : ''}`}
            onClick={openMenu}
            aria-label="Menu actions"
          >
            <ShareIcon />
          </button>
        </div>

      </div>
      {dropdown}
    </header>
  )
}
