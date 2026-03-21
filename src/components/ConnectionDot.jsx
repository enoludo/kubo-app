// ─── Indicateur connexion discret — point + popover ───────────────────────────
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

// Couleur du point selon le statut combiné
function dotColor(statuses) {
  if (statuses.some(s => s === 'error' || s === 'expired')) return 'red'
  if (statuses.some(s => s === 'loading' || s === 'connecting' || s === 'syncing' || s === 'reconnecting')) return 'orange'
  if (statuses.every(s => s === 'synced' || s === 'connected' || s === 'idle')) return 'green'
  if (statuses.some(s => s === 'disconnected')) return 'red'
  return 'orange'
}

const DOT_COLORS = {
  green:  'var(--color-success)',
  orange: 'var(--color-warn)',
  red:    'var(--color-error)',
}

export default function ConnectionDot({ connections }) {
  // connections : [{ label, status, detail, onRetry, onConnect }]
  const [open, setOpen] = useState(false)
  const [pos,  setPos]  = useState({ top: 0, right: 0 })
  const btnRef  = useRef(null)
  const popRef  = useRef(null)

  const color = dotColor(connections.map(c => c.status))

  function toggle() {
    if (open) { setOpen(false); return }
    const rect = btnRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (popRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const popover = open && createPortal(
    <div
      ref={popRef}
      className="conn-popover"
      style={{ top: pos.top, right: pos.right }}
    >
      {connections.map((c, i) => (
        <div key={i} className="conn-popover-row">
          <span
            className="conn-popover-dot"
            style={{ background: DOT_COLORS[dotColor([c.status])] }}
          />
          <div className="conn-popover-info">
            <span className="conn-popover-label">{c.label}</span>
            {c.detail && <span className="conn-popover-detail">{c.detail}</span>}
          </div>
          {(c.status === 'error' || c.status === 'expired') && c.onRetry && (
            <button className="conn-popover-action" onClick={() => { c.onRetry(); setOpen(false) }}>
              Réessayer
            </button>
          )}
          {c.status === 'disconnected' && c.onConnect && (
            <button className="conn-popover-action" onClick={() => { c.onConnect(); setOpen(false) }}>
              Connecter
            </button>
          )}
        </div>
      ))}
    </div>,
    document.body
  )

  return (
    <>
      <button
        ref={btnRef}
        className="conn-dot-btn"
        onClick={toggle}
        aria-label="Statut des connexions"
      >
        <span
          className={`conn-dot${color === 'orange' ? ' conn-dot--pulse' : ''}`}
          style={{ background: DOT_COLORS[color] }}
        />
      </button>
      {popover}
    </>
  )
}
