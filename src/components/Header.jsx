import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { PrintIcon, PdfIcon, MailIcon } from './Icons'

function SaveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 19.078 19.078" fill="currentColor">
      <g transform="translate(0.164 0.164)">
        <path d="M16.992,18.914H1.758A1.924,1.924,0,0,1-.164,16.992V5.659A3.073,3.073,0,0,1,.742,3.472L3.47.742A3.073,3.073,0,0,1,5.658-.164H16.992a1.924,1.924,0,0,1,1.922,1.922V16.992A1.924,1.924,0,0,1,16.992,18.914ZM5.659,1.336A1.583,1.583,0,0,0,4.531,1.8L1.8,4.532a1.6,1.6,0,0,0-.467,1.126V16.992a.422.422,0,0,0,.422.422H16.992a.422.422,0,0,0,.422-.422V1.758a.422.422,0,0,0-.422-.422Z"/>
        <path d="M9.961,13.055a3.094,3.094,0,1,1,3.094-3.094A3.1,3.1,0,0,1,9.961,13.055Zm0-4.687a1.594,1.594,0,1,0,1.594,1.594A1.6,1.6,0,0,0,9.961,8.367Z"/>
        <path d="M13.477,4.852H7.617A1.924,1.924,0,0,1,5.7,2.93V.586a.75.75,0,0,1,1.5,0V2.93a.422.422,0,0,0,.422.422h5.859A.422.422,0,0,0,13.9,2.93V.586a.75.75,0,0,1,1.5,0V2.93A1.924,1.924,0,0,1,13.477,4.852Z"/>
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

// ── Indicateur de sync Google Sheets ─────────────────────────────────────────
function SyncButton({ status, error, onConnect, onDisconnect, onRetry }) {
  if (status === 'disconnected') {
    return (
      <button className="header-sync-btn header-sync-btn--connect" onClick={onConnect}>
        <SheetsIcon />
        <span>Connecter Sheets</span>
      </button>
    )
  }
  if (status === 'connecting' || status === 'syncing' || status === 'reconnecting') {
    const label = status === 'connecting' ? 'Connexion…'
                : status === 'reconnecting' ? 'Reconnexion…'
                : 'Sync…'
    return (
      <button className="header-sync-btn header-sync-btn--syncing" disabled>
        <span className="sync-dot sync-dot--spin" />
        <span>{label}</span>
      </button>
    )
  }
  if (status === 'expired') {
    return (
      <button className="header-sync-btn header-sync-btn--error" onClick={onRetry} title={error ?? 'Session expirée'}>
        <span className="sync-dot sync-dot--red" />
        <span>Session expirée</span>
      </button>
    )
  }
  if (status === 'error') {
    return (
      <button className="header-sync-btn header-sync-btn--error" onClick={onRetry} title={error ?? 'Erreur de synchronisation'}>
        <span className="sync-dot sync-dot--red" />
        <span>Reconnecter</span>
      </button>
    )
  }
  // synced
  return (
    <button className="header-sync-btn header-sync-btn--synced" onClick={onDisconnect} title="Synchronisé · Cliquer pour déconnecter">
      <span className="sync-dot sync-dot--green" />
    </button>
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
  syncStatus, syncError, onSyncConnect, onSyncDisconnect, onSyncRetry,
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
          <button className="nav-btn" onClick={prev} aria-label="Semaine précédente">‹</button>
          <button className="week-label week-label--btn" onClick={onOpenPicker}>{range}</button>
          <button className="nav-btn" onClick={next} aria-label="Semaine suivante">›</button>
        </div>

        {/* Droite : source données + sync + exports */}
        <div className="header-nav-right">
          {dataSource && (
            <span className={`data-source-badge data-source-badge--${dataSource}`}>
              {DATA_SOURCE_LABEL[dataSource]}
            </span>
          )}
          <SyncButton
            status={syncStatus}
            error={syncError}
            onConnect={onSyncConnect}
            onDisconnect={onSyncDisconnect}
            onRetry={onSyncRetry}
          />
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
