// ─── Startup Connection Modal ─────────────────────────────────────────────────
import Modal from '../design-system/components/Modal/Modal'

const LOADING   = new Set(['connecting', 'syncing', 'loading', 'reconnecting', 'idle'])
const CONNECTED = new Set(['synced', 'connected'])

function ServiceStatus({ status }) {
  if (LOADING.has(status))   return <span className="startup-spinner" />
  if (CONNECTED.has(status)) return <span className="startup-dot startup-dot--ok" />
  return <span className="startup-dot startup-dot--err" />
}

export default function StartupModal({ webflowStatus, webflowError, onDismiss }) {
  const allOk = CONNECTED.has(webflowStatus)

  return (
    <Modal overlayVariant="dark" size="sm">

        <div className="startup-head">
          <p className="startup-title">Connexion aux services</p>
          <p className="startup-sub">Kubo Pâtisserie — Planning</p>
        </div>

        <div className="startup-rows">

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
            <ServiceStatus status={webflowStatus} />
          </div>

        </div>

        <div className="startup-foot">
          <button className="startup-skip" onClick={onDismiss}>Passer</button>
          {allOk && (
            <button className="startup-continue" onClick={onDismiss}>Continuer</button>
          )}
        </div>

    </Modal>
  )
}
