// ─── Startup Connection Modal ─────────────────────────────────────────────────

const LOADING  = new Set(['connecting', 'syncing', 'loading', 'reconnecting', 'idle'])
const CONNECTED = new Set(['synced', 'connected'])

function ServiceStatus({ status, onConnect }) {
  if (LOADING.has(status))   return <span className="startup-spinner" />
  if (CONNECTED.has(status)) return <span className="startup-dot startup-dot--ok" />
  if (status === 'error')    return <span className="startup-dot startup-dot--err" />
  // disconnected | expired
  return onConnect
    ? <button className="startup-action-btn" onClick={onConnect}>Connecter</button>
    : <span className="startup-dot startup-dot--err" />
}

export default function StartupModal({
  sheetsStatus, sheetsError,
  webflowStatus, webflowError,
  onSheetsConnect,
  onDismiss,
}) {
  const allOk = CONNECTED.has(sheetsStatus) && CONNECTED.has(webflowStatus)

  return (
    <div className="modal-overlay startup-overlay">
      <div className="modal startup-modal">

        <div className="startup-head">
          <p className="startup-title">Connexion aux services</p>
          <p className="startup-sub">Kubo Pâtisserie — Planning</p>
        </div>

        <div className="startup-rows">

          {/* Google Sheets */}
          <div className="startup-row">
            <div className="startup-logo startup-logo--sheets">G</div>
            <div className="startup-info">
              <span className="startup-svc-name">Google Sheets</span>
              <span className="startup-svc-desc">Planning & Commandes</span>
              {sheetsStatus === 'error' && sheetsError && (
                <span className="startup-svc-error">{sheetsError}</span>
              )}
            </div>
            <ServiceStatus status={sheetsStatus} onConnect={onSheetsConnect} />
          </div>

          {/* Webflow */}
          <div className="startup-row">
            <div className="startup-logo startup-logo--webflow">W</div>
            <div className="startup-info">
              <span className="startup-svc-name">Webflow</span>
              <span className="startup-svc-desc">Commandes en ligne</span>
              {webflowStatus === 'error' && webflowError && (
                <span className="startup-svc-error">{webflowError}</span>
              )}
            </div>
            <ServiceStatus status={webflowStatus} onConnect={null} />
          </div>

        </div>

        <div className="startup-foot">
          <button className="startup-skip" onClick={onDismiss}>Passer</button>
          {allOk && (
            <button className="startup-continue" onClick={onDismiss}>Continuer</button>
          )}
        </div>

      </div>
    </div>
  )
}
